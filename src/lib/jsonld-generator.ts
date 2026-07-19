// ─────────────────────────────────────────────────────────────────────────────
// Gerador de JSON-LD — lógica pura da ferramenta /ferramentas/gerador-json-ld.
//
// Separada do componente de UI para ser testável no Vitest (CLAUDE.md §8:
// unit tests para schema builders). Nenhuma função aqui toca DOM ou rede:
// entrada de formulário → objeto schema.org → serialização (JSON puro ou
// componente Next.js pronto para colar).
// ─────────────────────────────────────────────────────────────────────────────

export type GeneratorSchemaType =
  | 'Article'
  | 'FAQPage'
  | 'BreadcrumbList'
  | 'Person'
  | 'Organization'

export interface ArticleInput {
  headline: string
  description: string
  /** URL canônica do artigo (vira mainEntityOfPage). */
  url: string
  datePublished: string
  dateModified: string
  authorName: string
  authorUrl: string
  publisherName: string
  imageUrl: string
}

export interface FaqPairInput {
  question: string
  answer: string
}

export interface BreadcrumbItemInput {
  name: string
  url: string
}

export interface PersonInput {
  name: string
  jobTitle: string
  url: string
  /** Uma URL por linha (GitHub, LinkedIn…). */
  sameAs: string
}

export interface OrganizationInput {
  name: string
  url: string
  logoUrl: string
  /** Uma URL por linha. */
  sameAs: string
}

export interface GeneratorInput {
  article: ArticleInput
  faq: FaqPairInput[]
  breadcrumb: BreadcrumbItemInput[]
  person: PersonInput
  organization: OrganizationInput
}

export const emptyGeneratorInput: GeneratorInput = {
  article: {
    headline: '',
    description: '',
    url: '',
    datePublished: '',
    dateModified: '',
    authorName: '',
    authorUrl: '',
    publisherName: '',
    imageUrl: '',
  },
  faq: [{ question: '', answer: '' }],
  breadcrumb: [
    { name: '', url: '' },
    { name: '', url: '' },
  ],
  person: { name: '', jobTitle: '', url: '', sameAs: '' },
  organization: { name: '', url: '', logoUrl: '', sameAs: '' },
}

/** Textarea "uma URL por linha" → array limpo (linhas vazias descartadas). */
export function parseSameAs(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
}

/** Espalha `{ [key]: value }` apenas quando value não é vazio. */
function field(key: string, value: string): Record<string, string> {
  const v = value.trim()
  return v ? { [key]: v } : {}
}

// ── Validação (mensagens em pt-BR exibidas na UI) ────────────────────────────

export function validateInput(type: GeneratorSchemaType, input: GeneratorInput): string[] {
  const errors: string[] = []

  if (type === 'Article') {
    const a = input.article
    if (!a.headline.trim()) errors.push('Informe o título (headline) do artigo.')
    if (!a.url.trim()) errors.push('Informe a URL canônica do artigo.')
    if (!a.datePublished.trim()) errors.push('Informe a data de publicação.')
    if (!a.authorName.trim()) errors.push('Informe o nome do autor.')
  }

  if (type === 'FAQPage') {
    const pairs = input.faq.filter((p) => p.question.trim() || p.answer.trim())
    if (pairs.length === 0) {
      errors.push('Adicione pelo menos uma pergunta com resposta.')
    }
    for (const [i, p] of pairs.entries()) {
      if (!p.question.trim()) errors.push(`Pergunta ${i + 1}: falta o texto da pergunta.`)
      if (!p.answer.trim()) errors.push(`Pergunta ${i + 1}: falta a resposta.`)
    }
  }

  if (type === 'BreadcrumbList') {
    const items = input.breadcrumb.filter((b) => b.name.trim() || b.url.trim())
    if (items.length < 2) {
      errors.push('Um breadcrumb precisa de pelo menos 2 níveis (ex.: Home → Página).')
    }
    for (const [i, b] of items.entries()) {
      if (!b.name.trim()) errors.push(`Nível ${i + 1}: falta o nome.`)
      if (!b.url.trim()) errors.push(`Nível ${i + 1}: falta a URL.`)
    }
  }

  if (type === 'Person') {
    if (!input.person.name.trim()) errors.push('Informe o nome da pessoa.')
  }

  if (type === 'Organization') {
    if (!input.organization.name.trim()) errors.push('Informe o nome da organização.')
    if (!input.organization.url.trim()) errors.push('Informe a URL do site da organização.')
  }

  return errors
}

// ── Builders (formulário → objeto schema.org) ───────────────────────────────

export function buildSchema(
  type: GeneratorSchemaType,
  input: GeneratorInput
): Record<string, unknown> {
  switch (type) {
    case 'Article': {
      const a = input.article
      return {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: a.headline.trim(),
        ...field('description', a.description),
        mainEntityOfPage: a.url.trim(),
        datePublished: a.datePublished.trim(),
        ...field('dateModified', a.dateModified),
        ...(a.imageUrl.trim() ? { image: [a.imageUrl.trim()] } : {}),
        author: {
          '@type': 'Person',
          name: a.authorName.trim(),
          ...field('url', a.authorUrl),
        },
        ...(a.publisherName.trim()
          ? { publisher: { '@type': 'Organization', name: a.publisherName.trim() } }
          : {}),
      }
    }

    case 'FAQPage':
      return {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: input.faq
          .filter((p) => p.question.trim() && p.answer.trim())
          .map((p) => ({
            '@type': 'Question',
            name: p.question.trim(),
            acceptedAnswer: { '@type': 'Answer', text: p.answer.trim() },
          })),
      }

    case 'BreadcrumbList':
      return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: input.breadcrumb
          .filter((b) => b.name.trim() && b.url.trim())
          .map((b, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: b.name.trim(),
            item: b.url.trim(),
          })),
      }

    case 'Person': {
      const p = input.person
      const sameAs = parseSameAs(p.sameAs)
      return {
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: p.name.trim(),
        ...field('jobTitle', p.jobTitle),
        ...field('url', p.url),
        ...(sameAs.length > 0 ? { sameAs } : {}),
      }
    }

    case 'Organization': {
      const o = input.organization
      const sameAs = parseSameAs(o.sameAs)
      return {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: o.name.trim(),
        url: o.url.trim(),
        ...field('logo', o.logoUrl),
        ...(sameAs.length > 0 ? { sameAs } : {}),
      }
    }
  }
}

// ── Serialização ─────────────────────────────────────────────────────────────

export function toJsonLd(schema: Record<string, unknown>): string {
  return JSON.stringify(schema, null, 2)
}

/** Nome do componente gerado por tipo (FAQPage → FaqJsonLd etc.). */
export const componentNames: Record<GeneratorSchemaType, string> = {
  Article: 'ArticleJsonLd',
  FAQPage: 'FaqJsonLd',
  BreadcrumbList: 'BreadcrumbJsonLd',
  Person: 'PersonJsonLd',
  Organization: 'OrganizationJsonLd',
}

const kebab: Record<GeneratorSchemaType, string> = {
  Article: 'article-json-ld',
  FAQPage: 'faq-json-ld',
  BreadcrumbList: 'breadcrumb-json-ld',
  Person: 'person-json-ld',
  Organization: 'organization-json-ld',
}

/**
 * Componente Next.js (App Router) pronto para colar: Server Component que
 * injeta o schema via <script type="application/ld+json"> — o mesmo padrão
 * que este site usa em produção.
 */
export function toNextComponent(
  type: GeneratorSchemaType,
  schema: Record<string, unknown>
): string {
  const name = componentNames[type]
  return `// components/seo/${kebab[type]}.tsx
// Server Component — renderize <${name} /> dentro da página (App Router).
const schema = ${toJsonLd(schema)}

export function ${name}() {
  // JSON.stringify não escapa "<": o replace impede que um texto do schema
  // feche a tag script (recomendação do guia de JSON-LD do Next.js).
  const json = JSON.stringify(schema).replace(/</g, '\\\\u003c')
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />
}
`
}
