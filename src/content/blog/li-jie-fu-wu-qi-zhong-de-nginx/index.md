---
title: '理解服务器中的Nginx'
publishDate: 2026-03-24
description: '一文读懂什么是Nginx和其在服务器中的作用'
tags:
  - 服务器
  - 知识点
  - 运维
language: '中文'
heroImage:
  src: './fengmian.png'
  alt: '封面图'
  inferSize: true
  color: '#6d86ac'
---

# 理解服务器中的Nginx

## 一.什么是 Nginx？

打个比喻，你去饭店吃饭，前台问你定的哪个包间，这个前台在服务器上就叫**Nginx**

| 餐厅前台         | 服务器 Nginx         |
| ---------------- | -------------------- |
| 接待来吃饭的顾客 | 接待访问网站的用户   |
| 问顾客订哪个包间 | 根据域名区分请求     |
| 带顾客到包间     | 把请求转发给后端程序 |
| 把菜端给顾客     | 把处理结果返回给用户 |

## 二.Nginx 在服务器中起什么作用？

1. 先看看没有 Nginx 会怎样

![没有nginx的世界](./meiyounginx.png)

2. 有 Nginx 之后

```
用户访问网站
           ┌───────────────────────────┐
           │        服务器              │
           │                           │
           │   ┌─────────────┐         │
           │   │  Nginx      │         │
           │   │  (前台)      │         │
           │   └──────┬──────┘         │
           │          │                │
           │          ↓                │
           │   ┌────────────┐          │
           │   │ 后端程序    │          │
           │   │ (厨师)      │          │
           │   └────────────┘          │   ->返回网页给用户
           └───────────────────────────┘
```

**Nginx 专门负责"接待"，后端程序专门负责"做菜"，各司其职！**

3. 更深层次理解Nginx 具体干什么

```
┌──────────────────────────────────────────┐
│                    Nginx 的工作           │
├──────────────────────────────────────────┤
│  1️⃣  接收请求                             │
│      用户访问 → Nginx 先收到               │
│                                          │
│  2️⃣  区分域名                             │
│      first.com → A网站                    │
│      second.com → B网站                   │
│      third.com → C网站                    │
│                                          │
│  3️⃣  反向代理                             │
│      把请求转发给后端程序                   │
│                                          │
│  4️⃣  处理 HTTPS                          │
│      加密解密，证书验证                    │
│                                         │
│  5️⃣  提供静态文件                         │
│      图片、CSS、JS                       │
│                                         │
│  6️⃣  返回结果                            │
│      返回结果给用户                       │
└────────────────────────────── ──────────┘
```

![Nginx的作用](./nginxzuoyong.png)

4. 前台可以同时接待很多客人，Nginx也可以同时处理不同的用户请求

```
一个前台（Nginx），同时接待多个人：

访客1 ──→ 前台 ──→ A网站
访客2 ──→ 前台 ──→ B网站
访客3 ──→ 前台 ──→ A网站    ->高效处理
```

## 三.Nginx配置中的核心概念

1. 什么是server？

**server = 一家公司/一个网站**

```nginx
server {
    server_name first.com;
    # 这就是 first.com 这个网站
}

server {
    server_name second.com;
    # 这就是 second.com 这个网站
}
```

**同一个服务器上部署多个不同的服务，分别绑定对应的域名时，这里的server_name就是对应的域名，通过这个配置，Nginx就可以清楚的知道用户需要访问的是哪个服务，比如用户输入的是second.com，Nginx就会去找second.com对应的配置文件对应的服务然后返回给用户，而不会返回first.com域名对应的服务，这就是多域名共用一个服务器（域名分流）**

2. 什么是 location？

**location = URL 路径/部门**

```nginx
server {
    server_name first.com;

    location / {
        # 处理 first.com/ 的请求
    }

    location /api {
        # 处理 first.com/api 的请求
    }
}
```

3. 什么是 proxy_pass？

**proxy_pass = 转交/外包**

```nginx
location / {
    proxy_pass http://127.0.0.1:3000;
    # 这个请求我不处理了
    # 转交给 http://127.0.0.1:3000
}
```

## 四.Nginx在服务器中的目录

- 一般情况下Nginx的安装目录

```
/usr/local/nginx/                    ← Nginx 安装目录
    │
    ├── conf/                        ← 配置文件目录
    │   │
    │   ├── nginx.conf               ← 主配置文件（不用改）
    │   │
    │   └── conf.d/                  ← ⭐ 网站配置放这里
    │       │
    │       ├── first.top.conf
    │       └── second.top.conf
    │
    ├── logs/                        ← 日志目录
    │   │
    │   ├── access.log               ← 访问日志（谁来过）
    │   └── error.log                ← 错误日志（出过错）
    │
    └── sbin/                        ← 可执行文件
        │
        └── nginx                    ← 启动命令
```

- SSL 证书存放目录

```
/usr/local/nginx/conf/ssl/            ← ⭐ SSL 证书放这里
    │
    ├── first.top/                    ← first.top 网站的证书
    │   │
    │   ├── fullchain.pem             ← 完整证书链
    │   └── key.pem                   ← 私钥
    │
    └── second.top/                   ← second.top 网站的证书
        │
        ├── fullchain.pem
        └── key.pem
```

- 快速查看命令

```bash
# 查看 Nginx 配置文件位置
ls -la /usr/local/nginx/conf/

# 查看所有网站配置
ls -la /usr/local/nginx/conf/conf.d/

# 查看 SSL 证书
ls -la /usr/local/nginx/conf/ssl/

# 查看日志
tail -f /usr/local/nginx/logs/access.log
tail -f /usr/local/nginx/logs/error.log

# 查看正在运行的 Nginx
ps aux | grep nginx

# 重启 Nginx
/usr/local/nginx/sbin/nginx -s stop
/usr/local/nginx/sbin/nginx
```

## 五.一个请求的完整旅程

以docker部署的服务为例，当你访问 `https://first.top` 时：

```
第1步：DNS 解析
    你输入 https://first.top
    DNS 服务器说：IP 是 1.2.3.4.55

第2步：连接服务器
    浏览器连接到 1.2.3.4.55:443

第3步：Nginx 接待
    Nginx 收到请求
    看看是哪个域名 → first.top
    找对应的配置 → first.top.conf

第4步：处理 HTTPS
    用 first.top 的 SSL 证书加密通信

第5步：反向代理
    把请求转发到 Docker 容器的 8088 端口

第6步：Docker 容器处理
    容器里的 nginx 再转发
    给 nav-site-nodejs 处理

第7步：返回结果
    网页返回给 Nginx
    Nginx 返回给浏览器
    浏览器显示页面
```

## 六.总结

> **所以在服务器中，Nginx主要负责这些工作（仅本文提到）**

1. 域名分流：一个服务器对应多个域名多个网站服务，看域名转发给不同的服务
2. 静态资源处理：直接返回图片、JS、CSS，减轻后端压力
3. 反向代理：把请求转给后端服务（如Java、Node.js），隐藏真实端口
4. HTTPS加密：配置SSL证书，实现安全访问

> 关键目录速查

| 用途         | 目录                                    |
| ------------ | --------------------------------------- |
| Nginx 主配置 | `/usr/local/nginx/conf/nginx.conf`      |
| 网站配置     | `/usr/local/nginx/conf/conf.d/***.conf` |
| SSL 证书     | `/usr/local/nginx/conf/ssl/域名/`       |
| Nginx 日志   | `/usr/local/nginx/logs/`                |
| 启动命令     | `/usr/local/nginx/sbin/nginx`           |
