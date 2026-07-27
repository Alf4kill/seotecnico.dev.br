import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { STATIC_SEARCH_ITEMS, type SearchItem } from './search-data'
import { buildSearchIndex } from './search-index'
import { getAllPosts, getGuide } from './content'
import { TRANSLATION_PAIRS } from './hreflang'

// O índice de busca já foi o último espelho de /content mantido à mão. Agora
// artigos e pilar são derivados do frontmatter (lib/search-index.ts), o que
// muda o que estes testes precisam provar: não mais "alguém lembrou de
// atualizar a lista", e sim que a derivação cobre tudo que foi publicado e que
// a parte ainda estática — rotas sem conteúdo em /content — não apodrece.
//
// A divergência continua sendo silenciosa por natureza: uma entrada ausente
// não quebra build nem página, ela só deixa de existir para quem busca.

const index = buildSearchIndex()
const byCategory = (category: SearchItem['category']) =>
  index.filter((item) => item.category === category)

/** Diretórios sob src/app/ferramentas = ferramentas que realmente foram ao ar. */
function shippedToolRoutes(): string[] {
  const dir = path.join(process.cwd(), 'src', 'app', 'ferramentas')
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => `/ferramentas/${entry.name}`)
    .sort()
}

describe('buildSearchIndex ↔ /content', () => {
  it('indexes every published post, exactly once', () => {
    const published = getAllPosts()
      .map((post) => `/blog/${post.frontmatter.slug}`)
      .sort()
    const indexed = byCategory('artigo')
      .map((item) => item.href)
      .sort()

    expect(indexed, 'every post in /content/blog needs a search entry').toEqual(published)
  })

  it('carries the frontmatter title, description and keywords', () => {
    const bySlug = new Map(
      getAllPosts().map((post) => [`/blog/${post.frontmatter.slug}`, post.frontmatter])
    )

    for (const item of byCategory('artigo')) {
      const frontmatter = bySlug.get(item.href)
      expect(item.title).toBe(frontmatter?.title)
      expect(item.description).toBe(frontmatter?.description)
      expect(item.keywords).toEqual(frontmatter?.keywords)
    }
  })

  it('gives every article the synonyms that make it findable', () => {
    // Buscar "cwv" precisa achar Core Web Vitals. Sem keywords o artigo ainda
    // aparece pelo título, então a falta nunca se denuncia sozinha — daí o
    // piso explícito.
    for (const item of byCategory('artigo')) {
      expect(item.keywords?.length, `${item.href} has no keywords in its frontmatter`)
        .toBeGreaterThanOrEqual(3)
    }
  })

  it('indexes the pillar in every language it is published in', () => {
    const pair = TRANSLATION_PAIRS.find((p) => p.id === getGuide().frontmatter.slug)
    expect(pair, 'the pillar must be a declared translation pair').toBeDefined()

    const hrefs = new Set(index.map((item) => item.href))
    for (const routePath of Object.values(pair!.paths)) {
      expect(hrefs, `${routePath} is published but absent from search`).toContain(routePath)
    }
  })

  it('takes each pillar entry from its own translation, not the original', () => {
    const en = getGuide('en').frontmatter
    const entry = index.find((item) => item.href === '/en/guide/technical-seo-nextjs')

    expect(entry?.title, 'the English entry must read in English').toBe(en.title)
    expect(entry?.description).toBe(en.description)
  })
})

describe('buildSearchIndex ↔ rotas publicadas', () => {
  it('points every shipped tool at its own page', () => {
    // Ferramentas continuam estáticas: são rota, não conteúdo, e não há
    // frontmatter de onde derivar. Uma ferramenta no ar cuja entrada ainda
    // aponta para /ferramentas manda o leitor para a página errada.
    const indexed = byCategory('ferramenta').map((item) => item.href)

    for (const route of shippedToolRoutes()) {
      expect(indexed, `${route} is live but no search entry links to it`).toContain(route)
    }
  })

  it('keeps unlaunched tools pointing at the tools index', () => {
    const shipped = new Set(shippedToolRoutes())
    const placeholders = byCategory('ferramenta').filter((item) => !shipped.has(item.href))

    for (const item of placeholders) {
      expect(item.href, `placeholder "${item.id}" must fall back to the index`).toBe(
        '/ferramentas'
      )
    }
  })
})

describe('buildSearchIndex', () => {
  it('never reuses an id', () => {
    const ids = index.map((item) => item.id)
    expect(new Set(ids).size, 'ids are React keys — duplicates break the list').toBe(ids.length)
  })

  it('never emits the same route twice', () => {
    // Duas fontes alimentam o índice agora. Se a pilar voltasse a ser digitada
    // em search-data.ts, ela apareceria duas vezes nos resultados — e o teste
    // de ids não pegaria, porque os ids seriam diferentes.
    const hrefs = index.map((item) => item.href).filter((href) => href !== '/ferramentas')
    expect(new Set(hrefs).size, 'a route may appear once in the index').toBe(hrefs.length)
  })

  it('leaves no derivable page in the static list', () => {
    // Guarda contra a regressão de reintroduzir à mão o que já é derivado.
    const derivable = STATIC_SEARCH_ITEMS.filter(
      (item) => item.href.startsWith('/blog/') || item.href.includes('guide') || item.href.startsWith('/guia/')
    )
    expect(derivable, 'articles and the pillar come from frontmatter').toEqual([])
  })
})
