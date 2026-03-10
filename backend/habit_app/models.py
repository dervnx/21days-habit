from django.contrib.auth.models import AbstractUser
from django.db import models
import uuid


class User(AbstractUser):
    """自定义用户模型"""
    email = models.EmailField(unique=True)
    nickname = models.CharField(max_length=100, blank=True, verbose_name='昵称')
    bio = models.TextField(blank=True, verbose_name='个人简介')
    avatar = models.ImageField(upload_to='avatars/', blank=True, verbose_name='头像')
    is_admin = models.BooleanField(default=False, verbose_name='管理员')
    is_email_verified = models.BooleanField(default=False, verbose_name='邮箱已验证')
    email_verification_token = models.CharField(max_length=64, blank=True)
    password_reset_token = models.CharField(max_length=64, blank=True)
    password_reset_expires = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'users'

    def delete(self, *args, **kwargs):
        """禁止删除管理员账号"""
        if self.username == 'administrator':
            raise ValueError('管理员账号不允许删除')
        super().delete(*args, **kwargs)

    def generate_email_verification_token(self):
        """生成邮箱验证token"""
        self.email_verification_token = uuid.uuid4().hex
        self.save()
        return self.email_verification_token

    def generate_password_reset_token(self):
        """生成密码重置token"""
        from django.utils import timezone
        self.password_reset_token = uuid.uuid4().hex
        self.password_reset_expires = timezone.now() + timezone.timedelta(hours=24)
        self.save()
        return self.password_reset_token


class EmailTemplate(models.Model):
    """邮件模板"""
    TYPE_CHOICES = [
        ('register', '注册成功'),
        ('verify_email', '邮箱验证'),
        ('reset_password', '密码重置'),
        ('admin_reset_password', '管理员重置密码'),
    ]

    name = models.CharField(max_length=100, unique=True, verbose_name='模板名称')
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, verbose_name='模板类型')
    subject = models.CharField(max_length=200, verbose_name='邮件主题')
    content = models.TextField(verbose_name='模板内容')
    is_active = models.BooleanField(default=True, verbose_name='是否启用')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'email_templates'
        verbose_name = '邮件模板'
        verbose_name_plural = '邮件模板'


class SystemSettings(models.Model):
    """系统设置"""
    key = models.CharField(max_length=100, unique=True, verbose_name='设置键')
    value = models.TextField(verbose_name='设置值')
    description = models.CharField(max_length=200, blank=True, verbose_name='说明')
    category = models.CharField(max_length=50, default='general', verbose_name='分类')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'system_settings'
        verbose_name = '系统设置'
        verbose_name_plural = '系统设置'

    @classmethod
    def get_value(cls, key, default=''):
        """获取设置值"""
        try:
            return cls.objects.get(key=key).value
        except cls.DoesNotExist:
            return default

    @classmethod
    def get_site_name(cls):
        """获取网站名称"""
        return cls.get_value('site_name', '21天好习惯')

    @classmethod
    def get_icp_number(cls):
        """获取备案号"""
        return cls.get_value('icp_number', '')

    @classmethod
    def get_copyright(cls):
        """获取版权信息"""
        return cls.get_value('copyright', '')

    @classmethod
    def get_seo_title(cls):
        """获取SEO标题"""
        return cls.get_value('seo_title', '')

    @classmethod
    def get_seo_description(cls):
        """获取SEO描述"""
        return cls.get_value('seo_description', '')

    @classmethod
    def get_seo_keywords(cls):
        """获取SEO关键词"""
        return cls.get_value('seo_keywords', '')

    @classmethod
    def get_user_agreement(cls):
        """获取用户协议内容"""
        return cls.get_value('user_agreement', '')

    @classmethod
    def get_privacy_policy(cls):
        """获取隐私政策内容"""
        return cls.get_value('privacy_policy', '')


class EmailQueue(models.Model):
    """邮件发送队列"""
    STATUS_CHOICES = [
        ('pending', '待发送'),
        ('sending', '发送中'),
        ('sent', '已发送'),
        ('failed', '发送失败'),
    ]

    to_email = models.EmailField(verbose_name='收件人')
    subject = models.CharField(max_length=200, verbose_name='邮件主题')
    content = models.TextField(verbose_name='邮件内容')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    error_message = models.TextField(blank=True, verbose_name='错误信息')
    retry_count = models.IntegerField(default=0, verbose_name='重试次数')
    sent_at = models.DateTimeField(null=True, blank=True, verbose_name='发送时间')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'email_queue'
        verbose_name = '邮件队列'
        verbose_name_plural = '邮件队列'
        ordering = ['-created_at']


class Captcha(models.Model):
    """图形验证码"""
    key = models.CharField(max_length=64, unique=True, verbose_name='验证码key')
    code = models.CharField(max_length=10, verbose_name='验证码')
    image = models.ImageField(upload_to='captchas/', verbose_name='验证码图片')
    expires_at = models.DateTimeField(verbose_name='过期时间')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'captchas'
        verbose_name = '图形验证码'

    def is_expired(self):
        from django.utils import timezone
        return timezone.now() > self.expires_at
        verbose_name_plural = '图形验证码'


class Habit(models.Model):
    """习惯"""
    FREQUENCY_CHOICES = [
        ('daily', '每日'),
        ('weekly', '每周'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='habits')
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    frequency = models.CharField(max_length=10, choices=FREQUENCY_CHOICES, default='daily')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'habits'
        ordering = ['-created_at']


class CheckIn(models.Model):
    """打卡记录"""
    STATUS_CHOICES = [
        ('completed', '已完成'),
        ('missed', '未完成'),
    ]

    habit = models.ForeignKey(Habit, on_delete=models.CASCADE, related_name='checkins')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='checkins')
    date = models.DateField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='completed')
    note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'check_ins'
        unique_together = ['habit', 'date']
        ordering = ['-date']


class Article(models.Model):
    """文章"""
    TYPE_CHOICES = [
        ('article', '一般文章'),
        ('page', '页面'),
    ]
    STATUS_CHOICES = [
        ('draft', '草稿'),
        ('published', '已发布'),
    ]

    title = models.CharField(max_length=200, verbose_name='标题')
    slug = models.SlugField(max_length=100, unique=True, verbose_name='URL别名')
    content = models.TextField(verbose_name='内容')
    type = models.CharField(max_length=10, choices=TYPE_CHOICES, default='article', verbose_name='类型')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='draft', verbose_name='状态')
    author = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, verbose_name='作者')
    # SEO 配置
    meta_title = models.CharField(max_length=200, blank=True, verbose_name='SEO标题')
    meta_description = models.TextField(blank=True, verbose_name='SEO描述')
    meta_keywords = models.CharField(max_length=200, blank=True, verbose_name='SEO关键词')
    # 排序
    order = models.IntegerField(default=0, verbose_name='排序')
    views = models.IntegerField(default=0, verbose_name='浏览量')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'articles'
        verbose_name = '文章'
        verbose_name_plural = '文章'
        ordering = ['-order', '-created_at']

    def __str__(self):
        return self.title
