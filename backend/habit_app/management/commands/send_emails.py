"""
邮件发送队列管理命令
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.conf import settings
from habit_app.models import EmailQueue
import time


class Command(BaseCommand):
    help = '处理邮件发送队列'

    def add_arguments(self, parser):
        parser.add_argument(
            '--interval',
            type=int,
            default=60,
            help='检查间隔（秒）'
        )
        parser.add_argument(
            '--max-retries',
            type=int,
            default=3,
            help='最大重试次数'
        )

    def handle(self, *args, **options):
        interval = options['interval']
        max_retries = options['max_retries']

        self.stdout.write('邮件队列服务已启动')

        while True:
            self.process_queue(max_retries)
            time.sleep(interval)

    def process_queue(self, max_retries):
        pending_emails = EmailQueue.objects.filter(
            status='pending'
        ).order_by('created_at')[:10]

        for email in pending_emails:
            self.send_email(email, max_retries)

    def send_email(self, email, max_retries):
        email.status = 'sending'
        email.save()

        try:
            from django.core.mail import send_mail
            send_mail(
                email.subject,
                email.content,
                settings.DEFAULT_FROM_EMAIL,
                [email.to_email],
                fail_silently=False,
            )

            email.status = 'sent'
            email.sent_at = timezone.now()
            email.save()
            self.stdout.write(f'邮件发送成功: {email.to_email}')

        except Exception as e:
            email.retry_count += 1
            email.error_message = str(e)

            if email.retry_count >= max_retries:
                email.status = 'failed'
                self.stdout.write(self.style.ERROR(f'邮件发送失败: {email.to_email} - {str(e)}'))
            else:
                email.status = 'pending'
                self.stdout.write(self.style.WARNING(f'邮件重试: {email.to_email} - {str(e)}'))

            email.save()
