import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { searchData, type SearchItem } from './search-data'
import { getAllPosts, getGuide } from './content'
import { TRANSLATION_PAIRS } from './hreflang'

// O índice de busca é o último espelho do conteúdo mantido à mão: sitemap.ts,
// llms.txt, feed.xml, a suíte de SEO e as URLs do Lighthouse todos derivam de
// getAllPosts()/getGuide(), mas searchData é digitado a cada publicação.
//
// A divergência é silenciosa por construção: um artigo ausente do índice não
// quebra build, teste nem página — ele apenas não existe para quem busca. É a
// pior classe de defeito do projeto (invisível no CI, visível para o leitor),
// então estes testes tornam o desvio vermelho.
//
// A direção das regras importa. "Toda página que existe tem entrada" é a
// invariante; "toda entrada tem página" NÃO é — as ferramentas ainda não
// lançadas aparecem de propósito, apontando para o índice, como placeholder.

const byCategory = (category: SearchItem['category']) =>
  searchData.filter((item) => item.category === category)

/** Diretórios sob src/app/ferramentas = ferramentas que realmente foram ao ar. */
function shippedToolRoutes(): string[] {
  const dir = path.join(process.cwd(), 'src', 'app', 'ferramentas')
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => `/ferramentas/${entry.name}`)
    .sort()
}

describe('searchData ↔ /content', () => {
  it('indexes every published post, exactly once', () => {
    const published = getAllPosts()
      .map((post) => `/blog/${post.frontmatter.slug}`)
      .sort()
    const indexed = byCategory('artigo')
      .map((item) => item.href)
      .sort()

    expect(indexed, 'every post in /content/blog needs a search entry').toEqual(published)
  })

  it('gives each article entry the title of its post', () => {
    // Título divergente é drift mais sutil que ausência: a busca encontra, mas
    // promete uma página com outro nome.
    const titleBySlug = new Map(
      getAllPosts().map((post) => [`/blog/${post.frontmatter.slug}`, post.frontmatter.title])
    )

    for (const item of byCategory('artigo')) {
      expect(item.title, `entry "${item.id}" drifted from its frontmatter`).toBe(
        titleBySlug.get(item.href)
      )
    }
  })
})

describe('searchData ↔ rotas publicadas', () => {
  it('points every shipped tool at its own page', () => {
    // Uma ferramenta no ar cuja entrada ainda aponta para /ferramentas manda o
    // leitor para a página errada e o informa que a ferramenta não existe.
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

  it('indexes the pillar in every language it is published in', () => {
    const hrefs = new Set(searchData.map((item) => item.href))
    const pillarPaths = TRANSLATION_PAIRS.find((pair) => pair.id === getGuide().frontmatter.slug)

    expect(pillarPaths, 'the pillar must be a declared translation pair').toBeDefined()
    for (const routePath of Object.values(pillarPaths!.paths)) {
      expect(hrefs, `${routePath} is published but absent from search`).toContain(routePath)
    }
  })
})

describe('searchData', () => {
  it('never reuses an id', () => {
    const ids = searchData.map((item) => item.id)
    expect(new Set(ids).size, 'ids are React keys — duplicates break the list').toBe(ids.length)
  })
})
