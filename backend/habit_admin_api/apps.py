from django.apps import AppConfig


class HabitAdminApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'habit_admin_api'
    verbose_name = '管理后台API'
