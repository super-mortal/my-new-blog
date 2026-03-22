---
title: 'Markdown进阶语法'
publishDate: 2026-03-21
description: 'Markdown进阶语法，让我们专注内容而不是纠结排版'
tags:
  - Markdown
  - 教程
language: '中文'
heroImage:
  src: './fengmian.png'
  alt: '封面图'
  inferSize: true
  color: '#3d9987'
---

# Markdown 进阶语法

## 一. 警告框

使用引用块 + Emoji 模拟警告效果：

```markdown
> ⚠️ **警告：** 这是一条警告信息！

> 📝 **注意：** 这是一条注意事项。

> 💡 **提示：** 这是一条有用的提示。

> ❌ **错误：** 这是一条错误信息。
```

**效果**：

> ⚠️ **警告：** 这是一条警告信息！

> 📝 **注意：** 这是一条注意事项。

> 💡 **提示：** 这是一条有用的提示。

> ❌ **错误：** 这是一条错误信息。

## 二. Emoji 表情

### 1.使用简写（冒号语法）

```markdown
:smile: :laughing: :heart: :thumbsup:
:star: :fire: :check: :x:
:rocket: :bulb: :warning: :info:
:book: :pencil: :camera: :video:
:sun: :moon: :cloud: :rain:
```

### 2.常用 Emoji

| 简写            | 效果 | 简写            | 效果 |
| --------------- | ---- | --------------- | ---- |
| `:thumbsup:`    | 👍   | `:thumbsdown:`  | 👎   |
| `:ok_hand:`     | 👌   | `:raised_hand:` | ✋   |
| `:point_right:` | 👉   | `:point_left:`  | 👈   |
| `:point_up:`    | 👆   | `:point_down:`  | 👇   |
| `:clap:`        | 👏   | `:wave:`        | 👋   |
| `:fist:`        | ✊   | `:v:`           | ✌️   |
| `:pray:`        | 🙏   | `:muscle:`      | 💪   |
| `:eyes:`        | 👀   | `:ear:`         | 👂   |
| `:nose:`        | 👃   | `:tongue:`      | 👅   |
| `:lips:`        | 👄   | `:bow:`         | 🙇   |

### 3.emoji合集

[emoji合集](https://www.emojiall.com)

## 三. 缩进

使用 `&nbsp;` 实现缩进：

```markdown
&nbsp;&nbsp;&nbsp;&nbsp;这是缩进的段落。
```

效果：

&nbsp;&nbsp;&nbsp;&nbsp;这是缩进的段落。
