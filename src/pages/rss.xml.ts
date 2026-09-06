import {getBlogCollection, sortMDByDate} from "astro-pure/server"
import config from "@/site-config"

export const GET = async () => {
  const allPostsByDate = sortMDByDate(await getBlogCollection())
  const rssFullText = (config as { rssFullText?: boolean }).rssFullText === true
  const baseUrl = import.meta.env.SITE || ""

  const items = await Promise.all(
    allPostsByDate.map(async (post) => {
      const link = baseUrl + "blog/" + post.id + "/"
      let contentHtml
      if (rssFullText) {
        try {
          const { remark } = await import("remark")
          const remarkHtml = (await import("remark-html")).default
          const html = String(await remark().use(remarkHtml).process(post.body))
          contentHtml = html + "<p>Read full: " + link + "</p>"
        } catch (e) {
          contentHtml = (post.data.description || "") + "<p>Read full: " + link + "</p>"
        }
      } else {
        contentHtml = (post.data.description || "") + "<p>Read full: " + link + "</p>"
      }
      return {
        title: post.data.title,
        pubDate: post.data.publishDate,
        description: post.data.description,
        link: link,
        content: contentHtml
      }
    })
  )

  const escape = (s: unknown) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  const xmlItems = items.map((it) => "    <item>\n      <title>" + escape(it.title) + "</title>\n      <link>" + escape(it.link) + "</link>\n      <guid isPermaPermalink=\"true\">" + escape(it.link) + "</guid>\n      <pubDate>" + it.pubDate.toUTCString() + "</pubDate>\n      <description>" + escape(it.description || "") + "</description>\n      <content:encoded>" + escape(it.content) + "</content:encoded>\n    </item>").join("\n")
  const xml = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<rss version=\"2.0\" xmlns:content=\"http://purl.org/rss/1.0/modules/content/\" xmlns:atom=\"http://www.w3.org/2005/Atom\">\n  <channel>\n    <title>" + escape(config.title) + " RSS</title>\n    <link>" + escape(baseUrl) + "</link>\n    <description>" + escape(config.description || "") + "</description>\n    <language>zh-CN</language>\n" + xmlItems + "\n  </channel>\n</rss>"

  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } })
}
