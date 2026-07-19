import { site } from '@/lib/site'
import type { PostFrontmatter } from '@/lib/content'

/**
 * Serializa o schema para dentro de <script type="application/ld+json">.
 *
 * `JSON.stringify` não escapa `<`, então uma string de schema com `</script>`
 * fecharia a tag no HTML. Escapar `<` como `<` (recomendado pelo guia de
 * JSON-LD do Next.js) é transparente para o parser JSON e neutraliza isso.
 */
function JsonLdScript({ schema }: { schema: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }}
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

/** Schema das páginas de ferramenta (CLAUDE.md §6): app web gratuito. */
export function SoftwareApplicationJsonLd({
  name,
  description,
  path,
}: {
  name: string
  description: string
  path: string
}) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name,
    description,
    url: `${site.url}${path}`,
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Web',
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'BRL' },
    author: personSchema(),
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
