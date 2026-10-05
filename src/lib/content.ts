// ─────────────────────────────────────────────────────────────────────────────
// Content pipeline — MDX files committed in /content (repo root). No CMS.
//
// Frontmatter schema (CLAUDE.md §10) is validated at build time: a missing
// required field or an overlong title/description throws and fails the build.
// ─────────────────────────────────────────────────────────────────────────────

import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import { isCategorySlug, isExperiment, isPostStatus, type CategorySlug, type PostStatus } from '@/lib/categories'
import { citedTool, extractHeadings, readingTime, type CitedTool, type Heading } from '@/lib/content-derived'

export interface FaqItem {
  question: string
  answer: string
}

export interface PostFrontmatter {
  title: string
  description: string
  slug: string
  datePublished: string
  dateModified: string
  primaryQuery: string
  lang: 'pt-BR' | 'en'
  translationOf?: string
  /**
   * Resposta direta ao `primaryQuery`, em 1–2 frases. Renderizada no topo do
   * artigo e emitida como `Article.abstract` no JSON-LD.
   *
   * Por que é campo e não parágrafo: a regra do primeiro parágrafo (CLAUDE.md
   * §10) já existe, mas em prosa — nada nela é extraível por máquina. Como
   * campo, a resposta vira dado: validada no build, citável no schema e igual
   * nas duas leituras (humana e de máquina).
   */
  tldr?: string
  /**
   * Sinônimos e abreviações que devem encontrar esta página na busca DO SITE
   * ("cwv" para Core Web Vitals, "schema" para JSON-LD). Não é meta keywords —
   * nada disto vai para o HTML, e o Google não vê.
   *
   * Mora no frontmatter, e não numa tabela em /lib, porque é a única forma de
   * publicar um artigo sem precisar lembrar de um segundo arquivo: o índice de
   * busca é derivado daqui (lib/search-index.ts).
   */
  keywords?: string[]
  faq?: FaqItem[]
  /**
   * Eixo temático (lib/categories.ts). Obrigatório em artigo do blog; a pilar
   * cobre todos os eixos e não tem. Define a forma do marcador, o filtro da
   * /blog e os relacionados — não gera URL.
   */
  category?: CategorySlug
  /**
   * Estado do experimento, quando o artigo é um. Opcional e só verdadeiro:
   * "em-medicao" promete uma volta com dado real.
   */
  status?: PostStatus
  /**
   * Experimentos deste site de onde o artigo tira os dados: slugs da MESMA
   * coleção de idioma (um artigo inglês aponta para um experimento inglês).
   * Vira `isBasedOn` no JSON-LD e a caixa "Dados do laboratório" no topo do
   * artigo — o mesmo fato nas duas leituras. O build falha se um slug não
   * existir ou não for experimento (lib/categories.ts → isExperiment).
   */
  basedOn?: string[]
}

/** Derivado do corpo no build (lib/content-derived.ts), nunca escrito à mão. */
export interface PostDerived {
  readingTime: number
  headings: Heading[]
  citedTool?: CitedTool
}

export interface Post {
  frontmatter: PostFrontmatter
  content: string
  derived: PostDerived
}

const CONTENT_DIR = path.join(process.cwd(), 'content')

const TITLE_MAX = 60
const DESCRIPTION_MAX = 155
// Um TL;DR que vira meio artigo deixa de ser resposta e deixa de ser citável.
const TLDR_MAX = 300

function parseFrontmatter(data: Record<string, unknown>, file: string): PostFrontmatter {
  const required = [
    'title',
    'description',
    'slug',
    'datePublished',
    'dateModified',
    'primaryQuery',
    'lang',
  ] as const

  for (const field of required) {
    if (!data[field]) {
      throw new Error(`[content] "${file}": missing required frontmatter field "${field}"`)
    }
  }

  const title = String(data.title)
  const description = String(data.description)

  if (title.length > TITLE_MAX) {
    throw new Error(
      `[content] "${file}": title has ${title.length} chars (max ${TITLE_MAX})`
    )
  }
  if (description.length > DESCRIPTION_MAX) {
    throw new Error(
      `[content] "${file}": description has ${description.length} chars (max ${DESCRIPTION_MAX})`
    )
  }
  if (data.lang !== 'pt-BR' && data.lang !== 'en') {
    throw new Error(`[content] "${file}": lang must be "pt-BR" or "en"`)
  }

  const tldr = data.tldr ? String(data.tldr).trim() : undefined
  if (tldr && tldr.length > TLDR_MAX) {
    throw new Error(
      `[content] "${file}": tldr has ${tldr.length} chars (max ${TLDR_MAX})`
    )
  }

  // Uma string solta em `keywords` (esquecer o hífen do YAML) viraria um array
  // de caracteres na busca, e ninguém notaria: o artigo continuaria achável
  // pelo título. Falhar no build é mais barato que um índice sujo.
  if (data.keywords !== undefined) {
    if (!Array.isArray(data.keywords)) {
      throw new Error(`[content] "${file}": keywords must be a YAML list`)
    }
    if (data.keywords.some((k) => typeof k !== 'string' || k.trim() === '')) {
      throw new Error(`[content] "${file}": every keyword must be a non-empty string`)
    }
  }

  if (data.category !== undefined && !isCategorySlug(data.category)) {
    throw new Error(`[content] "${file}": unknown category "${String(data.category)}" (see lib/categories.ts)`)
  }
  if (data.status !== undefined && !isPostStatus(data.status)) {
    throw new Error(`[content] "${file}": unknown status "${String(data.status)}" (see lib/categories.ts)`)
  }
  if (data.basedOn !== undefined) {
    if (!Array.isArray(data.basedOn) || data.basedOn.some((s) => typeof s !== 'string' || s.trim() === '')) {
      throw new Error(`[content] "${file}": basedOn must be a YAML list of slugs`)
    }
  }

  return {
    title,
    description,
    slug: String(data.slug),
    datePublished: String(data.datePublished),
    dateModified: String(data.dateModified),
    primaryQuery: String(data.primaryQuery),
    lang: data.lang,
    translationOf: data.translationOf ? String(data.translationOf) : undefined,
    tldr,
    keywords: Array.isArray(data.keywords)
      ? (data.keywords as string[]).map((k) => k.trim())
      : undefined,
    faq: Array.isArray(data.faq) ? (data.faq as FaqItem[]) : undefined,
    category: data.category,
    status: data.status,
    basedOn: Array.isArray(data.basedOn)
      ? (data.basedOn as string[]).map((s) => s.trim())
      : undefined,
  }
}

/**
 * Confere o `basedOn` de cada post contra a própria coleção: o slug existe e é
 * de um experimento. Feito depois de ler a coleção inteira, porque o
 * experimento citado pode estar num arquivo lido depois. Exportada para teste.
 */
export function assertBasedOn(posts: Post[], collection: string): void {
  const bySlug = new Map(posts.map((p) => [p.frontmatter.slug, p]))
  for (const { frontmatter } of posts) {
    for (const slug of frontmatter.basedOn ?? []) {
      const source = bySlug.get(slug)
      if (!source) {
        throw new Error(`[content] "${collection}/${frontmatter.slug}": basedOn "${slug}" is not a post in ${collection}`)
      }
      if (!isExperiment(source.frontmatter.status)) {
        throw new Error(`[content] "${collection}/${frontmatter.slug}": basedOn "${slug}" is not an experiment (status em-medicao, fechado or regressao)`)
      }
    }
  }
}

/** O experimento de onde um artigo tira dados, já resolvido para exibição. */
export interface BasedOnSource {
  title: string
  path: string
  status: PostStatus
}

/** Resolve o `basedOn` de um post para título, caminho e estado. */
export function resolveBasedOn(post: Post, collection: Post[], basePath: string): BasedOnSource[] {
  return (post.frontmatter.basedOn ?? []).flatMap((slug) => {
    const source = collection.find((p) => p.frontmatter.slug === slug)
    return source?.frontmatter.status
      ? [{ title: source.frontmatter.title, path: `${basePath}/${slug}`, status: source.frontmatter.status }]
      : []
  })
}

function readMdxFile(filePath: string): Post {
  const raw = fs.readFileSync(filePath, 'utf8')
  const { data, content } = matter(raw)
  return {
    frontmatter: parseFrontmatter(data, path.relative(CONTENT_DIR, filePath)),
    content,
    derived: {
      readingTime: readingTime(content),
      headings: extractHeadings(content),
      citedTool: citedTool(content),
    },
  }
}

/** All blog posts, newest first. Returns [] while content/blog is empty. */
export function getAllPosts(): Post[] {
  const dir = path.join(CONTENT_DIR, 'blog')
  if (!fs.existsSync(dir)) return []

  const posts = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.mdx'))
    .map((f) => {
      const post = readMdxFile(path.join(dir, f))
      if (!post.frontmatter.category) {
        throw new Error(`[content] "blog/${f}": missing required frontmatter field "category"`)
      }
      return post
    })
    .sort((a, b) =>
      b.frontmatter.datePublished.localeCompare(a.frontmatter.datePublished)
    )
  assertBasedOn(posts, 'blog')
  return posts
}

export function getPostBySlug(slug: string): Post | undefined {
  return getAllPosts().find((p) => p.frontmatter.slug === slug)
}

// The pillar exists in two languages. Their files mirror their routes rather
// than sitting side by side, because the English slug differs from the
// Portuguese one on purpose (an English page carries its query in its URL).
// The pairing itself lives in lib/hreflang.ts; `translationOf` in the English
// frontmatter is what a unit test checks that mapping against.
const GUIDE_FILES: Record<'pt-BR' | 'en', string[]> = {
  'pt-BR': ['guia', 'seo-tecnico-nextjs.mdx'],
  en: ['en', 'guide', 'technical-seo-nextjs.mdx'],
}

/** The pillar guide. Defaults to pt-BR, the original. */
export function getGuide(lang: 'pt-BR' | 'en' = 'pt-BR'): Post {
  return readMdxFile(path.join(CONTENT_DIR, ...GUIDE_FILES[lang]))
}

/**
 * Case studies in English (/en/case-studies/<slug>). Written for the portfolio
 * reader, not translations: no hreflang pair, no place in the Portuguese blog.
 * One file per route, the same shape as the English guide.
 */
export function getEnglishCaseStudy(slug: string): Post {
  return readMdxFile(path.join(CONTENT_DIR, 'en', 'case-studies', `${slug}.mdx`))
}

/**
 * Articles in English (/en/blog/<slug>), newest first; [] while
 * content/en/blog is empty. Same rules as the Portuguese blog (category
 * required), plus `lang: en`. A translation declares `translationOf: <pt
 * slug>`; its hreflang pair is declared in lib/hreflang.ts, and a unit test
 * checks the two agree. These posts stay out of the Portuguese surfaces
 * (/blog, search, feed): the site is Portuguese-first, and English exists for
 * portfolio and distribution, not for ranking.
 */
export function getAllEnglishPosts(): Post[] {
  const dir = path.join(CONTENT_DIR, 'en', 'blog')
  if (!fs.existsSync(dir)) return []

  const posts = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.mdx'))
    .map((f) => {
      const post = readMdxFile(path.join(dir, f))
      if (!post.frontmatter.category) {
        throw new Error(`[content] "en/blog/${f}": missing required frontmatter field "category"`)
      }
      if (post.frontmatter.lang !== 'en') {
        throw new Error(`[content] "en/blog/${f}": lang must be "en"`)
      }
      return post
    })
    .sort((a, b) =>
      b.frontmatter.datePublished.localeCompare(a.frontmatter.datePublished)
    )
  assertBasedOn(posts, 'en/blog')
  return posts
}

export function getEnglishPostBySlug(slug: string): Post | undefined {
  return getAllEnglishPosts().find((p) => p.frontmatter.slug === slug)
}

/**
 * Até `limit` artigos para "Continue pelo mesmo eixo": primeiro os da mesma
 * categoria, depois os mais recentes — nunca o próprio artigo. Links internos
 * entre spokes, derivados em vez de curados à mão.
 */
export function getRelatedPosts(slug: string, limit = 3): Post[] {
  const posts = getAllPosts()
  const self = posts.find((p) => p.frontmatter.slug === slug)
  const others = posts.filter((p) => p.frontmatter.slug !== slug)
  const sameAxis = others.filter((p) => p.frontmatter.category === self?.frontmatter.category)
  const rest = others.filter((p) => !sameAxis.includes(p))
  return [...sameAxis, ...rest].slice(0, limit)
}
