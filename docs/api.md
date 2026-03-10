# 21天好习惯 - API接口文档

## 基础信息

- 前台用户API基础URL: `http://localhost:8000/api`
- 后台管理系统API基础URL: `http://localhost:8000/api-admin`
- 认证方式: Token认证 (`Authorization: Token <token>`)

## 验证码

### 获取验证码
```
GET /api/auth/captcha/
```
响应:
```json
{
  "id": 1,
  "key": "abc123...",
  "image_url": "/media/captchas/xxx.png",
  "expires_at": "2026-03-10T12:00:00+08:00"
}
```

## 前台用户API

### 用户注册
```
POST /api/auth/register/
```
参数:
- `email` (必填): 邮箱地址
- `nickname` (可选): 昵称
- `password` (必填): 密码
- `password_confirm` (必填): 确认密码
- `captcha_key` (可选): 验证码key
- `captcha_code` (可选): 验证码

### 用户登录
```
POST /api/auth/login/
```
参数:
- `username` (必填): 用户名或邮箱
- `password` (必填): 密码
- `captcha_key` (可选): 验证码key
- `captcha_code` (可选): 验证码

### 用户登出
```
POST /api/auth/logout/
```
需要认证

### 修改密码
```
POST /api/auth/password/change/
```
参数:
- `old_password`: 原密码
- `new_password`: 新密码
- `new_password_confirm`: 确认新密码

### 找回密码
```
POST /api/auth/password/reset/
```
参数:
- `email`: 邮箱地址
- `captcha_key`: 验证码key
- `captcha_code`: 验证码

### 密码重置确认
```
POST /api/auth/password/reset/confirm/
```
参数:
- `token`: 重置token
- `new_password`: 新密码
- `new_password_confirm`: 确认密码

### 邮箱验证
```
POST /api/auth/email/verify/
```
参数:
- `token`: 验证token

## 用户接口

### 获取当前用户资料
```
GET /api/auth/user/
```
需要认证

### 更新用户资料
```
PATCH /api/auth/user/
```
参数:
- `nickname`: 昵称
- `bio`: 个人简介
- `avatar`: 头像文件

## 习惯接口

### 获取习惯列表
```
GET /api/habits/
```
需要认证

### 创建习惯
```
POST /api/habits/
```
参数:
- `name`: 习惯名称
- `description`: 描述
- `frequency`: daily/weekly

### 获取习惯详情
```
GET /api/habits/{id}/
```
需要认证

### 更新习惯
```
PATCH /api/habits/{id}/
```
需要认证

### 删除习惯
```
DELETE /api/habits/{id}/
```
需要认证

### 打卡
```
POST /api/habits/checkin/
```
参数:
- `habit_id`: 习惯ID

### 撤销打卡
```
DELETE /api/habits/{id}/undo/?date=YYYY-MM-DD
```

## 后台管理系统API

### 统计数据
```
GET /api-admin/stats/
```
需要管理员权限

### 用户列表
```
GET /api-admin/users/
```
需要管理员权限

### 用户详情
```
GET /api-admin/users/{id}/
```
需要管理员权限

### 重置用户密码
```
POST /api-admin/users/{id}/reset_password/
```
需要管理员权限
参数:
- `method`: random/email

### 用户统计
```
GET /api-admin/users/{id}/stats/
```
需要管理员权限

### 习惯列表
```
GET /api-admin/habits/
```
需要管理员权限

### 打卡记录列表
```
GET /api-admin/checkins/
```
需要管理员权限
参数:
- `habit_id`: 按习惯筛选
- `user_id`: 按用户筛选

### 邮件模板管理
```
GET /api-admin/email-templates/
POST /api-admin/email-templates/
GET /api-admin/email-templates/{id}/
PATCH /api-admin/email-templates/{id}/
DELETE /api-admin/email-templates/{id}/
```
需要管理员权限

### 系统设置管理
```
GET /api-admin/settings/
POST /api-admin/settings/
GET /api-admin/settings/{id}/
PATCH /api-admin/settings/{id}/
DELETE /api-admin/settings/{id}/
```
需要管理员权限

### 邮件队列查看
```
GET /api-admin/email-queue/
```
需要管理员权限
