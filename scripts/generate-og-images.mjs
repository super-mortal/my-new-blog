// scripts/generate-og-images.mjs
// Build-time script: 为每篇博客文章生成 1200x630 Open Graph 分享卡
// 颜色优先级: fm.heroImage.color > site.config.ts themeColor > app.css --primary
// 入参: prebuild 钩子 (Vercel build 时自动跑)

import { readFile, readdir, writeFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import satori from 'satori'
import { Resvg } from '@resvg/resvg-js'

const ROOT = process.cwd()
const BLOG_DIR = join(ROOT, 'src/content/blog')
const OG_DIR = join(ROOT, 'public/og')

// HSL -> hex
function hslToHex(h, s, l) {
  s /= 100
  l /= 100
  const k = (n) => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  const toHex = (x) => Math.round(x * 255).toString(16).padStart(2, '0')
  return '#' + toHex(f(0)) + toHex(f(8)) + toHex(f(4))
}

function shadeHex(hex, factor) {
  const m = hex.replace('#', '').match(/.{2}/g)
  if (!m) return hex
  const [r, g, b] = m.map((h) => parseInt(h, 16))
  const adjust = (c) => {
    const v = factor < 1 ? Math.round(c * factor) : Math.round(c + (255 - c) * (factor - 1))
    return Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')
  }
  return '#' + adjust(r) + adjust(g) + adjust(b)
}

function hexToRgb(hex) {
  const m = hex.replace('#', '').match(/.{2}/g)
  if (!m) return '255, 255, 255'
  return m.map((h) => parseInt(h, 16)).join(', ')
}

async function loadSiteConfig() {
  const src = await readFile(join(ROOT, 'src/site.config.ts'), 'utf8')
  const t = src.match(/title:\s*['"](.+?)['"]/)
  const a = src.match(/author:\s*['"](.+?)['"]/)
  // 用户在 site.config.ts 里显式覆盖的 hex 颜色 (例: themeColor: '#5fa8d3')
  const tcMatch = src.match(/^\s*themeColor:\s*['"](#[0-9a-fA-F]{3,8})['"]/m)
  return {
    title: t?.[1] ?? 'Blog',
    author: a?.[1] ?? 'Author',
    themeColor: tcMatch?.[1] || null
  }
}

async function loadThemeColors(siteThemeColor) {
  let primary
  if (siteThemeColor && /^#[0-9a-fA-F]{6}$/.test(siteThemeColor)) {
    primary = siteThemeColor
  } else {
    const css = await readFile(join(ROOT, 'src/assets/styles/app.css'), 'utf8')
    const primaryMatch = css.match(/--primary:\s*(\d+)\s+(\d+)%\s+(\d+)%/)
    if (!primaryMatch) throw new Error('--primary not found in app.css')
    primary = hslToHex(+primaryMatch[1], +primaryMatch[2], +primaryMatch[3])
  }
  return {
    primary,
    primaryDark: shadeHex(primary, 0.6),
    primaryLight: shadeHex(primary, 1.4),
    text: '#ffffff',
    textMuted: 'rgba(255, 255, 255, 0.7)',
    textDim: 'rgba(255, 255, 255, 0.45)'
  }
}

let regularFont
async function loadFont() {
  if (!regularFont) regularFont = await readFile(join(ROOT, 'scripts/fonts/NotoSansSC-Regular.ttf'))
  return [{ name: 'Noto Sans SC', data: regularFont, weight: 400, style: 'normal' }]
}

// 简单 YAML 解析 (支持嵌套, 覆盖我们用到的字段)
function parseFrontmatter(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!m) return {}
  const fm = {}
  const lines = m[1].split(/\r?\n/)
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    const top = line.match(/^([A-Za-z]\w*):\s*(.*)$/)
    if (!top) { i++; continue }
    const key = top[1]
    const val = top[2].trim()
    if (val === '') {
      // 嵌套对象 (例: heroImage: \n  color: 'hsl(...)')
      const nested = {}
      i++
      while (i < lines.length && /^\s+/.test(lines[i])) {
        const nm = lines[i].match(/^\s+(\w+):\s*(.*)$/)
        if (nm) {
          let nv = nm[2].trim()
          if ((nv.startsWith("'") && nv.endsWith("'")) || (nv.startsWith('"') && nv.endsWith('"'))) nv = nv.slice(1, -1)
          nested[nm[1]] = nv
        }
        i++
      }
      fm[key] = nested
    } else {
      if ((val.startsWith("'") && val.endsWith("'")) || (val.startsWith('"') && val.endsWith('"'))) fm[key] = val.slice(1, -1)
      else if (val === 'true') fm[key] = true
      else if (val === 'false') fm[key] = false
      else if (/^\d+$/.test(val)) fm[key] = +val
      else fm[key] = val
      i++
    }
  }
  return fm
}

async function generateOne(slug, fm, site, colors) {
  const title = String(fm.title || slug)
  const description = String(fm.description || '')
  const tags = Array.isArray(fm.tags) ? fm.tags : []
  const published = String(fm.publishDate || '').slice(0, 10)

  const titleDisplay = title.length > 22 ? title.slice(0, 21) + '...' : title
  const descDisplay = description.length > 60 ? description.slice(0, 59) + '...' : description

  // 颜色: 文章 heroImage.color > 站点主色
  const articleColor =
    fm.heroImage && typeof fm.heroImage.color === 'string' && /^#?[0-9a-fA-F]{3,8}$/.test(fm.heroImage.color)
      ? (fm.heroImage.color.startsWith('#') ? fm.heroImage.color : '#' + fm.heroImage.color)
      : null
  const baseColor = articleColor || colors.primary
  const articleRgb = hexToRgb(baseColor)
  const lightRgb = hexToRgb(colors.primaryLight)

  const svg = await satori(
    {
      type: 'div',
      props: {
        style: {
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          background: `linear-gradient(135deg, ${baseColor} 0%, ${shadeHex(baseColor, 0.6)} 100%)`,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          position: 'relative',
          overflow: 'hidden'
        },
        children: [
          // 右上大圆
          {
            type: 'div',
            props: {
              style: {
                position: 'absolute',
                top: '-180px',
                right: '-180px',
                width: '500px',
                height: '500px',
                borderRadius: '250px',
                background: `rgba(${lightRgb}, 0.35)`,
                filter: 'blur(40px)'
              }
            }
          },
          // 左下圆
          {
            type: 'div',
            props: {
              style: {
                position: 'absolute',
                bottom: '-150px',
                left: '-100px',
                width: '380px',
                height: '380px',
                borderRadius: '190px',
                background: `rgba(${articleRgb}, 0.25)`,
                filter: 'blur(30px)'
              }
            }
          },
          // 散点装饰
          ...Array.from({ length: 6 }, (_, i) => ({
            type: 'div',
            props: {
              style: {
                position: 'absolute',
                top: `${80 + i * 95}px`,
                right: `${60 + (i % 2) * 30}px`,
                width: `${6 + (i % 3) * 4}px`,
                height: `${6 + (i % 3) * 4}px`,
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.3)'
              }
            }
          })),
          // Top: 品牌行
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '50px 70px 0',
                color: '#ffffff',
                position: 'relative'
              },
              children: [
                {
                  type: 'div',
                  props: {
                    style: { display: 'flex', alignItems: 'center', gap: '14px' },
                    children: [
                      {
                        type: 'div',
                        props: {
                          style: {
                            width: '36px',
                            height: '36px',
                            borderRadius: '8px',
                            background: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: baseColor,
                            fontSize: '20px',
                            fontWeight: 800
                          },
                          children: 'M'
                        }
                      },
                      {
                        type: 'div',
                        props: {
                          style: { display: 'flex', flexDirection: 'column' },
                          children: [
                            { type: 'div', props: { style: { fontSize: '22px', fontWeight: 700, color: '#ffffff' }, children: site.title } },
                            { type: 'div', props: { style: { fontSize: '13px', color: colors.textDim, marginTop: '2px' }, children: 'tech blog' } }
                          ]
                        }
                      }
                    ]
                  }
                },
                {
                  type: 'div',
                  props: {
                    style: {
                      padding: '8px 18px',
                      borderRadius: '20px',
                      background: 'rgba(255, 255, 255, 0.15)',
                      border: '1.5px solid rgba(255, 255, 255, 0.35)',
                      color: '#ffffff',
                      fontSize: '14px',
                      fontWeight: 600
                    },
                    children: 'BLOG POST'
                  }
                }
              ]
            }
          },
          // 中部: 标题
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                flex: 1,
                alignItems: 'center',
                padding: '40px 70px 20px',
                position: 'relative'
              },
              children: {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    fontSize: title.length > 18 ? '62px' : '78px',
                    fontWeight: 700,
                    lineHeight: 1.1,
                    color: '#ffffff',
                    letterSpacing: '-1px',
                    textShadow: '0 4px 20px rgba(0, 0, 0, 0.25)'
                  },
                  children: titleDisplay
                }
              }
            }
          },
          // 描述
          descDisplay
            ? {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    padding: '0 70px',
                    color: colors.textMuted,
                    fontSize: '22px',
                    lineHeight: 1.5,
                    position: 'relative'
                  },
                  children: descDisplay
                }
              }
            : null,
          // 标签
          tags.length > 0
            ? {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    gap: '12px',
                    flexWrap: 'wrap',
                    padding: '24px 70px 0',
                    position: 'relative'
                  },
                  children: tags.slice(0, 4).map((tag) => ({
                    type: 'div',
                    props: {
                      style: {
                        display: 'flex',
                        padding: '8px 18px',
                        borderRadius: '999px',
                        background: 'rgba(255, 255, 255, 0.2)',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        color: '#ffffff',
                        fontSize: '17px',
                        fontWeight: 500
                      },
                      children: '# ' + tag
                    }
                  }))
                }
              }
            : null,
          // 底部: 作者 + 日期
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '32px 70px 50px',
                marginTop: 'auto',
                position: 'relative'
              },
              children: [
                {
                  type: 'div',
                  props: {
                    style: { display: 'flex', alignItems: 'center', gap: '14px', color: '#ffffff' },
                    children: [
                      {
                        type: 'div',
                        props: {
                          style: {
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            background: 'rgba(255, 255, 255, 0.2)',
                            border: '2px solid rgba(255, 255, 255, 0.5)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '20px',
                            fontWeight: 700
                          },
                          children: site.author.slice(0, 1).toUpperCase()
                        }
                      },
                      {
                        type: 'div',
                        props: {
                          style: { display: 'flex', flexDirection: 'column' },
                          children: [
                            { type: 'div', props: { style: { fontSize: '19px', fontWeight: 600 }, children: site.author } },
                            { type: 'div', props: { style: { fontSize: '14px', color: colors.textDim }, children: 'Author' } }
                          ]
                        }
                      }
                    ]
                  }
                },
                {
                  type: 'div',
                  props: {
                    style: {
                      padding: '8px 16px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.15)',
                      color: '#ffffff',
                      fontSize: '15px',
                      fontWeight: 600
                    },
                    children: '\ud83d\udcc5 ' + published
                  }
                }
              ]
            }
          }
        ]
      }
    },
    { width: 1200, height: 630, fonts: await loadFont() }
  )

  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } })
  const png = resvg.render().asPng()
  await writeFile(join(OG_DIR, slug + '.png'), png)
  console.log('  + ' + slug + '.png (' + (png.length / 1024).toFixed(1) + ' KB)' + (articleColor ? ' [article-color]' : ''))
}

async function main() {
  console.log('-> Generating OG images...')
  if (!existsSync(OG_DIR)) await mkdir(OG_DIR, { recursive: true })
  const site = await loadSiteConfig()
  const colors = await loadThemeColors(site.themeColor)
  console.log('   site: ' + site.title + ' | primary: ' + colors.primary + (site.themeColor ? ' (overridden)' : ' (from app.css)'))

  const dirs = (await readdir(BLOG_DIR, { withFileTypes: true })).filter((d) => d.isDirectory())
  let count = 0
  for (const d of dirs) {
    const file = join(BLOG_DIR, d.name, 'index.md')
    if (!existsSync(file)) continue
    const raw = await readFile(file, 'utf8')
    const fm = parseFrontmatter(raw)
    if (fm.draft) { console.log('   skip ' + d.name + ' (draft)'); continue }
    await generateOne(d.name, fm, site, colors)
    count++
  }
  console.log('Done. ' + count + ' images in public/og/')
}

main().catch((e) => { console.error(e); process.exit(1) })
