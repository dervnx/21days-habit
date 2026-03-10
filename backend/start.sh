#!/bin/bash
set -e

echo "正在执行数据库迁移..."
python manage.py migrate

echo "正在创建超级管理员..."
python manage.py create_superuser --username=administrator --password=admin123456 --email=admin@example.com

echo "启动开发服务器..."
python manage.py runserver 0.0.0.0:8000
