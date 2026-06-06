---
title: 'super-ppt 技能介绍'
publishDate: 2026-06-06
description: '本文介绍了 super-ppt 技能是什么，如何使用以及未来发展规划'
tags:
  - 技能
  - workbuddy
language: '中文'
---

# super-ppt 技能介绍

> 写在前面：大一上学期，一些简单的作业的 PPT 都是用的 kimi 做的，到了今年，发现 kimi 做 PPT 的这些功能开始收费了，后来豆包也上了 PPT 制作，但是需要排队很难排到，而且现在豆包的PPT等高级功能也开始收费了，所以我就想把做PPT这件事包装成一个技能，方便自己使用

## 一.项目简介

**super-ppt** 是一个专为 AI Agent 平台优化的 PPT 制作工具，支持 WorkBuddy、OpenClaw 和 Hermes 等平台。它能将 PDF、Word、Excel、网页、Markdown 或对话内容，通过智能流水线生成**可直接编辑的 PPTX 文件**。

重点强调：生成的是 PowerPoint 原生元素，而不是整页截图，你可以像编辑普通 PPT 一样修改文字、调整布局、更改配色。

## 二.核心特性

- **零成本使用**：完全免费，在GitHub以 MIT 协议进行开源，同时发布在skillhub社区，无需付费订阅
- **一键安装**：通过 SkillHub 商店直接下载，无需配置环境
- **多格式支持**：PDF、Word、Excel、网页、Markdown 等
- **智能设计**：AI 自动规划布局、配色、图表
- **丰富资源**：71+ 图表模板，11,000+ 图标
- **真正可编辑**：super-ppt 采用 SVG → PowerPoint 原生元素的转换方式，生成的每个文本框、图形、图表都可以直接编辑

## 三.快速开始

**环境要求** 唯一的要求是电脑安装 **Python 3.10+** 版本。如果你还没有安装 Python，可以访问 [python.org](https://www.python.org/downloads/) 下载。

### WorkBuddy 用户

**方法一：SkillHub 商店安装（推荐）**

1. 打开 WorkBuddy，进入左侧**技能页面**
2. 进入 **SkillHub 专栏**，搜索 `super-ppt`
3. 点击下载并安装
4. 开始使用：
   ```
   @skill:super-ppt 把这个 PDF 做成 16:9 演示文稿
   ```

**方法二：手动上传安装**

如果在 SkillHub 商店搜索不到：

1. 访问 [GitHub Releases](https://github.com/super-mortal/super-ppt/releases)
2. 下载最新版本的 `super-ppt-skillhub.zip`
3. 打开 WorkBuddy → 左侧**技能页面** → 右上角**添加技能**
4. 上传下载的 zip 文件

### OpenClaw / Hermes 用户

1. 访问 [SkillHub 主页](https://skillhub.cn/skills/super-ppt)
2. 查看下载方式并安装
3. 开始使用

首次使用时，脚本会自动检查并下载所需的资源包（约 5.5 MB），无需手动配置

## 工作流程

super-ppt 采用 7 步串行流水线：

```markdown
源材料 → Markdown → 项目初始化 → 八项确认 → 获取图片 → 生成 SVG → 导出 PPTX
```

### 1. 理解需求

识别源材料类型、画布格式、风格偏好

### 2. 转换源材料

将各种格式转换为 Markdown

### 3. 创建项目

初始化项目目录结构

### 4. 策划设计（八项确认）⭐

这是最关键的步骤，AI 会与你确认：

- 画布格式（16:9 或 4:3）
- 页数范围
- 目标受众
- 风格目标
- 配色方案
- 图标策略
- 排版方案
- 图片策略

### 5. 获取图片

根据需要进行 AI 生图或网络搜图

### 6. 生成 SVG

逐页生成 SVG 文件，支持浏览器实时预览

### 7. 导出 PPTX

转换为可编辑的 PowerPoint 文件

## 使用示例

1. 基础用法

```
@skill:super-ppt 把这个 PDF 做成 16:9 演示文稿
```

2. 从主题开始

```
@skill:super-ppt 做一份关于"AI 编程工具发展趋势"的演示文稿，16:9 格式，15 页左右
```

3. 网页转 PPT

```
@skill:super-ppt 把这个网页内容做成 PPT：https://example.com/article
```

4. Markdown 转 PPT

```
@skill:super-ppt 把这个 Markdown 文档转为演示文稿，使用学术答辩风格
```

## 技术特点

### 1. 模块化架构

super-ppt 采用清晰的模块化设计：

- **source_to_md/** - 格式转换模块
- **image_backends/** - AI 生图后端（15 个）
- **image_sources/** - 图片搜索源（4 个）
- **svg_to_pptx/** - SVG 转 PPTX 模块
- **tts_backends/** - 语音合成后端（6 个）

### 2. 资源按需下载

为了符合 SkillHub 平台的文件数量限制（≤200 文件），super-ppt 采用了创新的资源下载机制：

- **精简包**：只包含 8 个核心文本文件（0.03 MB）
- **资源包**：首次使用时自动从 GitHub Release 下载（5.5 MB）
- **断点续传**：支持下载中断后继续

### 3. SVG → PowerPoint 原生转换

这是 super-ppt 最核心的技术优势。通过 SVG 中间格式：

1. AI Agent 逐页手写 SVG 代码（精确控制布局）
2. 解析 SVG 元素（文本、图形、路径等）
3. 转换为 PowerPoint DrawingML 对象
4. 保留可编辑性

## 未来规划

> 未来 super-ppt 还有很多自己的路要走，大致安排如下

- 🔄 **工作流优化**：优化改进现有流程，解决上下文太长的问题
- 🔄 **逻辑改造**：对部分功能逻辑进行独立完善
- 🔄 **功能增强**：根据用户反馈持续改进
- 🔄 **多端支持**：可能推出网页版或桌面端应用

## 相关链接

- **GitHub 仓库**：[https://github.com/super-mortal/super-ppt](https://github.com/super-mortal/super-ppt)
- **SkillHub 主页**：[https://skillhub.cn/skills/super-ppt](https://skillhub.cn/skills/super-ppt)
