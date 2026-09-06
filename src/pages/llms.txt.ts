import type { APIRoute } from 'astro'

import { getBlogCollection, getPostSlug, sortMDByDate } from 'astro-pure/server'
import config from '@/site-config'

const siteUrl = (path: string) => new URL(path.replace(/^\/?/, '/'), import.meta.env.SITE).href

export const GET: APIRoute = async () => {
  const posts = sortMDByDate(await getBlogCollection())

  const coreLinks = [
    { href: '/', title: '首页' },
    { href: '/about', title: '关于我' },
    { href: '/archives', title: '文章归档' },
    { href: '/blog', title: '博客文章列表' },
    { href: '/categories', title: '全部分类' },
    { href: '/tags', title: '全部标签' },
    { href: '/rss.xml', title: 'RSS 订阅' }
  ].map(({ href, title }) => `- [${title}](${siteUrl(href)}): ${title}`)

  const postLinks = posts.map(
    (post) =>
      `- [${post.data.title}](${siteUrl(`/blog/${getPostSlug(post)}`)}): ${post.data.description}`
  )

  const text = `# ${config.title}

> ${config.description}

## Core pages

${coreLinks.join('\n')}

## Articles

${postLinks.join('\n')}
`

  return new Response(text, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8'
    }
  })
}
