# 21天好习惯 - 项目需求文档

## 1. 项目概述

### 1.1 项目目标

帮助用户通过21天持续打卡养成好习惯的Web应用。

### 1.2 技术栈

| 层级 | 技术选型 |
|------|----------|
| 后端框架 | Django 4.2 + Django REST Framework |
| 数据库 | PostgreSQL 15 |
| 缓存/Session | Redis |
| 前端框架 | React 18 + Vite |
| 样式 | Tailwind CSS |
| 图标 | Lucide React |
| 部署 | Docker + Docker Compose |

### 1.3 目录结构

```
21days-habit/
├── backend/                 # Django 后端
│   ├── habit_app/          # 用户 API 应用
│   ├── habit_admin_api/    # 管理后台 API 应用
│   ├── habit_project/      # Django 项目配置
│   └── tests/              # 后端测试
├── frontend/               # React 前端
│   ├── src/
│   │   ├── pages/         # 页面组件
│   │   ├── components/     # 公共组件
│   │   ├── context/       # React Context
│   │   └── services/      # API 服务
│   └── tests/
├── deploy/                 # 部署配置
│   ├── development/       # 开发环境
│   └── production/      # 生产环境
├── docs/                  # 项目文档
└── logs/                  # 日志目录
```

---

## 2. 功能模块说明

### 2.1 用户系统

#### 2.1.1 用户模型 (User)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| username | VARCHAR(150) | 用户名 (可选，自动生成) |
| email | VARCHAR(254) | 邮箱 (唯一，必填) |
| nickname | VARCHAR(100) | 昵称 (可选) |
| bio | TEXT | 个人简介 (可选) |
| avatar | IMAGE | 头像 (可选) |
| password | VARCHAR(128) | Django密码哈希 |
| is_admin | BOOLEAN | 是否管理员 |
| is_email_verified | BOOLEAN | 邮箱是否已验证 |
| is_active | BOOLEAN | 账号是否激活 |
| date_joined | DATETIME | 注册时间 |
| last_login | DATETIME | 最后登录时间 |

**关键约束**:
- email 唯一且必填
- username 可选，自动生成 `user_{uuid}`
- 管理员账号 (administrator) 不可删除

#### 2.1.2 注册流程

```
用户提交注册表单
    ↓
验证图形验证码 (可选)
    ↓
验证邮箱格式、检查邮箱是否已注册
    ↓
验证密码一致性 (password == password_confirm)
    ↓
创建用户记录 (密码使用 Django set_password 哈希存储)
    ↓
生成邮箱验证token (UUID)
    ↓
发送验证邮件 (异步入队)
    ↓
返回注册成功响应
```

**注册 API**: `POST /api/auth/register/`

请求参数:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| email | STRING | 是 | 邮箱地址 |
| nickname | STRING | 否 | 昵称 |
| password | STRING | 是 | 密码 |
| password_confirm | STRING | 是 | 确认密码 |
| captcha_key | STRING | 否 | 验证码key |
| captcha_code | STRING | 否 | 验证码 |

响应:
```json
{
  "message": "注册成功，请前往邮箱验证邮件以激活账号",
  "email": "user@example.com"
}
```

#### 2.1.3 登录流程

```
用户提交登录表单
    ↓
验证图形验证码 (可选)
    ↓
获取用户 (支持用户名或邮箱)
    ↓
使用 Django check_password 验证密码
    ↓
检查邮箱是否已验证 (is_email_verified)
    ↓
生成/更新 DRF Token
    ↓
返回 token 和用户信息
```

**登录 API**: `POST /api/auth/login/`

请求参数:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| username | STRING | 是 | 用户名或邮箱 |
| password | STRING | 是 | 密码 |
| captcha_key | STRING | 否 | 验证码key |
| captcha_code | STRING | 否 | 验证码 |

响应:
```json
{
  "token": "xxx",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "nickname": "xxx",
    "is_admin": false,
    "is_email_verified": true
  }
}
```

#### 2.1.4 密码处理

**密码存储机制**:
- 使用 Django 自带的 `make_password()` / `set_password()` / `check_password()` 方法
- 默认使用 PBKDF2 算法 + SHA256 哈希
- 密码长度无限制，前端可自行限制

**密码修改流程**:
```
用户提交修改密码表单
    ↓
验证原密码 (check_password)
    ↓
验证新密码一致性
    ↓
设置新密码 (set_password)
    ↓
删除旧 Token，重新生成新 Token
    ↓
返回新 Token
```

#### 2.1.5 找回密码流程

```
用户输入邮箱
    ↓
验证图形验证码
    ↓
生成密码重置 Token (UUID) + 24小时过期时间
    ↓
发送重置邮件
    ↓
用户点击邮件中的链接
    ↓
验证 Token 有效性
    ↓
设置新密码 (set_password)
    ↓
返回密码重置成功
```

### 2.2 图形验证码系统

#### 2.2.1 Captcha 模型

| 字段 | 类型 | 说明 |
|------|------|------|
| key | VARCHAR(64) | 验证码唯一key |
| code | VARCHAR(10) | 验证码答案 |
| image | IMAGE | 验证码图片 |
| expires_at | DATETIME | 过期时间 |
| created_at | DATETIME | 创建时间 |

**验证码有效期**: 5分钟

#### 2.2.2 验证码流程

```
GET /api/auth/captcha/
    ↓
生成随机4位字符 (字母数字)
    ↓
生成UUID作为key
    ↓
使用Pillow生成图片 (背景干扰、扭曲)
    ↓
保存到数据库 (key, code, image, expires_at)
    ↓
返回 key 和 image_url
```

### 2.3 习惯打卡系统

#### 2.3.1 习惯模型 (Habit)

| 字段 | 类型 | 说明 |
|------|------|------|
| user | FK(User) | 所属用户 |
| name | VARCHAR(200) | 习惯名称 |
| description | TEXT | 描述 |
| frequency | ENUM | daily/weekly |
| is_active | BOOLEAN | 是否激活 |
| created_at | DATETIME | 创建时间 |

#### 2.3.2 打卡模型 (CheckIn)

| 字段 | 类型 | 说明 |
|------|------|------|
| habit | FK(Habit) | 所属习惯 |
| user | FK(User) | 所属用户 |
| date | DATE | 打卡日期 |
| status | ENUM | completed/missed |
| note | TEXT | 备注 |
| created_at | DATETIME | 创建时间 |

**约束**: 同一用户同一习惯同一天只能有一条打卡记录

#### 2.3.3 打卡流程

```
用户点击"打卡"按钮
    ↓
验证当天是否已打卡
    ↓
创建/更新 CheckIn 记录 (status=completed)
    ↓
返回打卡成功
```

**撤销打卡**: 仅可撤销当天的打卡记录

### 2.4 文章/页面系统

#### 2.4.1 Article 模型

| 字段 | 类型 | 说明 |
|------|------|------|
| title | VARCHAR(200) | 标题 |
| slug | VARCHAR(100) | URL别名 (唯一) |
| content | TEXT | 内容 (支持HTML) |
| type | ENUM | article(一般文章) / page(页面) |
| status | ENUM | draft(草稿) / published(已发布) |
| author | FK(User) | 作者 |
| meta_title | VARCHAR(200) | SEO标题 |
| meta_description | TEXT | SEO描述 |
| meta_keywords | VARCHAR(200) | SEO关键词 |
| order | INT | 排序 (越大越靠前) |
| views | INT | 浏览量 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

#### 2.4.2 页面访问

- **公开页面**: `/api/page/<slug>/` - 通过 slug 访问 page 类型的文章
- **文章列表**: `/api/articles/` - 获取已发布的文章列表

**示例**: 创建 slug 为 `about` 的页面后，可通过 `/about` 访问

### 2.5 系统配置

#### 2.5.1 SystemSettings 模型

| 字段 | 类型 | 说明 |
|------|------|------|
| key | VARCHAR(100) | 设置键 (唯一) |
| value | TEXT | 设置值 |
| description | VARCHAR(200) | 说明 |
| category | VARCHAR(50) | 分类 |

#### 2.5.2 预定义配置

| Key | 说明 | 示例值 |
|-----|------|--------|
| site_name | 网站名称 | 21天好习惯 |
| icp_number | 备案号 | 京ICP备xxxx号 |
| copyright | 版权信息 | © 2024 xxx |
| seo_title | SEO标题 | 21天好习惯 - 帮你养成好习惯 |
| seo_description | SEO描述 | ... |
| seo_keywords | SEO关键词 | 习惯养成,21天,打卡 |
| user_agreement | 用户协议内容 | HTML格式 |
| privacy_policy | 隐私政策内容 | HTML格式 |
| email_enable_send | 启用邮件发送 | true/false |

#### 2.5.3 配置访问

- **后台管理**: `/api-admin/settings/` - 增删改查
- **公开接口**: `/api/config/` - 获取公开配置

---

## 3. API 接口说明

### 3.1 前台用户 API (/)

| 接口 | 方法 | 认证 | 说明 |
|------|------|------|------|
| /api/auth/register/ | POST | 否 | 用户注册 |
| /api/auth/login/ | POST | 否 | 用户登录 |
| /api/auth/logout/ | POST | Token | 用户登出 |
| /api/auth/user/ | GET/PATCH | Token | 用户资料 |
| /api/auth/captcha/ | GET | 否 | 图形验证码 |
| /api/auth/password/change/ | POST | Token | 修改密码 |
| /api/auth/password/reset/ | POST | 否 | 找回密码 |
| /api/auth/password/reset/confirm/ | POST | 否 | 重置密码确认 |
| /api/auth/email/verify/ | POST | 否 | 邮箱验证 |
| /api/habits/ | GET/POST | Token | 习惯列表/创建 |
| /api/habits/{id}/ | GET/PATCH/DELETE | Token | 习惯详情/更新/删除 |
| /api/habits/checkin/ | POST | Token | 打卡 |
| /api/habits/{id}/undo/ | DELETE | Token | 撤销打卡 |
| /api/articles/ | GET | 否 | 文章列表 |
| /api/page/{slug}/ | GET | 否 | 页面详情 |
| /api/config/ | GET | 否 | 系统配置 |

### 3.2 管理后台 API (/api-admin/)

| 接口 | 方法 | 认证 | 说明 |
|------|------|------|------|
| /api-admin/stats/ | GET | Admin | 统计数据 |
| /api-admin/users/ | GET/POST | Admin | 用户列表/创建 |
| /api-admin/users/{id}/ | GET/PATCH/DELETE | Admin | 用户详情/更新/删除 |
| /api-admin/users/{id}/reset_password/ | POST | Admin | 重置密码 |
| /api-admin/habits/ | GET | Admin | 习惯列表 |
| /api-admin/checkins/ | GET | Admin | 打卡记录 |
| /api-admin/articles/ | GET/POST | Admin | 文章管理 |
| /api-admin/email-templates/ | CRUD | Admin | 邮件模板 |
| /api-admin/settings/ | CRUD | Admin | 系统设置 |
| /api-admin/email-queue/ | GET | Admin | 邮件队列 |

---

## 4. 部署架构

### 4.1 开发环境

```
deploy/development/
├── backend.env        # 后端环境变量
├── frontend.env      # 前端环境变量
└── docker-compose.yml
```

**服务**:
- PostgreSQL: localhost:5432
- Redis: localhost:6379
- Backend: localhost:8000
- Frontend: localhost:5173

### 4.2 生产环境

```
deploy/production/
├── backend.env
├── frontend.env
├── docker-compose.yml
└── nginx.conf
```

**服务**:
- api (Gunicorn): 8000端口
- admin_api (Gunicorn): 8001端口
- frontend: 5173端口
- admin_frontend: 5173端口
- nginx: 80端口 (反向代理)

**域名配置**:
- 前台用户: www.your-domain.com → /api/ → api:8000, / → frontend:5173
- 后台管理: admin.your-domain.com → /api/ → admin_api:8001, / → admin_frontend:5173

### 4.3 日志系统

| 日志文件 | 说明 |
|----------|------|
| logs/api_user.log | 前台用户 API 日志 |
| logs/api_admin.log | 后台管理 API 日志 |
| logs/django.log | Django 框架日志 |

---

## 5. 安全机制

### 5.1 认证与授权

- Token认证: DRF authtoken
- Session认证: 用于管理后台
- 管理员权限检查: `IsAdminUser` 权限类

### 5.2 密码安全

- 使用 Django PBKDF2 哈希
- 不在前端存储明文密码
- 密码重置Token设置24小时过期

### 5.3 生产环境安全

- HTTPS 强制重定向
- SESSION_COOKIE_SECURE
- CSRF_COOKIE_SECURE
- HSTS 安全头

### 5.4 输入验证

- 邮箱格式验证
- 密码长度验证
- 图形验证码校验
- Token 过期检查

---

## 6. 数据库设计

详见 [DB.md](DB.md)

---

## 7. 待完善功能

- [ ] 邮件发送队列优化
- [ ] 用户行为统计
- [ ] 社交分享功能
- [ ] 移动端 PWA 支持
- [ ] 数据导出功能
