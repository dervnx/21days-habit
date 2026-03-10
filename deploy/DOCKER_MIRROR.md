# Docker 镜像加速配置

## 问题说明

由于国内网络环境原因，从 Docker Hub 拉取镜像可能会超时。

## 解决方案

### 方案1: 配置 Docker 镜像加速器

创建或编辑 `/etc/docker/daemon.json` 文件：

```json
{
  "registry-mirrors": [
    "https://docker.1ms.run",
    "https://docker.xuanyuan.cn",
    "https://hub-mirror.c.163.com",
    "https://mirror.baidubce.com"
  ]
}
```

然后重启 Docker：

```bash
sudo systemctl daemon-reload
sudo systemctl restart docker
```

### 方案2: 手动拉取镜像

如果镜像加速器不生效，可以尝试手动拉取镜像：

```bash
# 拉取基础镜像
docker pull python:3.11-slim
docker pull node:20-alpine
docker pull postgres:15
docker pull redis:7-alpine
docker pull nginx:alpine
```

### 方案3: 使用代理

如果公司网络需要代理，配置 Docker 代理：

```json
{
  "proxies": {
    "http-proxy": "http://proxy.example.com:8080",
    "https-proxy": "http://proxy.example.com:8080"
  }
}
```

## 验证配置

```bash
docker info | grep -A 10 "Registry Mirrors"
```
