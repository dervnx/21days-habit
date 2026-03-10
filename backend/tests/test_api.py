"""
21天好习惯 - API功能测试
"""
import hashlib
import pytest
from django.test import Client
from habit_app.models import User, Habit, CheckIn


def sha256_hash(password):
    """SHA256加密"""
    return hashlib.sha256(password.encode()).hexdigest()


@pytest.fixture
def client():
    """测试客户端"""
    return Client()


@pytest.fixture
def test_user(db):
    """测试用户"""
    password = 'testpass123'
    user = User.objects.create_user(
        username='testuser',
        email='test@test.com',
        password=password
    )
    return user


@pytest.fixture
def admin_user(db):
    """管理员用户"""
    password = 'adminpass123'
    user = User.objects.create_user(
        username='admin',
        email='admin@test.com',
        password=password,
        is_admin=True
    )
    return user


class TestAuthAPI:
    """认证API测试"""

    def test_register_success(self, client):
        """测试用户注册成功"""
        password = 'testpass123'
        response = client.post('/api/auth/register/', {
            'username': 'newuser',
            'email': 'new@test.com',
            'password': password,
            'password_confirm': password
        })
        assert response.status_code == 201

    def test_register_password_mismatch(self, client):
        """测试注册密码不一致"""
        response = client.post('/api/auth/register/', {
            'username': 'newuser',
            'email': 'new@test.com',
            'password': 'pass1',
            'password_confirm': 'pass2'
        })
        assert response.status_code == 400

    def test_register_duplicate_email(self, client, test_user):
        """测试重复邮箱注册"""
        password = 'testpass123'
        response = client.post('/api/auth/register/', {
            'username': 'newuser',
            'email': 'test@test.com',
            'password': password,
            'password_confirm': password
        })
        assert response.status_code == 400

    def test_login_success(self, client, test_user):
        """测试登录成功"""
        response = client.post('/api/auth/login/', {
            'username': 'testuser',
            'password': 'testpass123'
        })
        assert response.status_code == 200
        assert 'token' in response.json()

    def test_login_wrong_password(self, client, test_user):
        """测试密码错误"""
        response = client.post('/api/auth/login/', {
            'username': 'testuser',
            'password': 'wrongpass'
        })
        assert response.status_code == 400

    def test_login_nonexistent_user(self, client):
        """测试用户不存在"""
        response = client.post('/api/auth/login/', {
            'username': 'nonexistent',
            'password': 'pass'
        })
        assert response.status_code == 400

    def test_login_with_email(self, client, test_user):
        """测试使用邮箱登录"""
        response = client.post('/api/auth/login/', {
            'username': 'test@test.com',
            'password': 'testpass123'
        })
        assert response.status_code == 200
        assert 'token' in response.json()

    def test_logout(self, client, test_user):
        """测试登出"""
        # 先登录
        login_response = client.post('/api/auth/login/', {
            'username': 'testuser',
            'password': 'testpass123'
        })
        token = login_response.json()['token']

        # 登出
        response = client.post('/api/auth/logout/',
            HTTP_AUTHORIZATION=f'Token {token}'
        )
        assert response.status_code == 200


class TestHabitAPI:
    """习惯API测试"""

    def test_create_habit(self, client, test_user):
        """测试创建习惯"""
        # 先登录获取token
        login_response = client.post('/api/auth/login/', {
            'username': 'testuser',
            'password': 'testpass123'
        })
        token = login_response.json()['token']

        # 创建习惯
        response = client.post('/api/habits/',
            {'name': '早起', 'description': '每天6点起床'},
            HTTP_AUTHORIZATION=f'Token {token}'
        )
        assert response.status_code == 201
        assert response.json()['name'] == '早起'

    def test_get_habits(self, client, test_user):
        """测试获取习惯列表"""
        login_response = client.post('/api/auth/login/', {
            'username': 'testuser',
            'password': 'testpass123'
        })
        token = login_response.json()['token']

        # 获取习惯列表
        response = client.get('/api/habits/',
            HTTP_AUTHORIZATION=f'Token {token}'
        )
        assert response.status_code == 200

    def test_checkin(self, client, test_user):
        """测试每日打卡"""
        # 登录
        login_response = client.post('/api/auth/login/', {
            'username': 'testuser',
            'password': 'testpass123'
        })
        token = login_response.json()['token']

        # 创建习惯
        habit_response = client.post('/api/habits/',
            {'name': '早起', 'description': '每天6点起床'},
            HTTP_AUTHORIZATION=f'Token {token}'
        )
        habit_id = habit_response.json()['id']

        # 打卡
        response = client.post('/api/habits/checkin/',
            {'habit_id': habit_id},
            HTTP_AUTHORIZATION=f'Token {token}'
        )
        assert response.status_code == 200

    def test_undo_checkin(self, client, test_user):
        """测试撤销打卡"""
        # 登录
        login_response = client.post('/api/auth/login/', {
            'username': 'testuser',
            'password': 'testpass123'
        })
        token = login_response.json()['token']

        # 创建习惯
        habit_response = client.post('/api/habits/',
            {'name': '早起', 'description': '每天6点起床'},
            HTTP_AUTHORIZATION=f'Token {token}'
        )
        habit_id = habit_response.json()['id']

        # 打卡
        client.post('/api/habits/checkin/',
            {'habit_id': habit_id},
            HTTP_AUTHORIZATION=f'Token {token}'
        )

        # 撤销打卡
        from django.utils import timezone
        today = timezone.now().date()
        response = client.delete(f'/api/habits/{habit_id}/undo/?date={today}',
            HTTP_AUTHORIZATION=f'Token {token}'
        )
        assert response.status_code == 200


class TestAdminAPI:
    """管理后台API测试"""

    def test_admin_stats_without_auth(self, client):
        """测试未认证访问管理后台"""
        response = client.get('/api/admin/stats/')
        assert response.status_code == 403

    def test_admin_stats_regular_user(self, client, test_user):
        """测试普通用户访问管理后台"""
        login_response = client.post('/api/auth/login/', {
            'username': 'testuser',
            'password': 'testpass123'
        })
        token = login_response.json()['token']

        response = client.get('/api/admin/stats/',
            HTTP_AUTHORIZATION=f'Token {token}'
        )
        assert response.status_code == 403

    def test_admin_stats_admin_user(self, client, admin_user):
        """测试管理员访问管理后台"""
        login_response = client.post('/api/auth/login/', {
            'username': 'admin',
            'password': 'adminpass123'
        })
        token = login_response.json()['token']

        response = client.get('/api/admin/stats/',
            HTTP_AUTHORIZATION=f'Token {token}'
        )
        assert response.status_code == 200
        assert 'total_users' in response.json()

    def test_delete_admin_forbidden(self, client, admin_user):
        """测试删除管理员账号"""
        login_response = client.post('/api/auth/login/', {
            'username': 'admin',
            'password': 'adminpass123'
        })
        token = login_response.json()['token']

        response = client.delete(f'/api/admin/users/{admin_user.id}/',
            HTTP_AUTHORIZATION=f'Token {token}'
        )
        assert response.status_code == 400


class TestUserProfileAPI:
    """用户资料API测试"""

    def test_get_profile(self, client, test_user):
        """测试获取用户资料"""
        login_response = client.post('/api/auth/login/', {
            'username': 'testuser',
            'password': 'testpass123'
        })
        token = login_response.json()['token']

        response = client.get('/api/auth/user/',
            HTTP_AUTHORIZATION=f'Token {token}'
        )
        assert response.status_code == 200

    def test_update_profile(self, client, test_user):
        """测试更新用户资料"""
        login_response = client.post('/api/auth/login/', {
            'username': 'testuser',
            'password': 'testpass123'
        })
        token = login_response.json()['token']

        response = client.patch('/api/auth/user/',
            {'nickname': '新昵称'},
            HTTP_AUTHORIZATION=f'Token {token}'
        )
        assert response.status_code == 200


class TestCaptchaAPI:
    """验证码API测试"""

    def test_get_captcha(self, client):
        """测试获取验证码"""
        response = client.get('/api/auth/captcha/')
        assert response.status_code == 200
