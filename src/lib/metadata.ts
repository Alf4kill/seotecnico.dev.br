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

// Dimensões/tipo/alt das imagens OG — consumidos pelas rotas opengraph-image
// e pelo fallback de og:image abaixo (fonte única, módulo sem JSX).
export const OG_SIZE = { width: 1200, height: 630 }
export const OG_CONTENT_TYPE = 'image/png'
export const OG_BRAND_ALT = `${site.name} — SEO técnico para desenvolvedores Next.js`

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
  /**
   * true ⇒ o segmento tem seu próprio opengraph-image.tsx: o helper não emite
   * og:image e deixa a file convention preencher (com hash de cache). Config
   * de página tem prioridade sobre o arquivo do segmento — por isso o padrão
   * da marca precisa ser suprimido aqui, e não "sobreposto" lá.
   */
  fileOgImage?: boolean
}

/** URL absoluta de um caminho do site; a home fica sem barra final. */
export function absoluteUrl(path: string): string {
  const base = site.url.replace(/\/$/, '')
  return path === '/' ? base : `${base}${path}`
}

export function buildMetadata(input: BuildMetadataInput): Metadata {
  const { title, description, path, absoluteTitle, article, noindex, fileOgImage } = input

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
    alternates: {
      canonical: path,
      // Autodiscovery do feed em toda página. Precisa estar aqui (e não no
      // root layout) porque `alternates` da página substitui o herdado.
      types: {
        'application/rss+xml': [{ url: '/feed.xml', title: site.name }],
      },
    },
    // og:title/og:description/twitter:* são preenchidos pelo Next.js a partir
    // de title/description — aqui só entra o que a herança não cobre.
    openGraph: {
      url: absoluteUrl(path),
      siteName: site.name,
      locale: site.locale,
      // og:image padrão da marca (rota de app/opengraph-image.tsx). Precisa
      // estar aqui: como este objeto substitui o openGraph herdado, a imagem
      // do root layout NÃO cascateia para as subpáginas.
      ...(fileOgImage
        ? {}
        : {
            images: [
              {
                url: '/opengraph-image',
                width: OG_SIZE.width,
                height: OG_SIZE.height,
                alt: OG_BRAND_ALT,
              },
            ],
          }),
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
