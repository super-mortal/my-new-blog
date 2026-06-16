---
title: '新项目推送到 GitHub 完整指南'
publishDate: 2026-06-16
description: '从零开始的新项目推送到 Github 的完整流程总结'
tags:
  - Github
  - 总结
language: '中文'
---

# 新项目推送到 GitHub 完整指南

## 一\.绑定电脑

```Markdown
# 配置全局用户名（和你的 GitHub 用户名一致）
git config --global user.name "你的GitHub用户名"

# 配置全局邮箱（和你 GitHub 账号绑定的邮箱一致）
git config --global user.email "你的GitHub邮箱"
```

## 二\.关联电脑

### 第一步：打开终端（ CMD / PowerShell 都行）

执行下面这条命令，**一路回车，不要输入任何密码**

```Bash
ssh-keygen -t ed25519 -C "你的GitHub注册邮箱"
```

### 第二步：复制公钥内容

```Bash
type C:\Users\你的电脑用户名\.ssh\id_ed25519.pub
```

执行后，终端会输出一长串**以 ssh\-ed25519 开头、邮箱结尾**的字符串，**把它完整复制下来**

### 第三步：把公钥粘贴到 GitHub

1. 打开 GitHub 右上角头像 → **Settings**

2. 左侧找到 **SSH and GPG keys**

3. 点击 **New SSH key**

4. Title 随便填（比如：我的笔记本）

5. Key type 选 **Authentication key**

6. Key 框里**粘贴你刚才复制的那串字符**

7. 点 **Add SSH key** → 完成！

### 第四步：测试连接是否成功

```Markdown
ssh -T git@github.com
# 如果出现：Hi xxx! You've successfully authenticated...
# ✅ **说明 SSH 配置 100% 成功！**
```

## 三\.前提条件

在开始之前，确保你已经：

### 1\.绑定电脑和关联电脑已经完成

同一个电脑只需要一次，后续不用再重复操作，完成后会在`C:\Users\你电脑的用户名\.ssh`目录下有凭证

### 2\. 验证本地已安装 Git

打开终端

```Bash
git --version
```

### 3\. 已在 GitHub 上创建新仓库

- 登录 GitHub

- 点击右上角 "\+" → "New repository"

- 填写仓库名称（如 `my-new-blog`）

- **不要勾选** "Add a README file"、"Add \.gitignore" 等选项

- 点击 "Create repository"

## 四\.标准推送流程

### 步骤 1：初始化 Git

```Markdown
# 项目根目录初始化 git 仓库（这会在文件夹里创建一个 .git 隐藏文件夹）
git init
```

### 步骤 2：添加文件到暂存区

```Markdown
# 添加所有文件到暂存区（. 代表当前目录所有文件）
git add .

# 如果只想添加特定文件，比如只加 README.md：
git add README.md
```

### 步骤 3：提交暂存区的文件

```Markdown
# 提交文件，-m 后面是提交说明（必须写，描述这次提交的内容）
git commit -m "initial commit: 初始化项目，添加基础代码"
```

### 步骤 4：关联 GitHub 远程仓库

回到 GitHub 的新仓库页面，复制仓库的 HTTPS/SSH 地址（推荐用 SSH），然后执行：

```Markdown
# 关联远程仓库（替换成实际的仓库地址）

# HTTPS 方式：
git remote add origin https://github.com/你的用户名/仓库名.git

# SSH 方式（推荐）：
git remote add origin git@github.com:你的用户名/仓库名.git
```

### 步骤 5：推送到 GitHub 仓库

```Markdown
# 把本地 master/main 分支推送到远程 origin 仓库，并设置默认上游分支

# 如果 GitHub 仓库默认分支是 main（直接推送）
git push -u origin main

# 如果 GitHub 仓库默认分支是 master（老项目）：
git push -u origin master

# 如果本地分支是 master，但想推送到远程 main：

# 重命名本地分支
git branch -m master main

# 推送并重命名远程分支
git push -u origin main
```

**说明：**

- `-u` 参数用于绑定本地分支与远程分支，之后直接用 `git push` 就能自动推送

- GitHub 新仓库默认分支是 `main`，老项目可能是 `master`

## 五\.Git 分支管理基础

### 1\. GitHub 主分支的两种习惯

- **早期 GitHub 默认主分支**：`master`

- **现在 GitHub 新仓库默认主分支**：`main`

- **你也可以在仓库设置里把任意分支设为默认主分支**

### 2\. 本地分支与远程分支的对应关系

#### 本地分支名 ≠ 远程分支名

它们可以不一样，但**强烈建议保持同名**，避免混淆。

#### 推送时对应关系

- **同名推送**（最推荐）：本地分支名 = 远程分支名

- **手动指定不同名**：也可以手动指定不同名，但不建议，容易搞乱

### 3\. 分支命名规范（行业通用）

| 分支类型   | 命名示例          | 用途                                |
| ---------- | ----------------- | ----------------------------------- |
| 主分支     | `main` / `master` | 稳定可发布的代码                    |
| 开发分支   | `develop` / `dev` | 日常开发集成                        |
| 功能分支   | `feature/xxx`     | 新功能开发，如 `feature/user-login` |
| 修复分支   | `fix/xxx`         | 修复 bug，如 `fix/payment-error`    |
| 热修复分支 | `hotfix/xxx`      | 线上紧急修复                        |
| 发布分支   | `release/v1.2`    | 版本发布前的准备                    |

### 4\. 常用 Git 分支命令

```Bash
# 查看所有分支
git branch

# 查看当前分支
git branch

# 重命名当前分支
git branch -m 旧名 新名

# 切换分支
git checkout 分支名

# 创建新分支
git branch 新分支名

# 切换并创建新分支
git checkout -b 新分支名

# 推送新分支到远程
git push -u origin 新分支名

```

## 六\.快速参考

### 常用命令速查

```Bash
# 初始化仓库
git init

# 添加文件
git add .

# 提交
git commit -m "说明"

# 关联远程仓库
git remote add origin git@github.com:用户名/仓库名.git

# 推送
git push -u origin main

# 查看状态
git status

# 查看分支
git branch

# 查看远程仓库
git remote -v

```

### 完整示例（从零开始）

```Bash
# 1. 进入项目目录

# 2. 初始化 Git
git init

# 3. 添加所有文件
git add .

# 4. 提交
git commit -m "initial commit: 初始化项目"

# 5. 关联远程仓库
git remote add origin git@github.com:super-mortal/my-new-blog.git

# 6. 推送到 GitHub（本地是 master）
git push -u origin master

# 或者推送到 main（本地 master → 远程 main）
git branch -m master main
git push -u origin main

```
