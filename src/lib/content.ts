// ─────────────────────────────────────────────────────────────────────────────
// Content pipeline — MDX files committed in /content (repo root). No CMS.
//
// Frontmatter schema (CLAUDE.md §10) is validated at build time: a missing
// required field or an overlong title/description throws and fails the build.
// ─────────────────────────────────────────────────────────────────────────────

import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'

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
  faq?: FaqItem[]
}

export interface Post {
  frontmatter: PostFrontmatter
  content: string
}

const CONTENT_DIR = path.join(process.cwd(), 'content')

const TITLE_MAX = 60
const DESCRIPTION_MAX = 155

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

  return {
    title,
    description,
    slug: String(data.slug),
    datePublished: String(data.datePublished),
    dateModified: String(data.dateModified),
    primaryQuery: String(data.primaryQuery),
    lang: data.lang,
    translationOf: data.translationOf ? String(data.translationOf) : undefined,
    faq: Array.isArray(data.faq) ? (data.faq as FaqItem[]) : undefined,
  }
}

function readMdxFile(filePath: string): Post {
  const raw = fs.readFileSync(filePath, 'utf8')
  const { data, content } = matter(raw)
  return {
    frontmatter: parseFrontmatter(data, path.relative(CONTENT_DIR, filePath)),
    content,
  }
}

/** All blog posts, newest first. Returns [] while content/blog is empty. */
export function getAllPosts(): Post[] {
  const dir = path.join(CONTENT_DIR, 'blog')
  if (!fs.existsSync(dir)) return []

  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.mdx'))
    .map((f) => readMdxFile(path.join(dir, f)))
    .sort((a, b) =>
      b.frontmatter.datePublished.localeCompare(a.frontmatter.datePublished)
    )
}

export function getPostBySlug(slug: string): Post | undefined {
  return getAllPosts().find((p) => p.frontmatter.slug === slug)
}

/** The pillar guide (content/guia/seo-tecnico-nextjs.mdx). */
export function getGuide(): Post {
  return readMdxFile(path.join(CONTENT_DIR, 'guia', 'seo-tecnico-nextjs.mdx'))
}
