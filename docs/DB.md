# 21天好习惯 - 数据库说明

## 用户表 (users)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Integer | 主键 |
| username | Varchar(150) | 用户名 |
| email | Varchar(254) | 邮箱(唯一) |
| password | Varchar(128) | SHA256密码哈希 |
| nickname | Varchar(100) | 昵称 |
| bio | Text | 个人简介 |
| avatar | ImageField | 头像 |
| is_admin | Boolean | 是否管理员 |
| is_email_verified | Boolean | 邮箱是否验证 |
| email_verification_token | Varchar(64) | 邮箱验证token |
| password_reset_token | Varchar(64) | 密码重置token |
| password_reset_expires | DateTime | 密码重置过期时间 |
| is_staff | Boolean | 是否员工 |
| is_superuser | Boolean | 是否超级用户 |
| is_active | Boolean | 是否激活 |
| date_joined | DateTime | 注册时间 |
| last_login | DateTime | 最后登录时间 |

## 习惯表 (habits)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Integer | 主键 |
| user_id | ForeignKey | 用户ID |
| name | Varchar(200) | 习惯名称 |
| description | Text | 描述 |
| frequency | Varchar(10) | 频率(daily/weekly) |
| is_active | Boolean | 是否激活 |
| created_at | DateTime | 创建时间 |
| updated_at | DateTime | 更新时间 |

## 打卡记录表 (check_ins)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Integer | 主键 |
| habit_id | ForeignKey | 习惯ID |
| user_id | ForeignKey | 用户ID |
| date | Date | 日期 |
| status | Varchar(10) | 状态(completed/missed) |
| note | Text | 备注 |
| created_at | DateTime | 创建时间 |

## 邮件模板表 (email_templates)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Integer | 主键 |
| name | Varchar(100) | 模板名称 |
| type | Varchar(20) | 模板类型 |
| subject | Varchar(200) | 邮件主题 |
| content | Text | 模板内容 |
| is_active | Boolean | 是否启用 |
| created_at | DateTime | 创建时间 |
| updated_at | DateTime | 更新时间 |

## 系统设置表 (system_settings)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Integer | 主键 |
| key | Varchar(100) | 设置键(唯一) |
| value | Text | 设置值 |
| description | Varchar(200) | 说明 |
| category | Varchar(50) | 分类 |
| created_at | DateTime | 创建时间 |
| updated_at | DateTime | 更新时间 |

## 邮件队列表 (email_queue)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Integer | 主键 |
| to_email | EmailField | 收件人 |
| subject | Varchar(200) | 邮件主题 |
| content | Text | 邮件内容 |
| status | Varchar(10) | 状态 |
| error_message | Text | 错误信息 |
| retry_count | Integer | 重试次数 |
| sent_at | DateTime | 发送时间 |
| created_at | DateTime | 创建时间 |

## 验证码表 (captchas)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Integer | 主键 |
| key | Varchar(64) | 验证码key(唯一) |
| code | Varchar(10) | 验证码 |
| image | ImageField | 验证码图片 |
| expires_at | DateTime | 过期时间 |
| created_at | DateTime | 创建时间 |
