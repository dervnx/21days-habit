from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCommand):
    help = '创建默认超级管理员'

    def add_arguments(self, parser):
        parser.add_argument(
            '--username',
            type=str,
            default='administrator',
            help='超级管理员用户名'
        )
        parser.add_argument(
            '--password',
            type=str,
            default='admin123456',
            help='超级管理员密码'
        )
        parser.add_argument(
            '--email',
            type=str,
            default='admin@example.com',
            help='超级管理员邮箱'
        )

    def handle(self, *args, **options):
        username = options['username']
        password = options['password']
        email = options['email']

        if not User.objects.filter(username=username).exists():
            User.objects.create_superuser(
                username=username,
                email=email,
                password=password
            )
            self.stdout.write(
                self.style.SUCCESS(f'超级管理员 {username} 创建成功！')
            )
        else:
            self.stdout.write(
                self.style.WARNING(f'超级管理员 {username} 已存在')
            )
