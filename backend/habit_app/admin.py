from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django import forms
from .models import User, Habit, CheckIn, EmailTemplate, SystemSettings, EmailQueue, Captcha


class UserCreationForm(forms.ModelForm):
    """用户创建表单"""
    password1 = forms.CharField(label='密码', widget=forms.PasswordInput)
    password2 = forms.CharField(label='确认密码', widget=forms.PasswordInput)

    class Meta:
        model = User
        fields = ['username', 'email', 'is_admin']

    def clean_password2(self):
        password1 = self.cleaned_data.get('password1')
        password2 = self.cleaned_data.get('password2')
        if password1 and password2 and password1 != password2:
            raise forms.ValidationError('密码不一致')
        return password2

    def save(self, commit=True):
        user = super().save(commit=False)
        user.set_password(self.cleaned_data['password1'])
        if commit:
            user.save()
        return user


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    add_form = UserCreationForm
    list_display = ['id', 'username', 'email', 'is_admin', 'is_staff', 'nickname', 'is_email_verified', 'date_joined']
    list_filter = ['is_admin', 'is_staff', 'is_superuser', 'is_email_verified', 'date_joined']
    search_fields = ['username', 'email', 'nickname']
    ordering = ['-date_joined']

    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('基本信息', {'fields': ('email', 'nickname', 'bio', 'avatar', 'is_email_verified')}),
        ('权限', {'fields': ('is_active', 'is_staff', 'is_superuser', 'is_admin')}),
        ('时间', {'fields': ('last_login', 'date_joined')}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'password1', 'password2', 'is_admin'),
        }),
    )

    def get_readonly_fields(self, request, obj=None):
        if obj and obj.username == 'administrator':
            return ['username', 'is_staff', 'is_superuser', 'is_admin', 'date_joined', 'last_login']
        return super().get_readonly_fields(request, obj)

    def has_delete_permission(self, request, obj=None):
        if obj and obj.username == 'administrator':
            return False
        return super().has_delete_permission(request, obj)


@admin.register(Habit)
class HabitAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'user', 'frequency', 'is_active', 'created_at']
    list_filter = ['frequency', 'is_active', 'created_at']
    search_fields = ['name', 'user__username']
    raw_id_fields = ['user']


@admin.register(CheckIn)
class CheckInAdmin(admin.ModelAdmin):
    list_display = ['id', 'habit', 'user', 'date', 'status']
    list_filter = ['status', 'date']
    search_fields = ['habit__name', 'user__username']
    date_hierarchy = 'date'
    raw_id_fields = ['habit', 'user']


@admin.register(EmailTemplate)
class EmailTemplateAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'type', 'subject', 'is_active', 'created_at']
    list_filter = ['type', 'is_active']
    search_fields = ['name', 'subject']


@admin.register(SystemSettings)
class SystemSettingsAdmin(admin.ModelAdmin):
    list_display = ['id', 'key', 'value', 'category', 'updated_at']
    list_filter = ['category']
    search_fields = ['key', 'description']


@admin.register(EmailQueue)
class EmailQueueAdmin(admin.ModelAdmin):
    list_display = ['id', 'to_email', 'subject', 'status', 'retry_count', 'sent_at', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['to_email', 'subject']
    readonly_fields = ['created_at']


@admin.register(Captcha)
class CaptchaAdmin(admin.ModelAdmin):
    list_display = ['id', 'key', 'code', 'expires_at', 'created_at']
    readonly_fields = ['key', 'code', 'expires_at', 'created_at']
