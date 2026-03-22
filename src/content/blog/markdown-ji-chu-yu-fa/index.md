---
title: 'Markdown基础语法'
publishDate: 2026-03-22
description: 'Markdown十一个基础常用语法，让我们专注内容而不是纠结排版'
tags:
  - Markdown
  - 教程
language: '中文'
heroImage:
  src: './fengmian.png'
  alt: '封面图'
  inferSize: true
  color: '#3d9943'
---

# Markdown基础语法

Markdown是一种轻量级标记语言，排版语法简洁，让人们更多地关注内容本身而非排版，Markdown 无处不在。StackOverflow、CSDN、掘金、简书、GitBook、有道云笔记、V2EX、光谷社区等。主流的代码托管平台，如 GitHub、GitLab、BitBucket、Coding、Gitee 等等，都支持 Markdown 语法，很多开源项目的 README、开发文档、帮助文档、Wiki 等都用 Markdown 写作。

## 一.标题

> `#`和标题之间要加一个空格，最多六级标题

```markdown
# 一级标题

## 二级标题

### 三级标题
```

## 二. 换行

> 在一行末尾添加**两个空格**或使用 HTML的`<br>` 标签实现段内换行：

```markdown
这是第一行  
这是第二行
```

## 三. 强调

| 语法           | 效果         |
| -------------- | ------------ |
| `**粗体**`     | **粗体**     |
| `*斜体*`       | _斜体_       |
| `***粗斜体***` | **_粗斜体_** |
| `~~删除线~~`   | ~~删除线~~   |

## 四. 引用块

> `>`和引用内容之间需要加一个空格，可以多行引用和嵌套引用

**嵌套引用**：

```markdown
> 外层引用
>
> > 嵌套引用
```

> 外层引用
>
> > 嵌套引用

## 五. 列表

### 无序列表

> 可用 `-`、`*`、`+` 三种符号，效果相同，一样需要加空格

```markdown
- 项目一
- 项目二
  - 子项目（缩进2个空格）
    - 更深层（缩进4个空格）
```

- 项目一
- 项目二
  - 子项目
    - 更深层

### 有序列表

> 输出`1.`然后按空格

```markdown
1. 第一项
2. 第二项
3. 第三项
   1. 子列表
   2. 子列表
```

1. 第一项
2. 第二项
3. 第三项
   1. 子列表
   2. 子列表

### 任务列表

```markdown
- [x] 已完成
- [ ] 未完成
- [ ] 另一个未完成
```

- [x] 已完成
- [ ] 未完成
- [ ] 另一个未完成

---

## 六. 代码

### 行内代码

> 左右两个反引号包裹内容

```markdown
`console.log('hello')`
```

### 代码块

使用三个反引号包裹，并可指定语言：

```markdown
​`javascript
function hello() {
  console.log('Hello!');
}
​`
```

## 七. 分隔线

使用三个或以上的 `-`、`*`、`_`：

```markdown
---
---

---
```

---

## 八. 链接

```markdown
[百度](https://www.baidu.com)
```

[百度](https://www.baidu.com)

## 九. 图片

```markdown
![替代文字](图片URL)
![替代文字](图片URL '提示文字')
```

**带链接的图片**：

```markdown
[![图片说明](图片URL)](点击跳转的链接)
```

## 十. 表格

```markdown
| 表头1  | 表头2 |  表头3 |
| :----- | :---: | -----: |
| 左对齐 | 居中  | 右对齐 |
| 内容1  | 内容2 |  内容3 |
```

| 表头1  | 表头2 |  表头3 |
| :----- | :---: | -----: |
| 左对齐 | 居中  | 右对齐 |
| 内容1  | 内容2 |  内容3 |

**对齐说明**：

- `|:---|` 左对齐
- `|:---:|` 居中
- `|---:|` 右对齐

## 十一. 嵌入视频

### YouTube

```markdown
<iframe width="560" height="315" src="https://www.youtube.com/embed/视频ID" frameborder="0" allowfullscreen></iframe>
```

### Bilibili

```markdown
<iframe src="//player.bilibili.com/player.html?bvid=BV号&page=1" width="560" height="315" frameborder="0" allowfullscreen></iframe>
```

### HTML5 video 标签

```markdown
<video src="视频URL" controls width="560">
  您的浏览器不支持 video 标签
</video>
```

## 快速参考

| 功能   | 语法             |
| ------ | ---------------- | --- | --- | --- |
| 标题   | `# ` - `###### ` |
| 粗体   | `**文字**`       |
| 斜体   | `*文字*`         |
| 删除线 | `~~文字~~`       |
| 链接   | `[文字](URL)`    |
| 图片   | `![文字](URL)`   |
| 代码块 | ` ```语言 ``` `  |
| 引用   | `> `             |
| 列表   | `- ` 或 `1. `    |
| 表格   | `                |     |     | `   |
| 分隔线 | `---`            |
| 转义   | `\`              |
