---
title: 'MCP 配置指南'
publishDate: 2026-06-13
description: '本文介绍了什么是 MCP 以及如何配置 MCP'
tags:
  - AI
  - 笔记
language: '中文'
---

# MCP 配置指南

## 什么是 MCP

**MCP (Model Context Protocol)** 是由 Anthropic 提出的**开放协议**，旨在让 AI 模型（如 Claude）与外部工具、数据源、服务进行标准化通信

可以把它理解为 **"AI 世界的 USB 协议"**：

| 概念类比     | 说明                                              |
| ------------ | ------------------------------------------------- |
| USB 协议     | 让电脑插上不同外设（鼠标、键盘、U盘）就能用       |
| **MCP 协议** | 让 AI 模型连上不同工具（搜索、数据库、API）就能用 |

通过 MCP，Claude 等 AI 工具可以：

- **🌐 联网搜索** — 实时查询网络信息
- **🗄️ 查询数据库** — 访问 SQL/NoSQL
- **🔧 调用 API** — 对接 GitHub、Slack、Jira 等服务
- **📄 处理文档** — 解析 PDF、Word、Excel

## MCP 的架构

```
┌─────────────────────────────────────┐
│          AI 模型 (Claude)            │
│    (MCP 客户端 / Host)              │
└──────────┬──────────────────────────┘
           │ MCP 协议
     ┌─────┴──────┐
     │  MCP 服务器  │
     │ (工具提供方) │
     └─────┬──────┘
           │
     ┌─────┴──────┐
     │  外部服务   │
     │ (API/DB/FS) │
     └────────────┘
```

**三个核心角色：**

- **Host** — 运行 AI 模型的程序（如 Claude Code）
- **Server** — 提供具体工具的服务（如 Firecrawl）
- **Client** — Host 与 Server 之间的通信桥梁（协议实现）

## MCP 配置的 JSON 数据结构

### 完整的 JSON 结构

```jsonc
{
  "mcpServers": {
    // ↑ 固定键名，表示 MCP 服务器配置的根对象

    "your-server-name": {
      // ↑ 服务器名称（自定义，用于标识哪个 MCP）

      "type": "stdio",
      // "stdio"     — 通过标准输入/输出通信（本地进程）
      // "http"      — 通过 HTTP 远程连接
      // 连接方式（可选），省略时默认 "stdio"

      "command": "npx",
      // ↑ 启动命令（必填）
      // 可执行文件路径，如：node、python、npx、bun、cmd

      "args": [
        // 命令参数（可选，数组），传递给 command 的命令行参数
        "-y",
        "firecrawl-mcp"
      ],

      "url": "https://api.example.com/mcp",
      // ↑ 远程 URL（type 为 "http" 时使用）
      // 代替 command/args，直接连接远程 MCP 服务器

      "headers": {
        // ↑ HTTP 请求头（type 为 "http" 时可选）
        "Authorization": "Bearer ${TOKEN}"
      },

      "env": {
        // ↑ 环境变量（可选）
        // 传递给 MCP 服务器的环境变量，通常放 API Key
        "FIRECRAWL_API_KEY": "fc-xxxxxxxxxxxxxxxxxxxx"
      }
    },

    "second-server": {
      // ... 可以配置多个 MCP 服务器
    }
  }
}
```

### 各字段详细说明

#### `mcpServers`（根对象）

| 字段         | 类型     | 必填 | 说明                                           |
| ------------ | -------- | ---- | ---------------------------------------------- |
| `mcpServers` | `object` | ✅   | MCP 服务器配置的容器，所有服务器定义都在这里面 |

#### 服务器配置（`mcpServers` 下的每个键）

| 字段           | 类型     | 必填 | 说明                                                                          |
| -------------- | -------- | ---- | ----------------------------------------------------------------------------- |
| **服务器名称** | `string` | ✅   | 自定义名称，用于区分不同的 MCP 服务。例：`"Firecrawl"`、`"GitHub"`            |
| `type`         | `string` | ❌   | 连接类型。`"stdio"`（本地进程，默认值）或 `"http"`（远程）                    |
| `command`      | `string` | ⚠️   | 启动可执行文件。stdio 模式必填。常见值：`node`、`npx`、`python`、`bun`、`cmd` |
| `args`         | `array`  | ❌   | 传递给 command 的参数列表。例：`["-y", "firecrawl-mcp"]`                      |
| `url`          | `string` | ⚠️   | 远程 MCP 服务器的 URL。http 模式时使用，替代 command/args                     |
| `headers`      | `object` | ❌   | HTTP 请求头键值对。http 模式时可选，用于鉴权                                  |
| `env`          | `object` | ❌   | 环境变量键值对。通常存放 API Key、密钥等敏感信息                              |

### 实际配置示例对比

#### stdio 模式（本地进程）

```json
"Firecrawl": {
  "type": "stdio",
  "command": "npx",
  "args":[
    "-y",
    "firecrawl-mcp"
    ]
  "env": {
    "FIRECRAWL_API_KEY": "fc-xxxxxxxxxxxxxxxxxxxx"
  }
}
```

```json
"Playwright": {
  "command": "npx",
  "args": ["@playwright/mcp@latest"]
}
```

#### HTTP 模式（远程服务）

```json
"github": {
  "type": "http",
  "url": "https://api.githubcopilot.com/mcp/",
  "headers": {
    "Authorization": "Bearer ${GITHUB_PERSONAL_ACCESS_TOKEN}"
  }
}
```

## 总结

- MCP 是 AI 模型连接外部工具的标准化协议
- 核心配置是 `mcpServers` 对象，每个服务器有 `command`/`args`（本地）或 `url`（远程）
- `env` 存放环境变量（API Key 等敏感信息）
- 支持多级配置，项目级 > 全局级
