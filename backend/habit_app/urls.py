from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RegisterView, LoginView, LogoutView, UserViewSet,
    HabitViewSet, AdminStatsView, AdminUserViewSet,
    UserProfileView, CaptchaView,
    PasswordChangeView, PasswordResetRequestView, PasswordResetConfirmView, VerifyEmailView,
    EmailTemplateViewSet, SystemSettingsViewSet, EmailQueueViewSet,
    ArticleViewSet, PageView, SystemConfigView
)

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'habits', HabitViewSet, basename='habit')
router.register(r'articles', ArticleViewSet, basename='article')
router.register(r'admin/users', AdminUserViewSet, basename='admin-user')
router.register(r'admin/email-templates', EmailTemplateViewSet, basename='email-template')
router.register(r'admin/settings', SystemSettingsViewSet, basename='system-settings')
router.register(r'admin/email-queue', EmailQueueViewSet, basename='email-queue')

urlpatterns = [
    # 认证
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),
    path('auth/user/', UserProfileView.as_view(), name='user-profile'),
    path('auth/captcha/', CaptchaView.as_view(), name='captcha'),
    path('auth/password/change/', PasswordChangeView.as_view(), name='password-change'),
    path('auth/password/reset/', PasswordResetRequestView.as_view(), name='password-reset-request'),
    path('auth/password/reset/confirm/', PasswordResetConfirmView.as_view(), name='password-reset-confirm'),
    path('auth/email/verify/', VerifyEmailView.as_view(), name='email-verify'),

    # 管理后台
    path('admin/stats/', AdminStatsView.as_view(), name='admin-stats'),

    # 公开页面 (slug访问)
    path('page/<str:slug>/', PageView.as_view(), name='page'),

    # 系统配置
    path('config/', SystemConfigView.as_view(), name='system-config'),

    # REST API
    path('', include(router.urls)),
]
