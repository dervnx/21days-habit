from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model
from django.db.models import Count, Q
from django.utils import timezone
from django.conf import settings
import random
import string
import hashlib

from habit_app.models import Habit, CheckIn, EmailTemplate, SystemSettings, EmailQueue, Article
from habit_app.serializers import (
    UserSerializer, HabitSerializer, CheckInSerializer,
    EmailTemplateSerializer, SystemSettingsSerializer, EmailQueueSerializer,
    ArticleSerializer
)
from habit_app.views import IsAdminUser as BaseIsAdminUser

User = get_user_model()


class IsAdminUser(BaseIsAdminUser):
    """检查是否为管理员"""
    pass


def sha256_hash(password):
    """SHA256加密"""
    return hashlib.sha256(password.encode()).hexdigest()


class AdminStatsView(APIView):
    """管理后台统计数据"""
    permission_classes = [IsAdminUser]

    def get(self, request):
        total_users = User.objects.filter(is_admin=False).count()
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
    queryset = User.objects.filter(is_admin=False).order_by('-date_joined')
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
            from habit_app.views import send_email, get_email_template
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


class AdminHabitViewSet(viewsets.ReadOnlyModelViewSet):
    """管理后台习惯视图（只读）"""
    queryset = Habit.objects.all().order_by('-created_at')
    serializer_class = HabitSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        queryset = super().get_queryset()
        # 可以按用户筛选
        user_id = self.request.query_params.get('user_id')
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        return queryset.annotate(
            checkin_count=Count('checkins', filter=Q(checkins__status='completed'))
        )


class AdminCheckInViewSet(viewsets.ReadOnlyModelViewSet):
    """管理后台打卡记录视图（只读）"""
    queryset = CheckIn.objects.all().order_by('-date')
    serializer_class = CheckInSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        queryset = super().get_queryset()
        habit_id = self.request.query_params.get('habit_id')
        user_id = self.request.query_params.get('user_id')
        if habit_id:
            queryset = queryset.filter(habit_id=habit_id)
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        return queryset


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


class ArticleViewSet(viewsets.ModelViewSet):
    """文章管理"""
    queryset = Article.objects.all()
    serializer_class = ArticleSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        queryset = super().get_queryset()
        # 按类型筛选
        article_type = self.request.query_params.get('type')
        if article_type:
            queryset = queryset.filter(type=article_type)
        # 按状态筛选
        status = self.request.query_params.get('status')
        if status:
            queryset = queryset.filter(status=status)
        return queryset

    def perform_create(self, serializer):
        # 设置作者为当前管理员用户
        serializer.save(author=self.request.user)


class AdminUserStatsView(APIView):
    """单个用户统计数据"""
    permission_classes = [IsAdminUser]

    def get(self, request, pk=None):
        try:
            user = User.objects.get(pk=pk, is_admin=False)
        except User.DoesNotExist:
            return Response({'detail': '用户不存在'}, status=status.HTTP_404_NOT_FOUND)

        total_habits = Habit.objects.filter(user=user).count()
        total_checkins = CheckIn.objects.filter(user=user, status='completed').count()

        # 最近7天打卡情况
        from datetime import timedelta
        recent_checkins = CheckIn.objects.filter(
            user=user,
            status='completed',
            date__gte=timezone.now().date() - timedelta(days=7)
        ).count()

        return Response({
            'user_id': user.id,
            'username': user.username,
            'email': user.email,
            'total_habits': total_habits,
            'total_checkins': total_checkins,
            'recent_7days_checkins': recent_checkins,
            'date_joined': user.date_joined,
            'last_login': user.last_login
        })
