// ─────────────────────────────────────────────────────────────────────────────
// Content pipeline — MDX files committed in /content (repo root). No CMS.
//
// Frontmatter schema (CLAUDE.md §10) is validated at build time: a missing
// required field or an overlong title/description throws and fails the build.
// ─────────────────────────────────────────────────────────────────────────────

import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import { isCategorySlug, isPostStatus, type CategorySlug, type PostStatus } from '@/lib/categories'
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
  }
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

  return fs
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
