import {glob} from 'astro/loaders'
import {defineCollection} from 'astro:content'
import {z} from 'astro/zod'

function removeDupsAndLowerCase(array: string[]) {
  if (!array.length) return array
  const lowercaseItems = array.map((str) => str.toLowerCase())
  const distinctItems = new Set(lowercaseItems)
  return Array.from(distinctItems)
}

// Define blog collection
const blog = defineCollection({
  // Load Markdown and MDX files in the `src/content/blog/` directory.
  loader: glob({
    base: './src/content/blog',
    pattern: '**/*.{md,mdx}',
    // 始终用真实文件路径作为内容 ID（不采用 frontmatter.slug），
    // 否则相对图片导入会按 slug 路径找，文件夹改名后就加载失败。
    generateId: ({ entry }) => entry.replace(/\.(md|mdx)$/, '').replace(/\/index$/, '')
  }),
  // Required
  schema: ({ image }) =>
    z.object({
      // Required
      title: z.string().max(60),
      description: z.string().max(160),
      // 文章 URL slug；缺省时回退到内容 ID（通常是所在文件夹名）
      slug: z.string().optional(),
      publishDate: z.coerce.date(),
      // Optional
      updatedDate: z.coerce.date().optional(),
      heroImage: z
        .object({
          src: image(),
          alt: z.string().optional(),
          inferSize: z.boolean().optional(),
          width: z.number().optional(),
          height: z.number().optional(),
          color: z.string().optional()
        })
        .optional(),
      tags: z.array(z.string()).default([]).transform(removeDupsAndLowerCase),
      // Single category per post (replaces the old multi-categories system removed earlier)
      category: z.string().default('未分类'),
      language: z.string().optional(),
      draft: z.boolean().default(false)
    })
})

export const collections = { blog }
