---
title: 'OpenCode 介绍和使用教程'
publishDate: 2026-04-21
description: '本文介绍了什么是 OpenCode 以及如何使用 OpenCode，详细说明了如何自定义模型'
tags:
  - AI
  - 教程
language: '中文'
---

# OpenCode 介绍及使用教程

> 在 Claude code 源码没有被泄露之前，OpenCode 一直是我使用的核心编程工具，相当于是 Claude code 的平替，4.1号 Claude code 源码被意外泄露之后，我逐渐转向了 Claude code，但仍偶尔使用到OpenCode （主要是简单的任务，直接让 OpenCode 的免费模型进行处理）因此写了篇文章总结一下

## 一.OpenCode 简介

OpenCode 是一款开源的 AI 编码代理工具，包含CLI，客户端，IDE插件，云端四种形态，它完全开源，并且内置四大免费模型，开箱即用，用户还可以自行接入第三方自定义模型，无需被单一平台绑定，同时 OpenCode 以隐私为首要原则，不存储任何代码或上下文数据，可适配隐私敏感环境

## 二.核心功能亮点

- LSP 支持：自动加载适合大语言模型（LLM）的语言服务器协议（LSP），提升编码体验

- 多会话并行：可在同一个项目中同时启动多个代理，高效处理多任务

- 会话分享：可生成会话链接，用于参考或协作调试，方便团队协作

- 多模型兼容：支持 75+ 种 LLM 提供商，包括本地模型，选择灵活

- 编辑器适配：运行于终端，可与任意集成开发环境（IDE）搭配使用，不局限于特定工具

## 三.安装方法

OpenCode 支持多种安装方式，可根据自身系统和习惯选择

1. 一键安装（推荐）

```bash
curl -fsSL https://opencode.ai/install | bash
```

2. 其他安装方式

```bash
# npm 安装
npm i -g opencode-ai@latest

# 适用于bun
bun add -g opencode-ai

# brew 安装（适用于 macOS）
brew install opencode

# paru 安装（适用于 Arch Linux）
paru -S opencode
```

3. 安装验证

安装完成后，可通过以下命令验证是否安装成功

```bash
opencode -v
```

## 四.快速使用教程

### 1) 基础操作流程

1. 启动 OpenCode：在项目目录下，输入命令 `opencode`，启动工具并进入终端交互界面
2. 初始化项目：输入命令 `/init`，AI 会自动分析项目结构，并生成 AGENTS\.md 配置文件，完成项目初始化
3. 接下来就可以用自然语言和 OpenCode 进行对话，让 OpenCode 干活了

### 2) 常用命令

```bash
# 查看或选择会话和模型
ctrl+p

# 查看当前模型
/models

# 生成当前会话的分享链接（取消分享是/unshare）会自动复制链接到剪切板
/share

# 把对话记录导出成文件
/export

# 查看对话记录,选中某次对话后，回车选择 Revert 功能可以把代码跟聊天记录一起回退到这次对话之前的状态
/timeline

# 压缩上下文，生成简洁摘要
/compact

# 撤销上一步操作
/undo
```

## 五.自定义模型

> OpenCode 自定义模型接入，核心是通过 `opencode.json` 配置文件对接任意兼容 OpenAI 格式的模型

### 1.在 ~/opencode 目录下创建opencode.json文件

### 2.不同提供商不同模型

```json
{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "openrouter": {
      "npm": "@ai-sdk/openai-compatible",
      "options": {
        "baseURL": "第一个模型提供商Base URL",
        "apiKey": "第一个模型提供商的密钥"
      },
      "models": {
        "模型ID": { "name": "模型显示名称，自定义" }
      }
    },
    "openrouter2": {
      "npm": "@ai-sdk/openai-compatible",
      "options": {
        "baseURL": "第二个模型提供商Base URL",
        "apiKey": "第二个模型提供商的密钥"
      },
      "models": {
        "模型ID": { "name": "模型显示名称，自定义" }
      }
    }
  },
  "model": "openrouter2/模型ID"
  // 默认模型，实际配置的时候要把这行注释删掉
}
```

### 3.同提供商不同模型

```json
{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "openrouter": {
      "npm": "@ai-sdk/openai-compatible",
      "options": {
        "baseURL": "提供商Base URL",
        "apiKey": "提供商的密钥"
      },
      "models": {
        "第一个模型ID": {
          "name": "模型显示名称，自定义"
        },
        "第二个模型ID": {
          "name": "模型显示名称，自定义"
        },
        "第三个模型ID": {
          "name": "模型显示名称，自定义"
        }
      }
    }
  },
  "model": "openrouter/默认模型ID"
}
```

### 4.安装依赖

```bash
npm install @ai-sdk/openai-compatible --save
```
