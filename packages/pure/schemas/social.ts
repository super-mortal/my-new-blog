import {z} from 'astro/zod'

import { socialLinks } from '../types/constants'

// v4 fix: z.record(K, V) in v4 requires all K keys to be present (was any-of in v3).
// We accept any string keys, then filter/label only known social platforms in the transform.
const socialLabels: Record<string, string> = {
  github: 'GitHub',
  gitlab: 'GitLab',
  discord: 'Discord',
  youtube: 'YouTube',
  instagram: 'Instagram',
  x: 'X',
  telegram: 'Telegram',
  rss: 'RSS',
  email: 'Email',
  reddit: 'Reddit',
  bluesky: 'BlueSky',
  tiktok: 'TikTok',
  weibo: 'Weibo',
  steam: 'Steam',
  bilibili: 'Bilibili',
  zhihu: 'Zhihu',
  coolapk: 'Coolapk',
  netease: 'NetEase'
}

export const SocialLinksSchema = () =>
  z
    .record(z.string(), z.unknown())
    .transform((links) => {
      const labelledLinks: Partial<Record<string, { label: string; url: string }>> = {}
      for (const k of Object.keys(links)) {
        const url = links[k]
        if (!socialLinks.includes(k as (typeof socialLinks)[number])) continue
        if (typeof url !== 'string') continue
        labelledLinks[k] = { label: socialLabels[k] ?? k, url }
      }
      return labelledLinks
    })
    .optional()

export type SocialLinksConfig = Partial<Record<string, { label: string; url: string }>>