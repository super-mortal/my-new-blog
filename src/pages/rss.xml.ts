import { getBlogCollection, getPostSlug, sortMDByDate } from 'astro-pure/server'
import config from '@/site-config'

const escape = (s: unknown) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export const GET = async () => {
  const allPostsByDate = sortMDByDate(await getBlogCollection())
  const rssFullText = (config as { rssFullText?: boolean }).rssFullText === true
  const baseUrl = (import.meta.env.SITE || '').replace(/\/$/, '')

  const items = await Promise.all(
    allPostsByDate.map(async (post) => {
      const link = `${baseUrl}/blog/${getPostSlug(post)}/`
      let contentHtml
      if (rssFullText) {
        try {
          const { remark } = await import('remark')
          const remarkHtml = (await import('remark-html')).default
          contentHtml = String(await remark().use(remarkHtml).process(post.body))
        } catch {
          contentHtml = post.data.description || ''
        }
      } else {
        contentHtml = post.data.description || ''
      }
      return {
        title: post.data.title,
        pubDate: post.data.publishDate,
        description: post.data.description,
        link,
        content: contentHtml,
        categories: [post.data.category, ...post.data.tags].filter(Boolean)
      }
    })
  )

  const lastBuildDate = new Date(
    allPostsByDate[0]?.data.updatedDate ?? allPostsByDate[0]?.data.publishDate ?? Date.now()
  ).toUTCString()

  const xmlItems = items
    .map(
      (it) =>
        [
          '    <item>',
          `      <title>${escape(it.title)}</title>`,
          `      <link>${escape(it.link)}</link>`,
          `      <guid isPermaLink="true">${escape(it.link)}</guid>`,
          `      <pubDate>${it.pubDate.toUTCString()}</pubDate>`,
          ...it.categories.map((c) => `      <category>${escape(c)}</category>`),
          `      <description>${escape(it.description || '')}</description>`,
          `      <content:encoded>${escape(it.content)}</content:encoded>`,
          '    </item>'
        ].join('\n')
    )
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escape(config.title)} RSS</title>
    <link>${escape(baseUrl)}</link>
    <description>${escape(config.description || '')}</description>
    <language>zh-CN</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${escape(`${baseUrl}/rss.xml`)}" rel="self" type="application/rss+xml" />
    <image>
      <url>${escape(`${baseUrl}/favicon/favicon-32x32.png`)}</url>
      <title>${escape(config.title)} RSS</title>
      <link>${escape(baseUrl)}</link>
    </image>
${xmlItems}
  </channel>
</rss>`

  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } })
}
