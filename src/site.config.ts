import type { CardListData, Config, IntegrationUserConfig, ThemeUserConfig } from 'astro-pure/types'

export const theme: ThemeUserConfig = {
  // [Basic]
  /** Title for your website. Will be used in metadata and as browser tab title. */
  title: 'super-mortal',
  /** Will be used in index page & copyright declaration */
  author: 'Mortal',
  /** Description metadata for your website. Can be used in page metadata. */
  description: 'super-mortal , 一个在数字世界中默默无闻的凡人',
  /** The default favicon for your site which should be a path to an image in the `public/` directory. */
  favicon: '/favicon/favicon.ico',
  /** The default social card image for your site which should be a path to an image in the `public/` directory. */
  socialCard: 'https://supermortal.cn/images/social-card.png',
  /** RSS feed: true = full text, false (default) = description only */
  rssFullText: false,
  /** 首页板块开关: 设为 false 整块隐藏（含导航入口逻辑由菜单自行控制） */
  sections: {
    about: true,
    projects: true,
    skills: true,
    categories: true,
    posts: true,
    education: true,
    techStack: true
  },
  /** 主题色 (hex 6 位). 不设则从 src/assets/styles/app.css 的 --primary 读. OG 图片背景用这个色. */
  // themeColor: '#5fa8d3',
  /** Specify the default language for this site. */
  locale: {
    lang: 'zh-CN',
    attrs: 'zh-CN',
    // Date locale
    dateLocale: 'zh-CN',
    dateOptions: {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }
  },
  /** Set a logo image to show in the homepage. */
  logo: {
    src: '/src/assets/touxiang.png',
    alt: '头像'
  },

  titleDelimiter: '•',
  prerender: true, // pagefind search is not supported with prerendering disabled
  npmCDN: 'https://cdn.jsdelivr.net/npm',

  // Still in test
  head: [
    {
      tag: 'meta',
      attrs: { name: 'keywords', content: '博客,技术,编程,前端,后端,开发,超级凡人,supermortal' },
      content: ''
    }
  ],
  customCss: ['/src/assets/styles/toc.css'],

  /** Configure the header of your site. */
  header: {
    menu: [
      { title: '博客', link: '/blog' },
      { title: '归档', link: '/archives' },
      { title: '分类', link: '/categories' },
      { title: '标签', link: '/tags' },
      { title: '友链', link: '/links' },
      { title: '项目', link: '/projects' },
      { title: '关于', link: '/about' }
    ]
  },

  /** Configure the footer of your site. */
  footer: {
    // Year format
    year: `© 2026`,
    links: [
      // Registration link
      {
        title: '邮箱:2169702639@qq.com',
        link: 'https://qm.qq.com/q/hWc7HZtKZW',
        style: 'text-sm' // Uno/TW CSS class
      },
      // Privacy Policy link
      {
        title: 'Site Policy',
        link: '/terms',
        pos: 2 // position set to 2 will be appended to copyright line
      }
    ],
    /** Enable displaying a "Astro & Pure theme powered" link in your site's footer. */
    credits: true,
    /** Optional details about the social media accounts for this site. */
    social: {} // 移除所有social图标，RSS已移到首页
  },

  // [Content]
  content: {
    /** External links configuration */
    externalLinks: {
      content: ' ↗',
      /** Properties for the external links element */
      properties: {
        style: 'user-select:none'
      }
    },
    /** Blog page size for pagination (optional) */
    blogPageSize: 8,
    // Currently support weibo, x, bluesky
    share: []
  }
}

export const integ: IntegrationUserConfig = {
  // [Links]
  // https://astro-pure.js.org/docs/integrations/links
  links: {
    // Yourself link info
    applyTip: [
      // 我的站点信息
      { name: '站点名称', val: theme.title },
      { name: '站点描述', val: theme.description || 'Null' },
      { name: '站点链接', val: 'https://supermortal.cn' },
      { name: '站点头像', val: 'https://q1.qlogo.cn/g?b=qq&nk=2169702639&s=640' }
    ],
    // Cache avatars in `public/avatars/` to improve user experience.
    cacheAvatar: false
  },
  // [Search]
  pagefind: true,
  // Add a random quote to the footer (default on homepage footer)
  // See: https://astro-pure.js.org/docs/integrations/advanced#web-content-render
  // [Quote]
  quote: {
    // - Hitokoto
    // https://developer.hitokoto.cn/sentence/#%E8%AF%B7%E6%B1%82%E5%9C%B0%E5%9D%80
    // server: 'https://v1.hitokoto.cn/?c=i',
    // target: `(data) => (data.hitokoto || 'Error')`
    // - Quotable
    // https://github.com/lukePeavey/quotable
    // server: 'http://api.quotable.io/quotes/random?maxLength=60',
    // target: `(data) => data[0].content || 'Error'`
    // - DummyJSON
    server: 'https://v1.hitokoto.cn/?c=i',
    target: `(data) => (data.hitokoto || 'Error')`
  },
  // [Typography]
  // https://unocss.dev/presets/typography
  typography: {
    class: 'prose text-base',
    // The style of blockquote font `normal` / `italic` (default to italic in typography)
    blockquoteStyle: 'italic',
    // The style of inline code block `code` / `modern` (default to code in typography)
    inlineCodeBlockStyle: 'modern'
  },
  // [Lightbox]
  // A lightbox library that can add zoom effect
  // https://astro-pure.js.org/docs/integrations/others#medium-zoom
  mediumZoom: {
    enable: true, // disable it will not load the whole library
    selector: '.prose .zoomable',
    options: {
      className: 'zoomable'
    }
  }
}

export const terms: CardListData = {
  title: 'Terms content',
  list: [
    {
      title: 'Privacy Policy',
      link: '/terms/privacy-policy'
    },
    {
      title: 'Terms and Conditions',
      link: '/terms/terms-and-conditions'
    },
    {
      title: 'Copyright',
      link: '/terms/copyright'
    },
    {
      title: 'Disclaimer',
      link: '/terms/disclaimer'
    }
  ]
}

const config = { ...theme, integ } as Config
export default config


