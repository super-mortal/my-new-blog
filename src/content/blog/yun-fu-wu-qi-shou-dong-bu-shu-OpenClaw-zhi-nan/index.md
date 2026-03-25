---
title: '云服务器手动部署OpenClaw指南'
publishDate: 2026-03-25
description: '在非root用户下部署OpenClaw，大大提高安全性'
tags:
  - OpenClaw
  - 教程
language: '中文'
heroImage:
  src: './fengmian.png'
  alt: '封面图'
  inferSize: true
  color: '#e24747'
---

# 云服务器手动部署OpenClaw指南

> **写在前面：我之前手动部署的openclaw有两个问题。第一是在root用户下直接部署，一开始我是觉得这样最大权限，龙虾可以做的东西多一点，但是到了后来我发现很少情况需要用到root权限；第二是我允许通过公网访问，是因为我想浏览器也可以操作，但是实际运用起来发现，对接了通讯渠道之后再也用不到Web ui了，所以为了安全考虑，重新部署了我的”龙虾“，于是做了这个笔记，方便日后回顾和帮助同样想手动部署的人**

## 一.概念解释

### 1.什么是 Root 用户？

root 是 Linux 系统的超级管理员，拥有最高权限。用 root 运行程序不安全，万一被攻击，攻击者就能控制整台服务器。

### 2.为什么要用专用用户？

把 OpenClaw 装在一个专门的"抽屉"里运行：

- OpenClaw 只能访问自己的文件
- 不会影响系统其他部分
- 更安全，即使被攻击也有限制

### 3.什么是 systemd

systemd 是 Linux 系统的"自动管家"，可以：

- 开机自动启动程序
- 程序崩溃自动重启
- 统一管理所有服务

## 二.登录 VPS

**使用MobaXterm（Windows 推荐）**

1. 下载 [MobaXterm](https://mobaxterm.mobatek.net/)
2. 点击左上角 **Session** → **SSH**

- **Remote host**：你的 VPS IP地址

4. **Specify username**：填 `root`
5. 点击 **OK**，输入密码

## 三.确认工作

### 1.确认你的系统

连接服务器后，执行：

```markdown
cat /etc/os-release

# 应该看到 `Ubuntu` 或 `Debian` 字样
```

### 2.确认你是 Root

执行以下命令，输出必须是 `root`

```markdown
whoami
```

如果不是，执行下面命令输入密码就会切换到root

```markdown
sudo -i
```

## 四.创建专用用户

### 1.执行创建用户命令

**在 root 用户下执行：**

```markdown
useradd -r -s /usr/sbin/nologin -m -d /opt/openclaw openclaw
```

| 命令部分               | 含义           | 说明                              |
| ---------------------- | -------------- | --------------------------------- |
| `useradd`              | 创建新用户     | Linux 添加用户的命令              |
| `-r`                   | 系统账户       | 创建系统用户，不占用户编号        |
| `-s /usr/sbin/nologin` | 禁止登录       | 用户不能 SSH 登录，但程序可以运行 |
| `-m`                   | 创建 home 目录 | 自动创建用户的主目录              |
| `-d /opt/openclaw`     | 指定 home 目录 | 用户的主目录放在这里              |
| `openclaw`             | 用户名         | 给这个用户起个名字                |

### 2.设置目录权限

**在 root 用户下执行：**

```markdown
chown -R openclaw:openclaw /opt/openclaw
```

| 命令部分            | 含义                         |
| ------------------- | ---------------------------- |
| `chown`             | 改变文件/目录的所有者        |
| `-R`                | 递归，即包含所有子目录和文件 |
| `openclaw:openclaw` | 用户名:用户组名              |
| `/opt/openclaw`     | 要修改权限的目录             |

意思是：把 `/opt/openclaw` 这个目录以及里面的所有东西都给 `openclaw` 用户。

### 3.验证用户创建成功

**在 root 用户下执行：**

```markdown
id openclaw
```

**成功的输出类似这样：**

```markdown
uid=998(openclaw) gid=998(openclaw) groups=998(openclaw)

# 能看到 uid、gid、groups 就说明用户创建成功了
```

## 五.安装 Node.js

### 1.安装 Node.js 24

**在 root 用户下执行：**

**第一步：安装 NodeSource 仓库**

```markdown
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
```

| 命令部分                                | 含义                        |
| --------------------------------------- | --------------------------- |
| `curl`                                  | 下载文件的命令              |
| `-fsSL`                                 | 安静模式，失败跟随重定向    |
| `https://deb.nodesource.com/setup_24.x` | NodeSource 官方安装脚本地址 |
| `sudo -E bash -`                        | 用 root 权限执行下载的脚本  |

**第二步：安装 Node.js**

```markdown
apt-get install -y nodejs
```

| 命令部分          | 含义                 |
| ----------------- | -------------------- |
| `apt-get install` | apt 包管理器安装命令 |
| `-y`              | 自动确认，不再询问   |
| `nodejs`          | 要安装的包名         |

### 2.验证安装成功

**在 root 用户下执行：**

```markdown
node --version
npm --version

# 成功的输出：

v24.0.0
10.9.0
```

## 六.安装 OpenClaw

### 1.执行官方安装脚本

**在 root 用户下执行：**

```markdown
sudo -u openclaw bash -c 'curl -fsSL https://openclaw.ai/install.sh | bash'
```

| 命令部分                         | 含义                               |
| -------------------------------- | ---------------------------------- |
| `sudo -u openclaw`               | 以 openclaw 用户身份执行后面的命令 |
| `bash -c '...'`                  | 执行引号里的 bash 命令             |
| `curl -fsSL`                     | 下载文件                           |
| `https://openclaw.ai/install.sh` | OpenClaw 官方安装脚本              |
| `\| bash`                        | 把下载的内容作为脚本执行           |

### 2.为什么要加 sudo -u openclaw？

因为 OpenClaw 的配置文件和程序要装在 `/opt/openclaw` 目录里，这个目录属于 openclaw 用户。所以要用 openclaw 的身份来安装，这样所有文件都自动归 openclaw 用户。

### 3.等待安装完成

安装过程大约需要 3-5 分钟，看到程序开始运行安装向导就行，

[向导选择可以点击查看教程 ](https://share.note.youdao.com/s/OtVTeFy8) Gateway bind部分保持默认就行

### 4.找到 OpenClaw 安装位置

安装脚本会自动把 OpenClaw 装到 openclaw 用户的目录下。找到它：

```
find /opt/openclaw -name "openclaw" 2>/dev/null
```

**会输出类似：**

```
/opt/openclaw/.npm-global/bin/openclaw
/opt/openclaw/.npm-global/lib/node_modules/openclaw
```

这就是 OpenClaw 命令的实际位置

### 创建命令快捷方式

因为实际路径很长，给它创建一个短名字的快捷方式：

```
ln -s /opt/openclaw/.npm-global/bin/openclaw /usr/local/bin/openclaw
```

| 命令部分                                 | 含义                     |
| ---------------------------------------- | ------------------------ |
| `ln -s`                                  | 创建软链接（快捷方式）   |
| `/opt/openclaw/.npm-global/bin/openclaw` | 实际的 openclaw 程序位置 |
| `/usr/local/bin/openclaw`                | 快捷方式放在哪里         |

**⚠️ 为什么这一步必不可少**

**安装脚本把 OpenClaw 装到了 openclaw 用户的 npm 全局目录里：**

```
/opt/openclaw/.npm-global/bin/openclaw
```

这个路径**不在系统的 PATH 环境变量中**，所以 shell 直接打 `openclaw` 会报 `command not found`

在执行这一步之前，如果想运行 openclaw 命令，必须用**完整路径**：

```
/opt/openclaw/.npm-global/bin/openclaw plugins install @tencent-connect/openclaw-qqbot@latest
```

创建快捷方式后，相当于在 `/usr/local/bin/openclaw` 放了一个指向真实程序的链接，而 `/usr/local/bin` 是在 PATH 里的，所以现在直接打 `openclaw` 就能找到命令了。

**本质就是**：npm 把程序装到了一个不在 PATH 的自定义路径里，软链接这一步就是帮命令链接到系统 PATH 目录，让全系统都能直接调用。

### 验证安装成功

```markdown
openclaw --version

# 显示版本号即为成功
```

## 七.配置环境变量

### 1.什么是环境变量？

环境变量就像"程序的环境设置"，告诉程序：

- 配置文件在哪里
- 状态文件在哪里
- 工作目录在哪里

### 2.官方推荐的环境变量

OpenClaw 官方文档推荐在非 root 部署时设置以下环境变量：

| 变量名                 | 作用                         | 我们的设置                              |
| ---------------------- | ---------------------------- | --------------------------------------- |
| `OPENCLAW_HOME`        | 程序的主目录，所有路径的基准 | `/opt/openclaw`                         |
| `OPENCLAW_STATE_DIR`   | 状态目录，存配置和会话       | `/opt/openclaw/.openclaw`               |
| `OPENCLAW_CONFIG_PATH` | 配置文件路径                 | `/opt/openclaw/.openclaw/openclaw.json` |
| `NODE_COMPILE_CACHE`   | Node.js 编译缓存，加速启动   | `/var/tmp/openclaw-compile-cache`       |
| `OPENCLAW_NO_RESPAWN`  | 避免重复启动开销             | `1`                                     |

### 3.创建环境变量文件

**在 root 用户下执行：**

**第一步：创建目录**

```
sudo -u openclaw mkdir -p /opt/openclaw/.openclaw
```

| 命令部分                  | 含义                         |
| ------------------------- | ---------------------------- |
| `sudo -u openclaw`        | 以 openclaw 用户执行         |
| `mkdir -p`                | 创建目录（如果已存在不报错） |
| `/opt/openclaw/.openclaw` | 要创建的目录路径             |

**第二步：创建并编辑环境变量文件**

```markdown
sudo -u openclaw nano /opt/openclaw/.openclaw/.env
```

**第三步：输入以下内容**

把下面 5 行内容复制粘贴进去，完事后Ctrl+O保存内容**（注意是字母O不是数字0）**，再按Enter确认保存，最后Ctrl+X退出编辑

```markdown
OPENCLAW_HOME=/opt/openclaw
OPENCLAW_STATE_DIR=/opt/openclaw/.openclaw
OPENCLAW_CONFIG_PATH=/opt/openclaw/.openclaw/openclaw.json
NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
OPENCLAW_NO_RESPAWN=1
```

### 4.设置缓存目录权限

```markdown
mkdir -p /var/tmp/openclaw-compile-cache
chown openclaw:openclaw /var/tmp/openclaw-compile-cache
```

## 八.接入QQ机器人

> 前往[QQ开放平台（openclaw）](https://q.qq.com/qqbot/openclaw/index.html)注册并创建自己的机器人

### 1.安装插件

```bash
sudo -u openclaw bash -c "cd /opt/openclaw && openclaw plugins install @tencent-connect/openclaw-qqbot@latest"
```

| 命令部分                                 | 含义                                             |
| ---------------------------------------- | ------------------------------------------------ |
| `sudo -u openclaw`                       | 以 openclaw 用户身份执行后面的命令               |
| `bash -c "..."`                          | 打开一个新的 bash shell，执行引号里的命令        |
| `cd /opt/openclaw`                       | 切换到 openclaw 安装目录                         |
| `openclaw plugins install`               | openclaw 的插件安装命令                          |
| `@tencent-connect/openclaw-qqbot@latest` | QQ Bot 插件的 npm 包名，@latest 表示安装最新版本 |

### 2.添加 QQ 机器人账号

```bash
sudo -u openclaw bash -c "cd /opt/openclaw && openclaw channels add --channel qqbot --token '你的AppID:你的AppSecret'"
```

| 命令部分                         | 含义                                                  |
| -------------------------------- | ----------------------------------------------------- |
| `sudo -u openclaw bash -c "..."` | 同上，以 openclaw 用户执行命令                        |
| `cd /opt/openclaw`               | 切换到 openclaw 目录                                  |
| `openclaw channels add`          | 添加频道账号的命令                                    |
| `--channel qqbot`                | 指定频道类型为 qqbot                                  |
| `--token 'AppID:AppSecret'`      | QQ 机器人的凭证，格式是 `AppID:AppSecret`，用冒号分隔 |

### 3.重启服务

```bash
sudo systemctl restart openclaw-gateway
```

| 命令部分           | 含义                                               |
| ------------------ | -------------------------------------------------- |
| `sudo`             | 以 root 身份执行（systemd 服务管理需要 root 权限） |
| `systemctl`        | systemd 服务管理工具                               |
| `restart`          | 重启服务                                           |
| `openclaw-gateway` | openclaw 网关服务的名称                            |

### 4.验证网关状态

```markdown
ss -tlnp | grep 18789

# 如果显示 LISTEN，说明正在运行，即成功
```

## 九.创建开机自启服务

### 1.第一步：检测你的环境支持哪种方式

**在 root 用户下执行：**

```bash
systemctl list-units --type=service --state=running 2>/dev/null | head -5
```

- **如果有输出**（列出了一些服务名）→ systemd 可用，用 **方案 A**
- **如果报错或无输出**（如 `Failed to connect to bus`）→ systemd 不可用，用 **方案 B**

### 方案 A：systemd 服务（推荐，适合完整 Linux 系统）

#### 1.什么是 systemd 服务？

systemd 是 Linux 的"服务管理器"。创建服务后，OpenClaw 可以：

- 开机自动启动
- 崩溃后自动重启
- 不需要人工干预

#### 2.创建服务配置文件

**在 root 用户下执行：**

```markdown
nano /etc/systemd/system/openclaw-gateway.service
```

#### 3.粘贴以下内容

把下面的内容完整复制，粘贴进去

```
[Unit]
Description=OpenClaw Gateway
Documentation=https://docs.openclaw.ai
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=openclaw
Group=openclaw
WorkingDirectory=/opt/openclaw
ExecStart=/opt/openclaw/.npm-global/bin/openclaw gateway --port 18789
Restart=always
RestartSec=5
TimeoutStartSec=90

Environment="OPENCLAW_HOME=/opt/openclaw"
Environment="OPENCLAW_STATE_DIR=/opt/openclaw/.openclaw"
Environment="OPENCLAW_CONFIG_PATH=/opt/openclaw/.openclaw/openclaw.json"
Environment="NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache"
Environment="OPENCLAW_NO_RESPAWN=1"

NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=read-only
PrivateTmp=true
ReadWritePaths=/opt/openclaw

[Install]
WantedBy=multi-user.target
```

**配置解释**

| 配置项                           | 含义                       |
| -------------------------------- | -------------------------- |
| `Description`                    | 服务的描述名称             |
| `After=network-online.target`    | 等网络准备好再启动         |
| `User=openclaw`                  | 以 openclaw 用户身份运行   |
| `Group=openclaw`                 | 以 openclaw 用户组身份运行 |
| `WorkingDirectory=/opt/openclaw` | 工作目录                   |
| `ExecStart=...`                  | 启动时执行的命令           |
| `Restart=always`                 | 崩溃后自动重启             |
| `RestartSec=5`                   | 崩溃后等 5 秒再重启        |
| `TimeoutStartSec=90`             | 启动超时 90 秒             |
| `Environment="..."`              | 环境变量设置               |
| `NoNewPrivileges=true`           | 不提升权限（安全）         |
| `ProtectSystem=strict`           | 限制访问系统目录（安全）   |
| `ProtectHome=read-only`          | 禁止访问 home 目录（安全） |
| `PrivateTmp=true`                | 私有临时目录（安全）       |
| `ReadWritePaths=/opt/openclaw`   | 允许读写的目录             |
| `WantedBy=multi-user.target`     | 开机在多用户模式下启动     |

#### 4.重新加载 systemd

**在 root 用户下执行：**

```markdown
systemctl daemon-reload
```

#### 5.设置开机自启

**在 root 用户下执行：**

```markdown
systemctl enable openclaw-gateway.service
```

#### 6.立即启动服务

**在 root 用户下执行：**

```markdown
systemctl start openclaw-gateway.service
```

#### 7.验证是否成功

**在 root 用户下执行：**

```markdown
systemctl status openclaw-gateway.service

# 成功的标志：

- 看到 `Active: active (running)` ✅
- 不是 `inactive` 或 `failed`
```

### 方案 B：Crontab 开机任务

#### 1.编写启动脚本

**在 root 用户下执行：**

```markdown
sudo -u openclaw tee /opt/openclaw/start-gateway.sh > /dev/null <<'EOF'
#!/bin/bash
source /opt/openclaw/.openclaw/.env
exec /opt/openclaw/.npm-global/bin/openclaw gateway --port 18789
EOF
chmod +x /opt/openclaw/start-gateway.sh
chown openclaw:openclaw /opt/openclaw/start-gateway.sh
```

#### 2.添加开机任务

**在 root 用户下执行：**

```markdown
crontab -e

# 如果是第一次用 crontab，选 `1` 用 nano 编辑
```

**在文件最后添加这一行**

```
@reboot /opt/openclaw/start-gateway.sh >> /var/log/openclaw-gateway.log 2>&1
```

按 **Ctrl + O**，回车保存，**Ctrl + X** 退出

#### 3.立即启动 Gateway

**在 root 用户下执行：**

```
/opt/openclaw/start-gateway.sh &
```

#### 4.查看是否启动成功

```
sleep 3 && sudo -u openclaw bash -c 'source /opt/openclaw/.openclaw/.env && openclaw gateway status'
```

看到 `Listening: 127.0.0.1:18789` 说明成功。

## 十.常用命令速查

| 操作         | 方案 A（systemd）                                                                           | 方案 B（crontab）                                                                           |
| ------------ | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| 查看状态     | `systemctl status openclaw-gateway.service`                                                 | `sudo -u openclaw bash -c 'source /opt/openclaw/.openclaw/.env && openclaw gateway status'` |
| 启动         | `systemctl start openclaw-gateway.service`                                                  | `/opt/openclaw/start-gateway.sh &`                                                          |
| 停止         | `systemctl stop openclaw-gateway.service`                                                   | `pkill -f "openclaw gateway"`                                                               |
| 重启         | `systemctl restart openclaw-gateway.service`                                                | `pkill -f "openclaw gateway" && /opt/openclaw/start-gateway.sh &`                           |
| 查看日志     | `journalctl -u openclaw-gateway.service -n 50`                                              | `tail -50 /var/log/openclaw-gateway.log`                                                    |
| 实时日志     | `journalctl -u openclaw-gateway.service -f`                                                 | `tail -f /var/log/openclaw-gateway.log`                                                     |
| Gateway 状态 | `sudo -u openclaw bash -c 'source /opt/openclaw/.openclaw/.env && openclaw gateway status'` | 同左                                                                                        |
| 健康检查     | `sudo -u openclaw bash -c 'source /opt/openclaw/.openclaw/.env && openclaw health'`         | 同左                                                                                        |
| 查看版本     | `openclaw --version`                                                                        | 同左                                                                                        |
| 初始化向导   | `sudo -u openclaw bash -c 'source /opt/openclaw/.openclaw/.env && openclaw onboard'`        | 同左                                                                                        |
| 创建备份     | `sudo -u openclaw bash -c 'source /opt/openclaw/.openclaw/.env && openclaw backup create'`  | 同左                                                                                        |
| 健康诊断     | `sudo -u openclaw bash -c 'source /opt/openclaw/.openclaw/.env && openclaw doctor'`         | 同左                                                                                        |

## 十一.常见问题

### Q1: 安装脚本报 `command not found`

说明 OpenClaw 安装到了非标准路径。找到它：

```markdown
find /opt/openclaw -name "openclaw" 2>/dev/null
```

然后创建快捷方式：

```markdown
ln -s /opt/openclaw/.npm-global/bin/openclaw /usr/local/bin/openclaw
```

### Q2: 服务启动失败？

**先查看 Gateway 状态：**

```markdown
sudo -u openclaw bash -c 'source /opt/openclaw/.openclaw/.env && openclaw gateway status'
```

**方案 A 用户查看 systemd 日志：**

```markdown
journalctl -u openclaw-gateway.service -n 50
```

**方案 B 用户查看日志：**

```markdown
tail -50 /var/log/openclaw-gateway.log
```

### Q3: 怎么完全卸载？

```markdown
# 1. 停止服务

systemctl stop openclaw-gateway.service 2>/dev/null || pkill -f "openclaw gateway"
systemctl disable openclaw-gateway.service 2>/dev/null

# 2. 删除 systemd 服务文件（如有）

rm /etc/systemd/system/openclaw-gateway.service 2>/dev/null
systemctl daemon-reload 2>/dev/null

# 3. 删除 crontab 开机任务（如有）

crontab -l 2>/dev/null | grep -v "start-gateway.sh" | crontab - 2>/dev/null
rm /opt/openclaw/start-gateway.sh 2>/dev/null

# 4. 卸载 OpenClaw（保留配置和会话）

sudo -u openclaw bash -c 'source /opt/openclaw/.openclaw/.env && openclaw uninstall' 2>/dev/null

# 5. 删除用户和目录（谨慎，会删除所有数据！）

userdel openclaw 2>/dev/null
rm -rf /opt/openclaw
rm -rf /var/tmp/openclaw-compile-cache
```
