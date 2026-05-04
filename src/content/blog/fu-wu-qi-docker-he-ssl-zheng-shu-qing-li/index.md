---
title: '服务器 Docker 和 SSL 证书清理'
publishDate: 2026-05-04
description: '本教程适用于删除任意指定 Docker 项目（含容器、镜像）、对应 SSL 证书，以及重新无缓存构建容器，全程不影响服务器其他服务及项目'
tags:
  - 服务器
  - 教程
language: '中文'
---

# 服务器 Docker 和 SSL 证书清理

## 一.删除指定 docker

### 1.查看所有容器

```bash
docker ps -a
```

> 输出说明：可清晰看到每个容器的 CONTAINER ID（容器唯一ID）、IMAGE（所用镜像）、NAMES（容器名称），记录要删除的容器的名称或ID

### 2.执行容器删除操作

#### 删除单个容器

```bash
docker rm -f -v 容器名或容器ID
```

#### 删除多个容器

```bash
docker rm -f -v 容器1名/ID 容器2名/ID 容器3名/ID
```

#### 命令解释

- \-f：强制停止并删除目标容器（即使容器处于运行中，也能直接删除）
- \-v：删除容器自带的内部存储、临时缓存及专属数据卷，确保容器相关缓存彻底清理
- 此操作仅删除 Docker 容器及内部关联缓存，**不会删除服务器本地的项目文件**（如挂载的代码目录）
- 仅删除指定容器，不影响服务器上其他正在运行或已停止的容器

### 3.挂载目录一起删除

```markdown
# 查看挂载路径

docker inspect 容器名 | grep -E 'Source|Destination'

# 输出举例

"Source": "/root/devhome/mysql-data",
"Destination": "/var/lib/mysql"
Source：你服务器本地的真实目录（数据库数据存在这里）
Destination：容器内部目录（不用管）

# 删除容器

docker rm -f -v 容器名/ID

# 删数据库数据

rm -rf 服务器本地Source路径
```

## 二.删除对应镜像

### 1.查看所有镜像

```bash
docker images
```

> 输出说明：通过第一步记录的容器所用镜像（IMAGE 字段），对应找到需要删除的镜像，记录镜像名或镜像ID

### 2.执行镜像删除操作

### 删除单个镜像

```bash
docker rmi 镜像名或镜像ID
```

### 删除多个镜像

```bash
docker rmi 镜像1名/ID 镜像2名/ID 镜像3名/ID
```

### 3.清理 Docker 无用残留缓存

删除镜像后，执行以下命令，清理 Docker 系统中无用的残留缓存（如悬空镜像、废弃网络、临时构建产物等），不影响其他在用容器和镜像

```bash
docker system prune -f
```

### 4.注意事项

- 必须先删除容器，再删除镜像（若镜像仍被容器引用，直接删除镜像会失败）

- `docker system prune \-f` 仅清理“无人引用”的垃圾缓存，不会误删正在使用的镜像、容器或网络

## 三.删除目标项目绑定的 SSL 证书

此步骤仅针对目标项目绑定的域名 SSL 证书（由 acme\.sh 申请），彻底删除证书及相关配置，不影响其他域名的证书。

### 1.查看所有 SSL 证书（定位目标证书）

执行以下命令，查看服务器上所有由 acme\.sh 申请的 SSL 证书，找到目标项目绑定的域名

```bash
acme.sh --list
```

### 2.注销 SSL 证书

通知证书颁发机构（如 Let\&\#39;s Encrypt），该域名的证书不再使用，执行注销命令：

```bash
acme.sh --revoke -d 目标域名
```

补充：若证书为 ECC 类型，需在命令后添加 \-\-ecc，即：`acme\.sh \-\-revoke \-d 目标域名 \-\-ecc`

### 3.从 acme\.sh 管理列表删除证书

将目标域名的证书从 acme\.sh 的管理列表中删除，避免后续自动续期：

```bash
acme.sh --remove -d 目标域名
```

### 4.彻底删除证书文件及缓存

acme\.sh 申请的证书文件默认存储在 \~/\.acme\.sh/ 目录下，执行以下命令删除对应域名的所有证书文件、私钥及缓存：

```bash
rm -rf ~/.acme.sh/目标域名
rm -rf ~/.acme.sh/目标域名_ecc
```

### 5.删除 Nginx 中对应域名的配置

目标域名的反向代理、SSL 配置文件一般存储在 /usr/local/nginx/conf/ssl/ 目录下，执行以下命令删除

**具体路径说明可以查看往期文章:** [理解服务器中的Nginx](https://supermortal.cn/blog/li-jie-fu-wu-qi-zhong-de-nginx))

### 6.重载 Nginx 使配置生效

```bash
nginx -t  # 检查配置语法，输出 test is successful 即为正常
systemctl reload nginx  # 重载 Nginx
```

## 四.重新构建容器时无缓存方法

> 此步骤适用于删除旧项目后重新构建，或更新项目代码后重新构建，全程不产生缓存，确保构建的容器为最新版本，避免缓存导致的旧代码残留。

### 1.先删除旧容器

若重新构建的是原有项目，需先删除旧的容器（避免端口冲突、缓存残留）

```bash
docker rm -f 旧容器名或ID
```

### 2.进入项目目录

切换到存放项目 Dockerfile 的目录（必须进入该目录，否则构建会失败）

```bash
cd /服务器上的项目目录
```

### 3.无缓存构建镜像

执行无缓存构建命令，确保不使用任何旧缓存，完全基于最新代码构建镜像：

```bash
docker build --no-cache -t 镜像名 .
```

**注意⚠️：** \-\-no\-cache 是核心参数，用于禁用缓存；\-t 用于指定镜像名称（自定义，与后续启动容器时的镜像名一致）；末尾的 \. 表示当前目录（即 Dockerfile 所在目录）。

### 4.启动新容器

镜像构建完成后，执行启动命令，启动新容器（使用自己的启动参数，如端口映射、目录挂载等）

```bash
docker compose up -d --build
```

### 5.清理构建残留缓存

构建完成后，执行以下命令，清理构建过程中产生的无用缓存（如中间构建层），节省磁盘空间

```bash
docker image prune -f
```

### 6.注意事项

- \-\-no\-cache 必须添加，否则 Docker 会复用旧缓存，导致构建的镜像不是最新代码

- 启动容器时，确保端口、目录挂载等参数正确，避免与其他容器冲突

- docker image prune \-f 仅清理构建残留的无用缓存，不影响正在使用的镜像和容器

- 若构建失败，需先检查 Dockerfile 是否正确，再重新执行构建命令
