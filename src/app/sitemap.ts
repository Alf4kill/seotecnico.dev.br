import type { MetadataRoute } from 'next'
import { site } from '@/lib/site'
import { getAllPosts } from '@/lib/content'

// ─────────────────────────────────────────────────────────────────────────────
// Sitemap: páginas estáticas (home, guia, blog, ferramentas, sobre) + artigos
// do blog lidos de /content (entram automaticamente ao serem publicados).
// ─────────────────────────────────────────────────────────────────────────────

export default function sitemap(): MetadataRoute.Sitemap {
  const base = site.url.replace(/\/$/, '')
  const now = new Date()

  const staticPages: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/guia/seo-tecnico-nextjs`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/blog`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/ferramentas`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/sobre`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/politica-de-privacidade`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ]

  const posts: MetadataRoute.Sitemap = getAllPosts().map(({ frontmatter }) => ({
    url: `${base}/blog/${frontmatter.slug}`,
    lastModified: new Date(`${frontmatter.dateModified}T00:00:00`),
    changeFrequency: 'monthly',
    priority: 0.7,
  }))

  return [...staticPages, ...posts]
}
