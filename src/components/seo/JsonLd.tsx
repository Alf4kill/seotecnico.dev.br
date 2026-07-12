import { site } from '@/lib/site'
import type { PostFrontmatter } from '@/lib/content'

function JsonLdScript({ schema }: { schema: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

function personSchema() {
  const sameAs = [site.author.github, site.author.linkedin].filter(Boolean)
  return {
    '@type': 'Person',
    name: site.author.name,
    jobTitle: site.author.jobTitle,
    url: site.url,
    ...(sameAs.length > 0 ? { sameAs } : {}),
  }
}

export function WebSiteJsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: site.name,
    url: site.url,
    inLanguage: 'pt-BR',
  }
  return <JsonLdScript schema={schema} />
}

export function PersonJsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    ...personSchema(),
  }
  return <JsonLdScript schema={schema} />
}

export function ArticleJsonLd({
  frontmatter,
  path,
}: {
  frontmatter: PostFrontmatter
  /** Path da página. Default: /blog/{slug}. */
  path?: string
}) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: frontmatter.title,
    description: frontmatter.description,
    datePublished: frontmatter.datePublished,
    dateModified: frontmatter.dateModified,
    inLanguage: frontmatter.lang,
    mainEntityOfPage: `${site.url}${path ?? `/blog/${frontmatter.slug}`}`,
    author: personSchema(),
    publisher: {
      '@type': 'Organization',
      name: site.name,
      url: site.url,
    },
  }
  return <JsonLdScript schema={schema} />
}

export interface BreadcrumbItem {
  name: string
  /** Path relative to the site root, e.g. "/blog" */
  path: string
}

export function BreadcrumbJsonLd({ items }: { items: BreadcrumbItem[] }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: `${site.url}${item.path}`,
    })),
  }
  return <JsonLdScript schema={schema} />
}
