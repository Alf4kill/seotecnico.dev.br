import { getAllPosts, getGuide, type Post } from './content'
import { LANGS, TRANSLATION_PAIRS } from './hreflang'
import { STATIC_SEARCH_ITEMS, type SearchItem } from './search-data'

// ─────────────────────────────────────────────────────────────────────────────
// Índice de busca — montado a partir do conteúdo, não digitado.
//
// Este arquivo lê /content e por isso é SERVIDOR: `getAllPosts` usa `fs`.
// Quem consome (SearchModal, BuscaResults) é client component, então o índice
// desce por props a partir do layout e da página /busca. É o mesmo motivo pelo
// qual sitemap.ts, llms.txt e feed.xml vivem no servidor.
//
// O que continua à mão em search-data.ts: páginas institucionais e ferramentas
// — rotas, não conteúdo, sem frontmatter de onde derivar. Estas o teste de
// paridade cobre pela outra ponta (toda ferramenta no ar tem entrada).
// ─────────────────────────────────────────────────────────────────────────────

function itemFromPost(post: Post, href: string, category: SearchItem['category'], id: string): SearchItem {
  const { title, description, keywords } = post.frontmatter
  return { id, title, description, href, category, keywords }
}

/** As duas versões da pilar, cada uma na rota declarada em lib/hreflang.ts. */
function guideItems(): SearchItem[] {
  const pair = TRANSLATION_PAIRS.find((p) => p.id === getGuide().frontmatter.slug)
  if (!pair) return []

  return LANGS.map((lang) =>
    itemFromPost(
      getGuide(lang),
      pair.paths[lang],
      'pagina',
      lang === 'pt-BR' ? `guia-${pair.id}` : `guia-${pair.id}-${lang}`
    )
  )
}

/**
 * Índice completo, na ordem em que foi montado (páginas, pilar, artigos,
 * ferramentas). A ordem é irrelevante para o resultado — o Fuse ordena por
 * score — mas ser determinística mantém o diff estável.
 */
export function buildSearchIndex(): SearchItem[] {
  const articles = getAllPosts().map((post) =>
    itemFromPost(
      post,
      `/blog/${post.frontmatter.slug}`,
      'artigo',
      `artigo-${post.frontmatter.slug}`
    )
  )

  const pages = STATIC_SEARCH_ITEMS.filter((item) => item.category === 'pagina')
  const tools = STATIC_SEARCH_ITEMS.filter((item) => item.category === 'ferramenta')

  return [...pages, ...guideItems(), ...articles, ...tools]
}
