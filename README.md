# 21天好习惯

一个帮助用户养成21天习惯的Web应用。

## 技术栈

- **后端**: Django 4.2 + DRF + PostgreSQL + Redis + Docker
- **前端**: React 18 + Vite + Tailwind CSS

## 功能特性

### 用户系统
- 邮箱注册登录
- 密码找回
- 邮箱验证
- 图形验证码
- 头像上传
- 密码修改

### 习惯管理
- 创建/编辑/删除习惯
- 每日打卡
- 进度统计

### 管理后台
- 数据统计
- 用户管理
- 邮件模板管理
- 系统设置
- 邮件队列管理

## 快速开始

### 环境要求
- Docker
- Docker Compose

### 开发环境启动

```bash
cd deploy/development
docker-compose up --build
```

### 访问地址
- 前台: http://localhost:5173
- 后端API: http://localhost:8000
- Django管理后台: http://localhost:8000/admin

### 日志目录
- Django日志: `logs/` 目录
- 日志文件: `api_user.log`, `api_admin.log`, `django.log`

## 默认账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 管理员 | administrator | admin123456 |

## 测试

### 后端API测试
```bash
docker compose exec backend pytest
```

### 前端功能测试
```bash
cd frontend
npx playwright install
npx playwright test
```

## 项目结构

```
21days-habit/
├── backend/                 # Django 后端
│   ├── habit_app/          # 用户 API 应用
│   ├── habit_admin_api/    # 管理后台 API 应用
│   ├── habit_project/      # Django 项目配置
│   └── tests/              # 后端测试
├── frontend/               # React 前端
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   └── context/
│   └── tests/
├── deploy/                 # 部署配置
│   ├── development/       # 开发环境
│   └── production/        # 生产环境
├── logs/                  # 日志目录 (运行时)
└── docs/                  # 项目文档
```

## 文档

- [功能需求说明](docs/PR.md)
- [API接口文档](docs/api.md)
- [数据库说明](docs/DB.md)
- [环境配置说明](docs/conf.md)
