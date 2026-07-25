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

// ─────────────────────────────────────────────────────────────────────────────
// Grafo de entidades: `@id` estável por entidade, repetido em toda página.
//
// Sem `@id`, cada bloco é um nó anônimo — o autor do artigo A e o autor do
// artigo B são, para quem lê o schema, duas pessoas diferentes que por acaso
// têm o mesmo nome. Com `@id` idêntico entre as páginas, são a mesma entidade,
// e /sobre é onde ela tem corpo.
//
// O nó completo é emitido em cada página (não só a referência `{'@id': …}`):
// a página precisa se sustentar sozinha para quem a lê isolada — que é
// exatamente o caso de um crawler de IA buscando uma URL citada.
// ─────────────────────────────────────────────────────────────────────────────

const PERSON_ID = `${site.url}/sobre#person`
const WEBSITE_ID = `${site.url}#website`
const ORGANIZATION_ID = `${site.url}#organization`

function personSchema() {
  const sameAs = [site.author.github, site.author.linkedin].filter(Boolean)
  return {
    '@type': 'Person',
    '@id': PERSON_ID,
    name: site.author.name,
    jobTitle: site.author.jobTitle,
    url: `${site.url}/sobre`,
    ...(sameAs.length > 0 ? { sameAs } : {}),
  }
}

function organizationSchema() {
  return {
    '@type': 'Organization',
    '@id': ORGANIZATION_ID,
    name: site.name,
    url: site.url,
    description: site.description,
    founder: { '@id': PERSON_ID },
  }
}

export function WebSiteJsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    name: site.name,
    url: site.url,
    description: site.description,
    inLanguage: 'pt-BR',
    publisher: { '@id': ORGANIZATION_ID },
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

/** Editor do site como entidade própria. Emitido na home, junto de WebSite. */
export function OrganizationJsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    ...organizationSchema(),
  }
  return <JsonLdScript schema={schema} />
}

export function ArticleJsonLd({
  frontmatter,
  path,
  imagePath,
}: {
  frontmatter: PostFrontmatter
  /** Path da página. Default: /blog/{slug}. */
  path?: string
  /** Rota da imagem OG da página. Default: o card da marca. */
  imagePath?: string
}) {
  const url = `${site.url}${path ?? `/blog/${frontmatter.slug}`}`

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': `${url}#article`,
    headline: frontmatter.title,
    description: frontmatter.description,
    // `abstract` é a resposta curta do frontmatter: a mesma frase que o leitor
    // vê no topo da página, disponível como dado para quem extrai.
    ...(frontmatter.tldr ? { abstract: frontmatter.tldr } : {}),
    datePublished: frontmatter.datePublished,
    dateModified: frontmatter.dateModified,
    inLanguage: frontmatter.lang,
    url,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    isPartOf: { '@id': WEBSITE_ID },
    image: `${site.url}${imagePath ?? '/opengraph-image'}`,
    // A ÚNICA query que a página persegue (CLAUDE.md §10) é também o assunto
    // dela — declarar as duas coisas pela mesma fonte impede que divirjam.
    keywords: frontmatter.primaryQuery,
    about: { '@type': 'Thing', name: frontmatter.primaryQuery },
    author: personSchema(),
    publisher: organizationSchema(),
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
    '@id': `${site.url}${path}#app`,
    name,
    description,
    url: `${site.url}${path}`,
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Web',
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'BRL' },
    isPartOf: { '@id': WEBSITE_ID },
    author: personSchema(),
    publisher: organizationSchema(),
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
