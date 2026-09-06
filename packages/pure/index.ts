import {spawn} from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import {dirname, join, relative} from 'node:path'
import {fileURLToPath} from 'node:url'
// Astro
import type { AstroIntegration } from 'astro'
import type { RehypePlugins, RemarkPlugins } from '@astrojs/markdown-remark'
import {AstroError} from 'astro/errors'
// @astrojs/markdown-remark v7 unified() replaces the deprecated `markdown.remarkPlugins` config
import {unified} from '@astrojs/markdown-remark'
// Integrations
import mdx from '@astrojs/mdx'
import sitemap from '@astrojs/sitemap'
import UnoCSS from 'unocss/astro'

import rehypeExternalLinks from './plugins/rehype-external-links'
import remarkDirective from 'remark-directive'
import rehypeCallouts from 'rehype-callouts'
import rehypeTable from './plugins/rehype-table'
import {remarkAddZoomable, remarkReadingTime} from './plugins/remark-plugins'
import {vitePluginUserConfig} from './plugins/virtual-user-config'
import {UserConfigSchema, type UserInputConfig} from './types/user-config'
import {parseWithFriendlyErrors} from './utils/error-map'

export default function AstroPureIntegration(opts: UserInputConfig): AstroIntegration {
  if (typeof opts !== 'object' || opts === null || Array.isArray(opts))
    throw new AstroError(
      'Invalid config passed to astro-pure integration',
      'The astro-pure integration expects a right configuration object with at least a `title` property.\n\n'
    )
  const integrations: AstroIntegration[] = []
  const remarkPlugins: RemarkPlugins = []
  const rehypePlugins: RehypePlugins = []

  return {
    name: 'astro-pure',
    hooks: {
      'astro:config:setup': async ({ config, updateConfig }) => {
        const userConfig = parseWithFriendlyErrors(
          UserConfigSchema,
          opts,
          'Invalid config passed to astro-pure integration'
        )

        // Add built-in integrations only if they are not already added by the user through the
        // config or by a plugin.
        const allIntegrations = [...config.integrations, ...integrations]
        if (!allIntegrations.find(({ name }) => name === '@astrojs/sitemap')) {
          // lastmod: 从 frontmatter updatedDate (无则 publishDate) 读, 配合 lastmod: new Date() 占位
                    integrations.push(sitemap({
            changefreq: "weekly",
            priority: 0.7,
            // lastmod: sitemap serialize runs in astro:build:done where the Vite module
            // runner is already closed, so import("astro:content") fails ("Vite module
            // runner has been closed"). Read frontmatter (updatedDate ?? publishDate)
            // directly from disk instead.
            serialize: async (item) => {
              const m = item.url?.match(/\/blog\/([^/]+)\/?$/)
              if (m) {
                const slug = decodeURIComponent(m[1])
                const blogDir = join(process.cwd(), "src", "content", "blog")
                const candidates = [join(blogDir, slug + ".md"), join(blogDir, slug, "index.md")]
                for (const p of candidates) {
                  if (!existsSync(p)) continue
                  try {
                    const md = readFileSync(p, "utf8")
                    const fm = md.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? ""
                    const dateRaw =
                      fm.match(/^updatedDate:\s*(.+)$/m)?.[1] ??
                      fm.match(/^publishDate:\s*(.+)$/m)?.[1]
                    if (dateRaw) {
                      const d = new Date(dateRaw.trim())
                      if (!isNaN(d.getTime())) {
                        item.lastmod = d.toISOString().split("T")[0]
                        break
                      }
                    }
                  } catch {
                    /* ignore */
                  }
                }
              }
              return item
            }
          }))
        }
        if (!allIntegrations.find(({ name }) => name === '@astrojs/mdx')) {
          integrations.push(mdx())
        }
        if (!allIntegrations.find(({ name }) => name === 'unocss')) {
          integrations.push(UnoCSS({ injectReset: true }))
        }

        // Add supported remark plugins based on user config.


        // Admonitions (Obsidian-style callouts: note/tip/warning/caution/important/info)
        remarkPlugins.push(remarkDirective)
        rehypePlugins.push(rehypeCallouts)

        if (userConfig.integ.mediumZoom.enable)
          remarkPlugins.push([remarkAddZoomable, userConfig.integ.mediumZoom.options])
        remarkPlugins.push(remarkReadingTime)

        // Add supported rehype plugins based on user config.
        rehypePlugins.push([
          rehypeExternalLinks,
          {
            content: { type: 'text', value: userConfig.content.externalLinks.content },
            contentProperties: userConfig.content.externalLinks.properties
          }
        ])
        // Make table scrollable on overflow
        rehypePlugins.push(rehypeTable)

        // Add integrations immediately after Starlight in the config array.
        // This ensures users can add integrations before/after Starlight and we respect that order.
        const selfIndex = config.integrations.findIndex((i) => i.name === 'astro-pure')
        config.integrations.splice(selfIndex + 1, 0, ...integrations)

        updateConfig({
          vite: {
            plugins: [vitePluginUserConfig(userConfig, config)]
          },
          // Astro v7: markdown.remarkPlugins / markdown.rehypePlugins / markdown.remarkRehype
          // are deprecated. Use `processor: unified({ ... })` from @astrojs/markdown-remark instead.
          // We must MERGE with any plugins the user passed in their astro.config (since they may
          // have also set their own remarkPlugins / rehypePlugins which would otherwise be lost).
          markdown: {
            processor: unified({
              remarkPlugins: [
                ...(config.markdown.remarkPlugins ?? []),
                ...remarkPlugins
              ],
              rehypePlugins: [
                ...(config.markdown.rehypePlugins ?? []),
                ...rehypePlugins
              ]
            })
          },
          scopedStyleStrategy: 'where',
          // If not already configured, default to prefetching all links on hover.
          prefetch: config.prefetch ?? { prefetchAll: true }
        })
      },

      'astro:build:done': ({ dir }) => {
        if (!opts.integ.pagefind) return
        const targetDir = fileURLToPath(dir)
        const cwd = dirname(fileURLToPath(import.meta.url))
        const relativeDir = relative(cwd, targetDir)
        return new Promise<void>((resolve) => {
          // Use local pagefind from node_modules/.bin (no npx).
          // Pass args as a single command string with shell:true — avoids DEP0190
          // (which fires on Node 24 when spawn(cmd, [args], {shell:true}) concatenates args).
          const localBin =
            process.platform === 'win32'
              ? join(cwd, 'node_modules', '.bin', 'pagefind.cmd')
              : join(cwd, 'node_modules', '.bin', 'pagefind')
          spawn(`"${localBin}" --site "${relativeDir}"`, {
            stdio: 'inherit',
            cwd,
            shell: true,
            windowsHide: true
          }).on('close', () => resolve())
        })
      }
    }
  }
}


