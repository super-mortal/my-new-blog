import type { APIRoute } from 'astro'

const robotsTxt = `
# AI 检索爬虫：显式放行，便于生成式搜索引擎读取站点内容
User-agent: GPTBot
User-agent: ClaudeBot
User-agent: Claude-Web
User-agent: Claude-Search
User-agent: PerplexityBot
User-agent: Google-Extended
User-agent: Bytespider
User-agent: CCBot
User-agent: Amazonbot
User-agent: Applebot-Extended
User-agent: Meta-ExternalAgent
User-agent: cohere-ai

User-agent: *
Allow: /

Sitemap: ${new URL('sitemap-index.xml', import.meta.env.SITE).href}
`.trim()

export const GET: APIRoute = () =>
  new Response(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8'
    }
  })
