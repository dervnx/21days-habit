from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Habit, CheckIn, EmailTemplate, SystemSettings, EmailQueue, Captcha, Article
import hashlib

User = get_user_model()


def sha256_hash(password):
    """SHA256加密"""
    return hashlib.sha256(password.encode()).hexdigest()


class UserSerializer(serializers.ModelSerializer):
    """用户序列化器"""

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'is_staff', 'is_admin', 'date_joined', 'avatar', 'is_email_verified']


class UserDetailSerializer(serializers.ModelSerializer):
    """用户详细信息序列化器"""
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'nickname', 'bio', 'is_staff', 'is_admin', 'date_joined', 'avatar', 'avatar_url', 'is_email_verified']
        read_only_fields = ['id', 'username', 'is_staff', 'is_admin', 'date_joined', 'is_email_verified']

    def get_avatar_url(self, obj):
        if obj.avatar:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.avatar.url)
        return None

    def update(self, instance, validated_data):
        # 禁止修改管理员的 is_staff 和 is_admin 字段
        if instance.username == 'administrator':
            validated_data.pop('is_staff', None)
            validated_data.pop('is_admin', None)
        return super().update(instance, validated_data)


class UserProfileSerializer(serializers.ModelSerializer):
    """用户资料序列化器（修改资料用）"""
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['nickname', 'bio', 'avatar', 'avatar_url', 'is_email_verified']
        read_only_fields = ['is_email_verified']

    def get_avatar_url(self, obj):
        if obj.avatar:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.avatar.url)
        return None


class HabitSerializer(serializers.ModelSerializer):
    """习惯序列化器"""
    completion_rate = serializers.SerializerMethodField()

    class Meta:
        model = Habit
        fields = ['id', 'name', 'description', 'frequency', 'is_active', 'created_at', 'completion_rate']

    def get_completion_rate(self, obj):
        checkins = obj.checkins.filter(status='completed').count()
        return min(100, int((checkins / 21) * 100))


class HabitDetailSerializer(HabitSerializer):
    """习惯详情序列化器"""
    checkins = serializers.SerializerMethodField()

    class Meta(HabitSerializer.Meta):
        fields = HabitSerializer.Meta.fields + ['checkins']

    def get_checkins(self, obj):
        checkins = obj.checkins.all()[:30]
        return CheckInSerializer(checkins, many=True).data


class CheckInSerializer(serializers.ModelSerializer):
    """打卡记录序列化器"""

    class Meta:
        model = CheckIn
        fields = ['id', 'date', 'status', 'note', 'created_at']


class RegisterSerializer(serializers.ModelSerializer):
    """注册序列化器 - 用户名可选，邮箱必填"""
    password = serializers.CharField(write_only=True, min_length=64)
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['email', 'nickname', 'password', 'password_confirm']

    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError({'password_confirm': '两次输入的密码不一致'})
        # 检查邮箱是否已存在
        if User.objects.filter(email=data['email']).exists():
            raise serializers.ValidationError({'email': '该邮箱已被注册'})
        return data

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        # 生成随机用户名
        import uuid
        username = f"user_{uuid.uuid4().hex[:8]}"
        # 使用 Django 的密码哈希机制
        user = User.objects.create(
            username=username,
            email=validated_data['email'],
            nickname=validated_data.get('nickname', ''),
        )
        user.set_password(validated_data['password'])
        user.save()
        return user


class PasswordChangeSerializer(serializers.Serializer):
    """修改密码序列化器"""
    old_password = serializers.CharField(min_length=64)
    new_password = serializers.CharField(min_length=64)
    new_password_confirm = serializers.CharField(min_length=64)

    def validate(self, data):
        if data['new_password'] != data['new_password_confirm']:
            raise serializers.ValidationError({'new_password_confirm': '两次输入的密码不一致'})
        return data


class PasswordResetRequestSerializer(serializers.Serializer):
    """找回密码序列化器"""
    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    """密码重置确认序列化器"""
    token = serializers.CharField()
    new_password = serializers.CharField(min_length=64)
    new_password_confirm = serializers.CharField(min_length=64)

    def validate(self, data):
        if data['new_password'] != data['new_password_confirm']:
            raise serializers.ValidationError({'new_password_confirm': '两次输入的密码不一致'})
        return data


class EmailTemplateSerializer(serializers.ModelSerializer):
    """邮件模板序列化器"""

    class Meta:
        model = EmailTemplate
        fields = ['id', 'name', 'type', 'subject', 'content', 'is_active', 'created_at', 'updated_at']


class SystemSettingsSerializer(serializers.ModelSerializer):
    """系统设置序列化器"""

    class Meta:
        model = SystemSettings
        fields = ['id', 'key', 'value', 'description', 'category', 'created_at', 'updated_at']


class EmailQueueSerializer(serializers.ModelSerializer):
    """邮件队列序列化器"""

    class Meta:
        model = EmailQueue
        fields = ['id', 'to_email', 'subject', 'status', 'error_message', 'retry_count', 'sent_at', 'created_at']


class CaptchaSerializer(serializers.ModelSerializer):
    """验证码序列化器"""
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Captcha
        fields = ['id', 'key', 'image_url', 'expires_at', 'created_at']

    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
        return None


class ArticleSerializer(serializers.ModelSerializer):
    """文章序列化器"""
    author_name = serializers.SerializerMethodField()

    class Meta:
        model = Article
        fields = ['id', 'title', 'slug', 'content', 'type', 'status', 'author', 'author_name',
                   'meta_title', 'meta_description', 'meta_keywords', 'order', 'views',
                   'created_at', 'updated_at']

    def get_author_name(self, obj):
        return obj.author.nickname if obj.author else ''


class ArticleDetailSerializer(ArticleSerializer):
    """文章详情序列化器"""
    pass
