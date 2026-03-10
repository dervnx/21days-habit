# 环境配置说明

## 配置文件概述

项目使用环境变量配置文件来区分不同环境（开发/生产）。

## 配置文件位置

| 环境 | 后端配置 | 前端配置 |
|------|----------|----------|
| 开发环境 | `deploy/development/backend.env` | `deploy/development/frontend.env` |
| 生产环境 | `deploy/production/backend.env` | `deploy/production/frontend.env` |

## 目录结构

```
deploy/
├── development/           # 开发环境配置
│   ├── backend.env        # 后端环境变量
│   ├── frontend.env       # 前端环境变量
│   └── docker-compose.yml # Docker Compose
└── production/            # 生产环境配置
    ├── backend.env        # 后端环境变量
    ├── frontend.env       # 前端环境变量
    ├── nginx.conf        # Nginx 配置
    └── docker-compose.yml # Docker Compose
```

## 配置项说明

### 后端配置项

| 变量名 | 说明 | 开发环境默认值 | 生产环境必填 |
|--------|------|----------------|--------------|
| `ENV` | 环境类型 | `development` | `production` |
| `SECRET_KEY` | Django密钥 | 自动生成 | **必须修改** |
| `DEBUG` | 调试模式 | `True` | `False` |
| `ALLOWED_HOSTS` | 允许的域名 | `localhost,127.0.0.1` | **必须修改** |
| `POSTGRES_DB` | 数据库名 | `habit_db` | - |
| `POSTGRES_USER` | 数据库用户 | `habit_user` | - |
| `POSTGRES_PASSWORD` | 数据库密码 | `habit_password` | **必须修改** |
| `DB_HOST` | 数据库主机 | `db` | - |
| `REDIS_URL` | Redis连接地址 | `redis://redis:6379/1` | - |
| `EMAIL_HOST` | SMTP服务器 | 空 | **配置SMTP** |
| `EMAIL_PORT` | SMTP端口 | `587` | - |
| `EMAIL_HOST_USER` | SMTP用户名 | 空 | **配置SMTP** |
| `EMAIL_HOST_PASSWORD` | SMTP密码 | 空 | **配置SMTP** |
| `EMAIL_USE_TLS` | 使用TLS | `true` | - |
| `DEFAULT_FROM_EMAIL` | 默认发件人 | `noreply@21days-habit.com` | - |
| `EMAIL_ENABLE_SEND` | 启用邮件发送 | `false` | `true` |
| `FRONTEND_URL` | 前端URL | `http://localhost:5173` | **必须修改** |

### 前端配置项

| 变量名 | 说明 | 开发环境 | 生产环境 |
|--------|------|----------|----------|
| `VITE_API_URL` | API地址 | `http://localhost:8000` | `/api` |
| `VITE_APP_TITLE` | 应用标题 | `21天好习惯` | - |

## 开发环境配置

### 1. 后端配置

开发环境配置文件位于 `deploy/development/backend.env`，默认已配置好开发环境参数。

### 2. 前端配置

开发环境配置文件位于 `deploy/development/frontend.env`，默认已配置好开发环境参数。

### 3. 启动开发服务

```bash
cd deploy/development
docker-compose up --build
```

## 生产环境配置

### 1. 准备配置文件

生产环境配置文件位于 `deploy/production/` 目录。

### 2. 编辑后端配置

```bash
vim deploy/production/backend.env
```

必须修改以下项：
- `SECRET_KEY`: 设置一个强密钥
- `ALLOWED_HOSTS`: 改为实际域名
- `POSTGRES_PASSWORD`: 设置强密码
- `EMAIL_HOST`: SMTP服务器地址
- `EMAIL_HOST_USER`: SMTP用户名
- `EMAIL_HOST_PASSWORD`: SMTP密码
- `EMAIL_ENABLE_SEND`: 改为 `true`
- `FRONTEND_URL`: 改为实际域名

### 3. 编辑前端配置

```bash
vim deploy/production/frontend.env
```

根据需要修改：
- `VITE_API_URL`: API 地址
- `VITE_APP_TITLE`: 实际应用标题

### 4. 构建并启动

```bash
cd deploy/production
docker-compose up --build -d
```

### 5. 配置域名

生产环境使用 Nginx 反向代理：
- 前台用户网站: www.your-domain.com
- 后台管理系统: admin.your-domain.com

请根据 `deploy/production/nginx.conf` 配置你的域名。

## Docker Compose 环境变量覆盖

可以在运行时通过环境变量覆盖配置文件中的值：

```bash
# 覆盖特定配置
POSTGRES_PASSWORD=mysecretpassword docker-compose up
```

或在 docker-compose.yml 中使用：
```yaml
environment:
  - POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-default_password}
```

## 敏感信息注意

- **不要**将包含实际密码的 `.env` 文件提交到版本控制
- `.gitignore` 已配置忽略 `.env` 文件
- 生产环境务必修改所有默认密码和密钥

## 日志文件

日志文件存放在项目根目录 `logs/` 目录：

| 日志文件 | 说明 |
|----------|------|
| `api_user.log` | 前台用户 API 日志 |
| `api_admin.log` | 后台管理 API 日志 |
| `django.log` | Django 框架日志 |

日志每天午夜轮转，保留 30 天。

> 注意: 日志通过 Docker 卷持久化，查看日志可使用：
> ```bash
> docker-compose exec backend cat /app/logs/api_user.log
> ```
