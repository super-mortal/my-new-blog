import { rehypeHeadingIds, unified } from '@astrojs/markdown-remark'
import remarkDirective from 'remark-directive'
import rehypeCallouts from 'rehype-callouts'
import vercel from '@astrojs/vercel'
import AstroPureIntegration from 'astro-pure'
import { defineConfig, fontProviders } from 'astro/config'
import rehypeKatex from 'rehype-katex'
import remarkMath from 'remark-math'
import { transformSync } from 'esbuild'

// Local integrations
import rehypeAutolinkHeadings from './src/plugins/rehype-auto-link-headings.ts'
// Shiki
import {
  addCollapse,
  addCopyButton,
  addLanguage,
  addTitle,
  updateStyle
} from './src/plugins/shiki-custom-transformers.ts'
import {
  transformerNotationDiff,
  transformerNotationHighlight,
  transformerRemoveNotationEscape
} from './src/plugins/shiki-official/transformers.ts'
import config from './src/site.config.ts'

// Workaround for Astro 7's Rust compiler (compiler-rs) emitting TS syntax that Rolldown
// (Vite 8's bundler) cannot parse, plus a couple of compiler-rs bugs producing invalid JS:
//   - `A && B ?? C` (missing parens)
//   - extra `(` in `&& (isRemoteImage(...)) {`
// We run esbuild (loader: tsx) on the compiled .astro output so it can:
//   1. Strip `type` / `interface` / `import type` (zod-v4-style & TS-only syntax)
//   2. Strip TS-only type annotations and inline `type` modifiers in imports
//   3. Fix parens around `&&` / `??` (already fixed by esbuild's strict mode being
//      satisfied because we patched the source BEFORE esbuild parses it)
const fixCompilerBugs = {
  name: 'astro-v7-fix',
  enforce: 'post' as const,
  transform(code: string, id: string) {
    if (!/\.(astro|ts|tsx|mts|cts)(\?.*)?$/.test(id)) return
    let out = code

    // Fix #1: A && B ?? C  ->  A && (B ?? C)
    out = out.replace(
      /&&[ \t]+([^?:,(){}]+?)[ \t]*\?\?[ \t]*([^?:,(){}]+)/g,
      (_m, x, y) => `&& (${x.trim()} ?? ${y.trim()})`
    )

    // Fix #2: `&& (cond) {` -> `&& cond {` (extra left paren before function-call subject)
    out = out.replace(/&&[ \t]+\(([^()]+)\)\s*\{/g, '&& $1 {')

    try {
      const result = transformSync(out, {
        // .astro compiled output is JS with possible TS remnants; tsx handles JSX + TS
        loader: 'tsx',
        format: 'esm',
        target: 'es2022',
        sourcefile: id
      })
      return { code: result.code, map: null }
    } catch (e) {
      console.warn(`[astro-v7-fix] esbuild failed for ${id}: ${(e as Error).message}`)
      return null
    }
  }
}

// https://astro.build/config
export default defineConfig({
  site: 'https://supermortal.cn',
  trailingSlash: 'never',
  server: { host: true },
  compressHTML: false,

  adapter: vercel({ imageService: true }),
  output: 'server',

  image: {
    responsiveStyles: true,
    service: { entrypoint: 'astro/assets/services/sharp' },
    remotePatterns: [
      { protocol: 'https', hostname: '**.rshah.org' },
      { protocol: 'https', hostname: 'q1.qlogo.cn' },
      { protocol: 'https', hostname: 'cravatar.cn' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' }
    ]
  },

  markdown: {
    processor: unified({
      remarkPlugins: [remarkDirective, remarkMath],
      rehypePlugins: [
        [rehypeKatex, {}],
        rehypeCallouts,
        rehypeHeadingIds,
        [
          rehypeAutolinkHeadings,
          {
            behavior: 'append',
            properties: { className: ['anchor'] },
            content: { type: 'text', value: '#' }
          }
        ]
      ]
    }),
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
      transformers: [
        // @ts-ignore
        transformerNotationDiff(),
        // @ts-ignore
        transformerNotationHighlight(),
        // @ts-ignore
        transformerRemoveNotationEscape(),
        // @ts-ignore
        updateStyle(),
        // @ts-ignore
        addTitle(),
        // @ts-ignore
        addLanguage(),
        // @ts-ignore
        addCopyButton(2000),
        // @ts-ignore
        addCollapse(15)
      ]
    }
  },

  integrations: [AstroPureIntegration(config)],

  fonts: [
    {
      provider: fontProviders.fontshare(),
      name: 'Satoshi',
      cssVariable: '--font-satoshi',
      styles: ['normal', 'italic'],
      weights: [400, 500],
      subsets: ['latin']
    }
  ],

  vite: { plugins: [fixCompilerBugs] },

  experimental: {
    contentIntellisense: true
  }
})