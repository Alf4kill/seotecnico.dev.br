import type { Metadata } from 'next'
import { site } from '@/lib/site'

// ─────────────────────────────────────────────────────────────────────────────
// buildMetadata — helper único de metadados por página (CLAUDE.md §6).
//
// Motivo de existir: no Metadata API do Next.js, quando uma página define seu
// próprio objeto `openGraph`, ele SUBSTITUI o do root layout por inteiro (não
// há merge profundo). Foi assim que /guia perdeu og:url/og:locale/og:site_name
// e as demais páginas herdaram og:url apontando para a home. Toda página deve
// montar seus metadados por aqui — nunca escrever `openGraph` à mão.
//
// Limites de title (≤60, já com o sufixo do template) e description (≤155)
// são validados aqui e estouram no build — mesma política de /lib/content.ts.
// ─────────────────────────────────────────────────────────────────────────────

const TITLE_MAX = 60
const DESCRIPTION_MAX = 155

export interface BuildMetadataInput {
  /** Título da página. Com `absoluteTitle`, ignora o template "%s | SEO Técnico". */
  title: string
  description: string
  /** Caminho canônico da rota, começando com '/' (ex.: '/blog/meu-post'). */
  path: string
  absoluteTitle?: boolean
  /** Presente ⇒ og:type article com published/modified time (datas do frontmatter). */
  article?: {
    publishedTime: string
    modifiedTime: string
  }
  /** Para rotas utilitárias (ex.: /busca) que não devem ser indexadas. */
  noindex?: boolean
}

/** URL absoluta de um caminho do site; a home fica sem barra final. */
export function absoluteUrl(path: string): string {
  const base = site.url.replace(/\/$/, '')
  return path === '/' ? base : `${base}${path}`
}

export function buildMetadata(input: BuildMetadataInput): Metadata {
  const { title, description, path, absoluteTitle, article, noindex } = input

  if (!path.startsWith('/')) {
    throw new Error(`buildMetadata: path deve começar com '/' (recebido: "${path}")`)
  }

  const renderedTitle = absoluteTitle ? title : `${title} | ${site.name}`
  if (renderedTitle.length > TITLE_MAX) {
    throw new Error(
      `buildMetadata: title renderizado com ${renderedTitle.length} chars (máx ${TITLE_MAX}) em "${path}": "${renderedTitle}"`
    )
  }
  if (description.length > DESCRIPTION_MAX) {
    throw new Error(
      `buildMetadata: description com ${description.length} chars (máx ${DESCRIPTION_MAX}) em "${path}"`
    )
  }

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    // og:title/og:description/twitter:* são preenchidos pelo Next.js a partir
    // de title/description — aqui só entra o que a herança não cobre.
    openGraph: {
      url: absoluteUrl(path),
      siteName: site.name,
      locale: site.locale,
      ...(article
        ? {
            type: 'article',
            publishedTime: article.publishedTime,
            modifiedTime: article.modifiedTime,
          }
        : { type: 'website' }),
    },
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
  }
}
