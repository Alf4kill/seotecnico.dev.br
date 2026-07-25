import type { Post } from '@/lib/content'
import { absoluteUrl } from '@/lib/metadata'
import { site } from '@/lib/site'

// ─────────────────────────────────────────────────────────────────────────────
// Feed RSS 2.0 gerado do frontmatter dos posts em /content/blog.
// Servido por app/feed.xml/route.ts (estático — regenera a cada build/publish).
// Autodiscovery: buildMetadata() emite <link rel="alternate"> em toda página.
// ─────────────────────────────────────────────────────────────────────────────

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/** Data do frontmatter (YYYY-MM-DD) → RFC 822, exigido por <pubDate>. */
function toRfc822(date: string): string {
  return new Date(`${date}T00:00:00Z`).toUTCString()
}

export function buildFeedXml(posts: Post[]): string {
  const feedUrl = absoluteUrl('/feed.xml')

  const items = posts
    .map(({ frontmatter }) => {
      const url = absoluteUrl(`/blog/${frontmatter.slug}`)
      // dc:creator e category viajam com o item: quem consome o feed (leitor,
      // agregador ou agente) leva a autoria e o assunto junto, sem precisar
      // buscar a página. `description` usa o tldr quando existe — é a resposta
      // direta, não a chamada de SERP.
      return `    <item>
      <title>${escapeXml(frontmatter.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${toRfc822(frontmatter.datePublished)}</pubDate>
      <dc:creator>${escapeXml(site.author.name)}</dc:creator>
      <category>${escapeXml(frontmatter.primaryQuery)}</category>
      <description>${escapeXml(frontmatter.tldr ?? frontmatter.description)}</description>
    </item>`
    })
    .join('\n')

  // posts já vêm ordenados do mais novo para o mais antigo (getAllPosts)
  const lastBuildDate = posts.length > 0 ? `\n    <lastBuildDate>${toRfc822(posts[0].frontmatter.datePublished)}</lastBuildDate>` : ''

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${escapeXml(site.name)}</title>
    <link>${absoluteUrl('/')}</link>
    <description>${escapeXml(site.description)}</description>
    <language>pt-BR</language>
    <atom:link href="${feedUrl}" rel="self" type="application/rss+xml"/>${lastBuildDate}
${items}
  </channel>
</rss>
`
}
