from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.authtoken.models import Token
from django.contrib.auth import get_user_model
from django.db.models import Count, Q
from django.utils import timezone
from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string
import uuid
import random
import string
import hashlib

from .models import Habit, CheckIn, EmailTemplate, SystemSettings, EmailQueue, Captcha, Article
from .serializers import (
    UserSerializer, UserDetailSerializer, UserProfileSerializer,
    HabitSerializer, HabitDetailSerializer, CheckInSerializer, RegisterSerializer,
    PasswordChangeSerializer, PasswordResetRequestSerializer, PasswordResetConfirmSerializer,
    EmailTemplateSerializer, SystemSettingsSerializer, EmailQueueSerializer, CaptchaSerializer,
    ArticleSerializer
)

User = get_user_model()


class IsAdminUser(permissions.BasePermission):
    """检查是否为管理员"""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_admin


def sha256_hash(password):
    """SHA256加密"""
    return hashlib.sha256(password.encode()).hexdigest()


def send_email(to_email, subject, content):
    """发送邮件"""
    # 检查是否启用邮件发送
    enable_send = SystemSettings.objects.filter(key='email_enable_send', value='true').first()
    if not enable_send:
        return False, "邮件发送未启用"

    try:
        # 创建邮件队列
        EmailQueue.objects.create(
            to_email=to_email,
            subject=subject,
            content=content
        )
        return True, None
    except Exception as e:
        return False, str(e)


def get_email_template(template_type, **kwargs):
    """获取邮件模板"""
    try:
        template = EmailTemplate.objects.get(type=template_type, is_active=True)
        subject = template.subject.format(**kwargs)
        content = template.content.format(**kwargs)
        return subject, content
    except EmailTemplate.DoesNotExist:
        return None, None


class CaptchaView(APIView):
    """图形验证码"""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        from captcha.image import ImageCaptcha
        import os

        # 生成验证码
        code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
        key = uuid.uuid4().hex

        # 生成图片
        image = ImageCaptcha(width=120, height=40)
        data = image.generate(code)

        # 保存到临时文件
        import tempfile
        from django.core.files.base import ContentFile

        captcha = Captcha.objects.create(
            key=key,
            code=code.upper(),
            expires_at=timezone.now() + timezone.timedelta(minutes=5)
        )

        # 保存图片
        captcha.image.save(f'{key}.png', ContentFile(data.read()), save=True)

        return Response(CaptchaSerializer(captcha, context={'request': request}).data)


class RegisterView(APIView):
    """用户注册"""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        # 验证验证码
        captcha_key = request.data.get('captcha_key')
        captcha_code = request.data.get('captcha_code', '').upper()

        if captcha_key and captcha_code:
            try:
                captcha = Captcha.objects.get(key=captcha_key)
                if captcha.is_expired():
                    return Response({'captcha': '验证码已过期'}, status=status.HTTP_400_BAD_REQUEST)
                if captcha.code != captcha_code:
                    return Response({'captcha': '验证码错误'}, status=status.HTTP_400_BAD_REQUEST)
            except Captcha.DoesNotExist:
                pass

        password = request.data.get('password', '')
        password_confirm = request.data.get('password_confirm', '')

        data = request.data.copy()
        data['password'] = password
        data['password_confirm'] = password_confirm

        serializer = RegisterSerializer(data=data)
        if serializer.is_valid():
            user = serializer.save()
            # 不创建token，需要邮箱验证后才能登录

            # 发送验证邮件
            token_str = user.generate_email_verification_token()
            frontend_url = settings.FRONTEND_URL
            subject, content = get_email_template('verify_email',
                nickname=user.nickname or user.email,
                verification_url=f"{frontend_url}/verify-email/?token={token_str}"
            )
            if subject:
                send_email(user.email, subject, content)

            return Response({
                'message': '注册成功，请前往邮箱验证邮件以激活账号',
                'email': user.email
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    """用户登录 - 支持用户名或邮箱登录"""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        # 验证验证码
        captcha_key = request.data.get('captcha_key')
        captcha_code = request.data.get('captcha_code', '').upper()

        if captcha_key and captcha_code:
            try:
                captcha = Captcha.objects.get(key=captcha_key)
                if captcha.is_expired():
                    return Response({'captcha': '验证码已过期'}, status=status.HTTP_400_BAD_REQUEST)
                if captcha.code != captcha_code:
                    return Response({'captcha': '验证码错误'}, status=status.HTTP_400_BAD_REQUEST)
            except Captcha.DoesNotExist:
                pass

        identifier = request.data.get('username')  # 可以是用户名或邮箱
        password = request.data.get('password', '')

        # 支持用户名或邮箱登录
        try:
            if '@' in identifier:
                user = User.objects.get(email=identifier)
            else:
                user = User.objects.get(username=identifier)
        except User.DoesNotExist:
            return Response({'detail': '用户名/邮箱或密码错误'}, status=status.HTTP_400_BAD_REQUEST)

        # 使用 Django 的密码验证机制
        if not user.check_password(password):
            return Response({'detail': '用户名/邮箱或密码错误'}, status=status.HTTP_400_BAD_REQUEST)

        # 检查邮箱是否已验证
        if not user.is_email_verified:
            return Response({
                'detail': '请先验证邮箱后再登录',
                'email_verified': False
            }, status=status.HTTP_400_BAD_REQUEST)

        token, created = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'user': UserSerializer(user).data
        })


class LogoutView(APIView):
    """用户登出"""

    def post(self, request):
        request.user.auth_token.delete()
        return Response({'detail': '登出成功'})


class PasswordChangeView(APIView):
    """修改密码"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = PasswordChangeSerializer(data=request.data)
        if serializer.is_valid():
            old_password = request.data.get('old_password', '')
            new_password = request.data.get('new_password', '')

            if not request.user.check_password(old_password):
                return Response({'old_password': '原密码错误'}, status=status.HTTP_400_BAD_REQUEST)

            request.user.set_password(new_password)
            request.user.save()

            # 重新生成token
            request.user.auth_token.delete()
            token = Token.objects.create(user=request.user)

            return Response({
                'token': token.key,
                'detail': '密码修改成功'
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PasswordResetRequestView(APIView):
    """找回密码"""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        # 验证验证码
        captcha_key = request.data.get('captcha_key')
        captcha_code = request.data.get('captcha_code', '').upper()

        if captcha_key and captcha_code:
            try:
                captcha = Captcha.objects.get(key=captcha_key)
                if captcha.is_expired():
                    return Response({'captcha': '验证码已过期'}, status=status.HTTP_400_BAD_REQUEST)
                if captcha.code != captcha_code:
                    return Response({'captcha': '验证码错误'}, status=status.HTTP_400_BAD_REQUEST)
            except Captcha.DoesNotExist:
                pass

        serializer = PasswordResetRequestSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            try:
                user = User.objects.get(email=email)
                token_str = user.generate_password_reset_token()
                frontend_url = settings.FRONTEND_URL

                subject, content = get_email_template('reset_password',
                    nickname=user.nickname or user.email,
                    reset_url=f"{frontend_url}/reset-password/?token={token_str}"
                )
                if subject:
                    send_email(user.email, subject, content)
            except User.DoesNotExist:
                pass  # 不暴露用户是否存在

            return Response({'detail': '如果邮箱存在，将收到密码重置邮件'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PasswordResetConfirmView(APIView):
    """密码重置确认"""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        if serializer.is_valid():
            token = request.data.get('token')
            new_password = request.data.get('new_password')

            try:
                user = User.objects.get(password_reset_token=token)
                if user.password_reset_expires < timezone.now():
                    return Response({'token': '重置链接已过期'}, status=status.HTTP_400_BAD_REQUEST)

                user.set_password(new_password)
                user.password_reset_token = ''
                user.password_reset_expires = None
                user.save()

                return Response({'detail': '密码重置成功'})
            except User.DoesNotExist:
                return Response({'token': '重置链接无效'}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class VerifyEmailView(APIView):
    """验证邮箱"""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        token = request.data.get('token')
        try:
            user = User.objects.get(email_verification_token=token)
            user.is_email_verified = True
            user.email_verification_token = ''
            user.save()
            return Response({'detail': '邮箱验证成功'})
        except User.DoesNotExist:
            return Response({'token': '验证链接无效'}, status=status.HTTP_400_BAD_REQUEST)


class UserProfileView(APIView):
    """用户资料视图"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """获取当前用户资料"""
        serializer = UserDetailSerializer(request.user, context={'request': request})
        return Response(serializer.data)

    def patch(self, request):
        """更新当前用户资料"""
        if request.user.username == 'administrator':
            data = request.data.copy()
            data.pop('is_staff', None)
            data.pop('is_admin', None)
        else:
            data = request.data
        serializer = UserProfileSerializer(request.user, data=data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserViewSet(viewsets.ModelViewSet):
    """用户视图集"""
    queryset = User.objects.all()
    serializer_class = UserSerializer

    def get_permissions(self):
        if self.action in ['profile']:
            return [permissions.IsAuthenticated()]
        if self.action in ['create', 'destroy']:
            return [IsAdminUser()]
        return [IsAdminUser()]

    @action(detail=False, methods=['get', 'patch'])
    def profile(self, request):
        if request.method == 'GET':
            serializer = UserDetailSerializer(request.user, context={'request': request})
            return Response(serializer.data)
        else:
            if request.user.username == 'administrator':
                data = request.data.copy()
                data.pop('is_staff', None)
                data.pop('is_admin', None)
            else:
                data = request.data
            serializer = UserProfileSerializer(request.user, data=data, partial=True, context={'request': request})
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class HabitViewSet(viewsets.ModelViewSet):
    """习惯视图集"""
    serializer_class = HabitSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Habit.objects.filter(user=self.request.user)

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return HabitDetailSerializer
        return HabitSerializer

    @action(detail=True, methods=['get'])
    def checkins(self, request, pk=None):
        habit = self.get_object()
        checkins = habit.checkins.all()
        serializer = CheckInSerializer(checkins, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def checkin(self, request):
        habit_id = request.data.get('habit_id')
        try:
            habit = Habit.objects.get(id=habit_id, user=request.user)
        except Habit.DoesNotExist:
            return Response({'detail': '习惯不存在'}, status=status.HTTP_404_NOT_FOUND)

        today = timezone.now().date()
        checkin, created = CheckIn.objects.get_or_create(
            habit=habit,
            user=request.user,
            date=today,
            defaults={'status': 'completed'}
        )

        if not created and checkin.status != 'completed':
            checkin.status = 'completed'
            checkin.save()

        return Response({'detail': '打卡成功', 'date': today}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['delete'])
    def undo(self, request, pk=None):
        habit = self.get_object()
        date = request.query_params.get('date')

        if not date:
            return Response({'detail': '请指定日期'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            checkin = CheckIn.objects.get(habit=habit, date=date)
            checkin.delete()
            return Response({'detail': '撤销成功'})
        except CheckIn.DoesNotExist:
            return Response({'detail': '打卡记录不存在'}, status=status.HTTP_404_NOT_FOUND)


class AdminStatsView(APIView):
    """管理后台统计数据"""
    permission_classes = [IsAdminUser]

    def get(self, request):
        total_users = User.objects.count()
        total_habits = Habit.objects.count()
        total_checkins = CheckIn.objects.filter(status='completed').count()

        habits_with_completion = Habit.objects.annotate(
            completed_count=Count('checkins', filter=Q(checkins__status='completed'))
        )
        avg_completion = 0
        if habits_with_completion.exists():
            avg_completion = int(
                sum(h.completed_count for h in habits_with_completion) / habits_with_completion.count()
            )
            avg_completion = min(100, int((avg_completion / 21) * 100))

        return Response({
            'total_users': total_users,
            'total_habits': total_habits,
            'total_checkins': total_checkins,
            'completion_rate': avg_completion
        })


class AdminUserViewSet(viewsets.ModelViewSet):
    """管理后台用户视图"""
    queryset = User.objects.all().order_by('-date_joined')
    serializer_class = UserSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        queryset = super().get_queryset()
        queryset = queryset.annotate(habit_count=Count('habits'))
        return queryset

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.username == 'administrator':
            return Response({'detail': '管理员账号不允许删除'}, status=status.HTTP_400_BAD_REQUEST)
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=['post'])
    def reset_password(self, request, pk=None):
        """管理员重置用户密码"""
        user = self.get_object()
        method = request.data.get('method', 'random')  # random or email

        # 生成随机密码
        random_password = ''.join(random.choices(string.ascii_letters + string.digits, k=12))

        if method == 'random':
            user.password = sha256_hash(random_password)
            user.save()
            return Response({
                'detail': '密码已重置',
                'new_password': random_password  # 实际应该通过安全方式发送
            })
        else:
            # 发送邮件
            token_str = user.generate_password_reset_token()
            frontend_url = settings.FRONTEND_URL
            subject, content = get_email_template('admin_reset_password',
                nickname=user.nickname or user.email,
                reset_url=f"{frontend_url}/reset-password/?token={token_str}"
            )
            if subject:
                send_email(user.email, subject, content)
                return Response({'detail': '密码重置邮件已发送'})
            return Response({'detail': '邮件发送失败'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class EmailTemplateViewSet(viewsets.ModelViewSet):
    """邮件模板管理"""
    queryset = EmailTemplate.objects.all()
    serializer_class = EmailTemplateSerializer
    permission_classes = [IsAdminUser]


class SystemSettingsViewSet(viewsets.ModelViewSet):
    """系统设置管理"""
    queryset = SystemSettings.objects.all()
    serializer_class = SystemSettingsSerializer
    permission_classes = [IsAdminUser]


class EmailQueueViewSet(viewsets.ReadOnlyModelViewSet):
    """邮件队列管理"""
    queryset = EmailQueue.objects.all()
    serializer_class = EmailQueueSerializer
    permission_classes = [IsAdminUser]


class ArticleViewSet(viewsets.ReadOnlyModelViewSet):
    """文章列表（公开）"""
    queryset = Article.objects.filter(status='published')
    serializer_class = ArticleSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        # 按类型筛选
        article_type = self.request.query_params.get('type')
        if article_type:
            queryset = queryset.filter(type=article_type)
        return queryset

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        # 增加浏览量
        instance.views += 1
        instance.save(update_fields=['views'])
        serializer = self.get_serializer(instance)
        return Response(serializer.data)


class PageView(APIView):
    """页面视图 - 通过slug访问"""

    def get(self, request, slug):
        try:
            article = Article.objects.get(slug=slug, type='page', status='published')
            # 增加浏览量
            article.views += 1
            article.save(update_fields=['views'])
            return Response(ArticleSerializer(article).data)
        except Article.DoesNotExist:
            return Response({'detail': '页面不存在'}, status=status.HTTP_404_NOT_FOUND)


class SystemConfigView(APIView):
    """系统配置公开接口"""

    def get(self, request):
        """获取公开的系统配置"""
        return Response({
            'site_name': SystemSettings.get_site_name(),
            'icp_number': SystemSettings.get_icp_number(),
            'copyright': SystemSettings.get_copyright(),
            'seo_title': SystemSettings.get_seo_title(),
            'seo_description': SystemSettings.get_seo_description(),
            'seo_keywords': SystemSettings.get_seo_keywords(),
            'user_agreement': SystemSettings.get_user_agreement(),
            'privacy_policy': SystemSettings.get_privacy_policy(),
        })
