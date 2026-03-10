from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AdminStatsView, AdminUserViewSet, AdminHabitViewSet, AdminCheckInViewSet,
    EmailTemplateViewSet, SystemSettingsViewSet, EmailQueueViewSet,
    AdminUserStatsView, ArticleViewSet
)

router = DefaultRouter()
router.register(r'users', AdminUserViewSet, basename='admin-user')
router.register(r'habits', AdminHabitViewSet, basename='admin-habit')
router.register(r'checkins', AdminCheckInViewSet, basename='admin-checkin')
router.register(r'email-templates', EmailTemplateViewSet, basename='email-template')
router.register(r'settings', SystemSettingsViewSet, basename='system-settings')
router.register(r'email-queue', EmailQueueViewSet, basename='email-queue')
router.register(r'articles', ArticleViewSet, basename='article')

urlpatterns = [
    path('stats/', AdminStatsView.as_view(), name='admin-stats'),
    path('users/<int:pk>/stats/', AdminUserStatsView.as_view(), name='admin-user-stats'),
    path('', include(router.urls)),
]
