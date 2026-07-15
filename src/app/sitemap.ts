import type { MetadataRoute } from 'next'
import { site } from '@/lib/site'
import { getAllPosts, getGuide } from '@/lib/content'

// ─────────────────────────────────────────────────────────────────────────────
// Sitemap: páginas estáticas (home, guia, blog, ferramentas, sobre) + artigos
// do blog lidos de /content (entram automaticamente ao serem publicados).
//
// lastmod só é emitido quando derivável do frontmatter: um lastmod que muda a
// cada build sem mudança real de conteúdo ensina o Google a ignorá-lo.
// ─────────────────────────────────────────────────────────────────────────────

const toDate = (d: string) => new Date(`${d}T00:00:00`)

export default function sitemap(): MetadataRoute.Sitemap {
  const base = site.url.replace(/\/$/, '')
  const guide = getGuide()
  const posts = getAllPosts()

  // Conteúdo mais recente do site (guia + posts): a home e o índice do blog
  // mudam quando qualquer conteúdo listado neles muda.
  const newestContent = [guide.frontmatter.dateModified]
    .concat(posts.map((p) => p.frontmatter.dateModified))
    .sort()
    .at(-1) as string
  const newestPost = posts
    .map((p) => p.frontmatter.dateModified)
    .sort()
    .at(-1)

  const staticPages: MetadataRoute.Sitemap = [
    { url: base, lastModified: toDate(newestContent), changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/guia/seo-tecnico-nextjs`, lastModified: toDate(guide.frontmatter.dateModified), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/blog`, lastModified: newestPost ? toDate(newestPost) : undefined, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/ferramentas`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/sobre`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/politica-de-privacidade`, changeFrequency: 'yearly', priority: 0.3 },
  ]

  const postPages: MetadataRoute.Sitemap = posts.map(({ frontmatter }) => ({
    url: `${base}/blog/${frontmatter.slug}`,
    lastModified: toDate(frontmatter.dateModified),
    changeFrequency: 'monthly',
    priority: 0.7,
  }))

  return [...staticPages, ...postPages]
}
