// 生成项目卡片右侧配图：终端风格 SVG -> PNG
// 用法: node scripts/generate-project-card-image.mjs
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { Resvg } from '@resvg/resvg-js'

const ROOT = process.cwd()
const FONT = join(ROOT, 'scripts/fonts/NotoSansSC-Regular.ttf')
const OUT = join(ROOT, 'src/assets/projects/bot-deploy.png')

const svg = `<svg width="800" height="500" viewBox="0 0 800 500" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#123b4b"/>
      <stop offset="0.62" stop-color="#1a5d70"/>
      <stop offset="1" stop-color="#2f7d8c"/>
    </linearGradient>
  </defs>
  <rect width="800" height="500" fill="url(#bg)"/>
  <rect x="70" y="64" width="660" height="380" rx="20" fill="#0c2833" stroke="#3e8fa0" stroke-width="2"/>
  <rect x="70" y="64" width="660" height="56" rx="20" fill="#123a47"/>
  <rect x="70" y="98" width="660" height="22" fill="#123a47"/>
  <circle cx="104" cy="92" r="9" fill="#ff6b6b"/>
  <circle cx="132" cy="92" r="9" fill="#ffd166"/>
  <circle cx="160" cy="92" r="9" fill="#6ee7a0"/>
  <text x="238" y="99" font-family="Noto Sans SC" font-size="22" fill="#bde7ef">bot_deploy · install.sh</text>
  <text x="104" y="168" font-family="Noto Sans SC" font-size="24" fill="#e8f4f6">bash install.sh --all</text>
  <text x="104" y="232" font-family="Noto Sans SC" font-size="24" fill="#7ee2a8">✔ Astrbot 部署完成</text>
  <text x="104" y="276" font-family="Noto Sans SC" font-size="24" fill="#7ee2a8">✔ Napcat 部署完成</text>
  <text x="104" y="330" font-family="Noto Sans SC" font-size="22" fill="#ffe0a3">国内服务器友好 · 按需单装或全量部署</text>
  <rect x="104" y="380" width="260" height="34" rx="8" fill="#2f7d8c"/>
  <text x="120" y="403" font-family="Noto Sans SC" font-size="18" fill="#ffffff">one-click deploy</text>
</svg>`

const resvg = new Resvg(svg, {
  font: {
    fontFiles: [FONT],
    loadSystemFonts: false,
    defaultFontFamily: 'Noto Sans SC'
  },
  fitTo: { mode: 'width', value: 800 }
})

await mkdir(dirname(OUT), { recursive: true })
await writeFile(OUT, resvg.render().asPng())
console.log('->', OUT)
