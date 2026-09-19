import type { Metadata, Viewport } from 'next'
import { site, indexable } from '@/lib/site'
import { languageAlternatePaths, type Lang } from '@/lib/hreflang'
import { colors } from '@/lib/design-tokens'

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
// e pelo og:image abaixo (fonte única, módulo sem JSX).
export const OG_SIZE = { width: 1200, height: 630 }
export const OG_CONTENT_TYPE = 'image/png'
export const OG_BRAND_ALT = `${site.name} — SEO técnico para desenvolvedores Next.js`
export const OG_BRAND_ALT_EN = `${site.name} — technical SEO for Next.js developers`

/**
 * O que muda no Open Graph de uma página conforme o idioma dela. Uma página em
 * inglês herdando `og:locale pt_BR` e o card da marca escrito em português
 * contradiz o próprio hreflang que ela emite — daí as três coisas andarem
 * juntas, derivadas de um único `lang`, em vez de três opções independentes que
 * alguém pode esquecer de passar.
 */
const OG_BY_LANG: Record<Lang, { locale: string; image: string; alt: string }> = {
  'pt-BR': { locale: site.locale, image: '/opengraph-image', alt: OG_BRAND_ALT },
  en: { locale: 'en_US', image: '/en/opengraph-image', alt: OG_BRAND_ALT_EN },
}

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
   * Idioma da página. Só as rotas em inglês passam este campo; o padrão é o do
   * site (§10, português-primeiro). Define `og:locale` e o card OG da marca.
   */
  lang?: Lang
  /**
   * Card OG próprio da página (ex.: /blog/<slug>/opengraph-image), no lugar do
   * card da marca do idioma. As imagens são route handlers, não a file
   * convention — dentro de route groups a convenção ganha hash na URL (ver
   * app/(pt)/opengraph-image/route.tsx) —, então nada injeta og:image sozinho:
   * toda página o recebe daqui.
   */
  ogImage?: { path: string; alt: string }
}

/** URL absoluta de um caminho do site; a home fica sem barra final. */
export function absoluteUrl(path: string): string {
  const base = site.url.replace(/\/$/, '')
  return path === '/' ? base : `${base}${path}`
}

/**
 * Viewport dos root layouts. O site só tem tema escuro: `color-scheme` faz os
 * controles nativos (scrollbar, autofill, <select>) nascerem escuros, e
 * `theme-color` pinta a barra do navegador mobile com o grafite do fundo.
 */
export const rootViewport: Viewport = {
  colorScheme: 'dark',
  themeColor: colors.background,
}

/**
 * Metadados de um root layout. Há um por idioma (ver RootShell) e os dois têm
 * de concordar em tudo menos no locale, então saem da mesma função.
 *
 * `robots` NÃO mora aqui, de propósito. Metadado de layout é herdado por tudo
 * que renderiza dentro dele — inclusive a UI de not-found, à qual o Next.js
 * acrescenta o próprio `noindex`. Com o `index, follow` vindo do layout, todo
 * 404 servia DUAS metas robots conflitantes (defeito (2) do baseline de
 * 2026-07-20). Emitido por página em `buildMetadata`, ele só existe onde há uma
 * página de verdade, e o 404 fica com uma única diretiva.
 */
export function rootMetadata(lang: Lang): Metadata {
  return {
    metadataBase: new URL(site.url),
    title: {
      template: `%s | ${site.name}`,
      default: site.name,
    },
    description: site.description,
    // Sem `url` aqui: og:url é sempre definido por página via buildMetadata
    // (um url estático no root era herdado e apontava toda subpágina à home).
    openGraph: {
      type: 'website',
      locale: OG_BY_LANG[lang].locale,
      siteName: site.name,
    },
    twitter: {
      card: 'summary_large_image',
    },
    verification: {
      google: process.env.GOOGLE_SITE_VERIFICATION,
    },
  }
}

export function buildMetadata(input: BuildMetadataInput): Metadata {
  const { title, description, path, absoluteTitle, article, noindex, ogImage } = input
  const og = OG_BY_LANG[input.lang ?? 'pt-BR']

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

  // hreflang derivado do caminho, nunca declarado à mão na página: é assim que
  // a reciprocidade fica garantida por construção (ver lib/hreflang.ts). Rotas
  // sem tradução não emitem nada — um cluster de um item só é ruído.
  const languagePaths = languageAlternatePaths(path)

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: {
      canonical: path,
      ...(languagePaths
        ? {
            languages: Object.fromEntries(
              Object.entries(languagePaths).map(([lang, target]) => [
                lang,
                absoluteUrl(target),
              ])
            ),
          }
        : {}),
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
      locale: og.locale,
      // og:image: o card da página, ou o da marca no idioma dela. Precisa estar
      // aqui: como este objeto substitui o openGraph herdado, nenhuma imagem
      // cascateia do layout para as subpáginas.
      images: [
        {
          url: ogImage?.path ?? og.image,
          width: OG_SIZE.width,
          height: OG_SIZE.height,
          type: OG_CONTENT_TYPE,
          alt: ogImage?.alt ?? og.alt,
        },
      ],
      ...(article
        ? {
            type: 'article',
            publishedTime: article.publishedTime,
            modifiedTime: article.modifiedTime,
          }
        : { type: 'website' }),
    },
    // Fail-safe de indexação (site.ts): fora de produção, noindex em tudo. Ver
    // `rootMetadata` sobre por que isto é por página e não do layout.
    robots: {
      index: indexable && !noindex,
      follow: indexable,
    },
  }
}
