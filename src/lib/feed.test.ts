import { describe, expect, it } from 'vitest'
import type { Post } from './content'
import { buildFeedXml, escapeXml } from './feed'
import { site } from './site'

const BASE = site.url.replace(/\/$/, '')

function makePost(overrides: Partial<Post['frontmatter']> = {}): Post {
  return {
    frontmatter: {
      title: 'Como implementar JSON-LD no Next.js',
      description: 'Guia prático de dados estruturados.',
      slug: 'json-ld-nextjs',
      datePublished: '2026-07-14',
      dateModified: '2026-07-14',
      primaryQuery: 'json-ld next.js',
      lang: 'pt-BR',
      ...overrides,
    },
    content: '',
  }
}

describe('escapeXml', () => {
  it('escapes the five XML special characters', () => {
    expect(escapeXml(`<a href="x">SEO & 'metadados'</a>`)).toBe(
      '&lt;a href=&quot;x&quot;&gt;SEO &amp; &apos;metadados&apos;&lt;/a&gt;'
    )
  })
})

describe('buildFeedXml', () => {
  it('produces a valid empty channel while there are no posts', () => {
    const xml = buildFeedXml([])
    expect(xml).toContain('<rss version="2.0"')
    expect(xml).toContain(`<title>${site.name}</title>`)
    expect(xml).toContain(`<link>${BASE}</link>`)
    expect(xml).toContain(`href="${BASE}/feed.xml" rel="self"`)
    expect(xml).not.toContain('<item>')
    expect(xml).not.toContain('<lastBuildDate>')
  })

  it('renders one item per post with permalink guid and RFC 822 pubDate', () => {
    const xml = buildFeedXml([makePost()])
    expect(xml).toContain(`<link>${BASE}/blog/json-ld-nextjs</link>`)
    expect(xml).toContain(`<guid isPermaLink="true">${BASE}/blog/json-ld-nextjs</guid>`)
    expect(xml).toContain('<pubDate>Tue, 14 Jul 2026 00:00:00 GMT</pubDate>')
    expect(xml).toContain('<lastBuildDate>Tue, 14 Jul 2026 00:00:00 GMT</lastBuildDate>')
  })

  it('escapes markup in titles and descriptions', () => {
    const xml = buildFeedXml([
      makePost({ title: 'SSR & SSG: <script> no Googlebot', description: 'A "dupla" do Next.' }),
    ])
    expect(xml).toContain('SSR &amp; SSG: &lt;script&gt; no Googlebot')
    expect(xml).toContain('A &quot;dupla&quot; do Next.')
    expect(xml).not.toContain('<script>')
  })
})
