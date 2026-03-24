---
title: '为网站配置SSL证书'
publishDate: 2026-03-24
description: '同一服务器部署两个及以上的项目时，手动为每个域名申请SSL证书，避免配置信息错误，Nginx无法正确处理域名分流，导致的后部署的项目无法正确访问的问题'
tags:
  - 服务器
  - 运维
  - 教程
language: '中文'
heroImage:
  src: './fengmian.png'
  alt: '封面图'
  inferSize: true
  color: '#b37651'
---

# 为网站配置SSL证书

> 在同一个服务器上部署两个项目时，宝塔面板一键申请SSL证书的时候，会因为重定向问题导致验证失败，所以我学习了手动部署SSL证书的方法，做了这个笔记，以docker部署的项目为例（本文的Nginx是在主机上，监听的是主机端口），通过本文，可以确保申请的证书独立对应域名，让Nginx正确处理域名分流

## 一.确定docker映射到宿主机的端口

1. 理解端口映射

```
127.0.0.1:8088->80/tcp
        ↓       ↓  ↓
   主机端口 →  容器  协议
              端口
```

**含义**：访问主机的 `8088` 端口 => 转发到容器的 `80` 端口

2. 找到需要代理的端口，终端执行以下命令

```bash
docker ps --format "table {{.Names}}\t{{.Ports}}"
```

找到要对外访问的容器，记下它的**主机端口**（冒号左边的数字）

## 二.创建 Nginx 配置文件

**假设**：

- 你的域名：`yourdomain.com`
- Docker 容器映射的主机端口：`8088`

1. 创建配置文件

```bash
nano /usr/local/nginx/conf/conf.d/yourdomain.com.conf
```

2. 粘贴以下内容**（只需要把 yourdomain.com 和 8088 改成实际的值即可）**

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location /.well-known/acme-challenge/ {
        root /var/www/acme;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl;
    http2 on;
    server_name yourdomain.com;

    ssl_certificate /usr/local/nginx/conf/ssl/yourdomain.com/fullchain.pem;
    ssl_certificate_key /usr/local/nginx/conf/ssl/yourdomain.com/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers EECDH+CHACHA20:EECDH+CHACHA20-draft:EECDH+AES128:RSA+AES128:EECDH+AES256:RSA+AES256:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    add_header Strict-Transport-Security "max-age=31536000";

    location / {
        proxy_pass http://127.0.0.1:8088;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
    }
}
```

## 三.申请 SSL 证书

> **以 Let's Encrypt 证书为例**！Let's Encrypt 是全球最受信赖的免费 CA，浏览器默认信任

1. 先创建目录

```bash
mkdir -p /var/www/acme
mkdir -p /usr/local/nginx/conf/ssl/yourdomain.com
```

2. 申请 Let's Encrypt 证书

```bash
/root/.acme.sh/acme.sh --issue -d yourdomain.com -w /var/www/acme --keylength ec-256 --server letsencrypt
```

**参数说明**：
| 参数 | 含义 |
|------|------|
| `-d yourdomain.com` | 要申请证书的域名 |
| `-w /var/www/acme` | HTTP 验证目录（acme.sh 会在这个目录创建验证文件） |
| `--keylength ec-256` | 使用 ECDSA 256 位加密（更快更安全） |
| `--server letsencrypt` | **指定使用 Let's Encrypt**安装证书 |

3. 安装证书到目录

```bash
/root/.acme.sh/acme.sh --install-cert -d yourdomain.com \
  --key-file /usr/local/nginx/conf/ssl/yourdomain.com/key.pem \
  --fullchain-file /usr/local/nginx/conf/ssl/yourdomain.com/fullchain.pem \
  --reloadcmd "nginx -s reload"
```

## 四.证书到期更新

> Let's Encrypt 的免费证书有效期是 **90 天**。安装的时候设置了`--reloadcmd`所以acme.sh 会在证书到期前 **30 天**自动续期，所以一般情况下不需要手动操作,安装时候就会自动设置定时任务每天检查

1. 确认自动续期已配置

```markdown
# 终端执行命令
crontab -l | grep acme.sh

# 正常输出，这是每天13点02分自动执行
2 13 * * * "/root/.acme.sh"/acme.sh --cron --home "/root/.acme.sh" > /dev/null
```

2. 查看证书到期时间

```markdown
# 查看所有证书
/root/.acme.sh/acme.sh --list

# 查看单个证书详情
/root/.acme.sh/acme.sh --info -d 你的域名
```

3. 如果没有正确设置到定时任务自动续期，可以手动续期

```markdown
# 强制续期（忽略是否到期）
/root/.acme.sh/acme.sh --renew -d 你的域名 --force

# 手动续期所有证书
/root/.acme.sh/acme.sh --cron --home "/root/.acme.sh"
```

## 五.测试并生效

1. 测试配置

```bash
/usr/local/nginx/sbin/nginx -t
```

2. 看到这些就对了：

```
nginx: the configuration file /usr/local/nginx/conf/nginx.conf syntax is ok
nginx: configuration file /usr/local/nginx/conf/nginx.conf test is successful
```

3. 重启 Nginx

```bash
/usr/local/nginx/sbin/nginx -s reload
```

## 六.多个项目如何确保网站不互串

1. 检查现有配置

```bash
ls -la /usr/local/nginx/conf/conf.d/
```

应该看到如下配置文件：

```
first.top.conf
second.top.conf
third.com.conf
```

2. 每个配置文件里的关键区别

| 网站       | server_name  | proxy_pass              |
| ---------- | ------------ | ----------------------- |
| first.top  | `first.top`  | `http://127.0.0.1:8317` |
| second.top | `second.top` | `http://127.0.0.1:8088` |
| third.com  | `third.com`  | `http://127.0.0.1:8000` |

**只要 `server_name` 不同，Nginx 就会精准匹配，互不干扰！**

3. 所以同一个服务器部署多个网站对应多个域名时，只需要在创建配置文件时候，正确填写对应的域名即可

```bash
# 1. 创建配置（改域名和端口）
nano /usr/local/nginx/conf/conf.d/实际域名.conf

# 2. 申请证书（改域名，必须加 --server letsencrypt）
/root/.acme.sh/acme.sh --issue -d 实际域名 -w /var/www/acme --keylength ec-256 --server letsencrypt

# 3. 安装证书（改域名）
/root/.acme.sh/acme.sh --install-cert -d 实际域名 \
  --key-file /usr/local/nginx/conf/ssl/实际域名/key.pem \
  --fullchain-file /usr/local/nginx/conf/ssl/实际域名/fullchain.pem \
  --reloadcmd "nginx -s reload"

# 4. 测试并重载
/usr/local/nginx/sbin/nginx -t && /usr/local/nginx/sbin/nginx -s reload
```

## 七.常见问题

### Q: 申请证书报错 "Can't find directory"

```bash
mkdir -p /var/www/acme
```

### Q: 申请证书报错 "Domain is not point to this server"

域名 DNS 还没生效，等几分钟再试。或者检查域名 A 记录是否指向当前服务器 IP。

### Q: HTTPS 能访问但显示不安全

1. 检查证书是不是 Let's Encrypt：

   ```bash
   openssl x509 -in /usr/local/nginx/conf/ssl/你的域名/fullchain.pem -noout -issuer
   ```

   应该显示 `Issuer: C = US, O = Let's Encrypt`

2. 如果不是 Let's Encrypt，可能是其他的证书不受浏览器信任所以还是显示不安全，删除重新申请：

   ```bash
   /root/.acme.sh/acme.sh --remove -d 你的域名
   /root/.acme.sh/acme.sh --issue -d 你的域名 -w /var/www/acme --keylength ec-256 --server letsencrypt
   ```

3. 如果是 **Let's Encrypt** 的证书但仍然显示不安全，可能是浏览器缓存了旧的证书

```markdown
1. 清除普通缓存

- 菜单 → 隐私和安全 → 清除浏览数据

- 勾选上述两项，清除

2. 清除HSTS（强制HTTPS策略）

**地址栏输入**

- Chrome： chrome://net-internals/#hsts 

- Edge： edge://net-internals/#hsts 

- 找到 Delete domain security policies

- 输入域名（如 example.com ）→ Delete

3. 清除单个网站HTTPS缓存（精准）

- 打开网站 → 地址栏左侧锁图标 → 网站设置 → 清除数据
```
