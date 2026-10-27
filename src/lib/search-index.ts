import { getAllEnglishPosts, getAllPosts, getGuide, getProjectEntries, type Post } from './content'
import { LANGS, TRANSLATION_PAIRS, type Lang } from './hreflang'
import { STATIC_SEARCH_ITEMS, STATIC_SEARCH_ITEMS_EN, type SearchItem } from './search-data'

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
 * Índice completo do idioma, na ordem em que foi montado (páginas, pilar,
 * artigos, entradas do projeto, ferramentas). A ordem é irrelevante para o resultado — o Fuse ordena
 * por score — mas ser determinística mantém o diff estável.
 *
 * O índice português segue com as duas versões da pilar (quem procura o guia
 * em inglês na moldura portuguesa o encontra); o inglês traz só o conteúdo em
 * inglês, ferramentas incluídas.
 */
export function buildSearchIndex(lang: Lang = 'pt-BR'): SearchItem[] {
  if (lang === 'en') {
    const articles = getAllEnglishPosts().map((post) =>
      itemFromPost(post, `/en/blog/${post.frontmatter.slug}`, 'artigo', `article-${post.frontmatter.slug}`)
    )
    const guide = guideItems().filter((item) => item.href.startsWith('/en/'))
    const pages = STATIC_SEARCH_ITEMS_EN.filter((item) => item.category === 'pagina')
    const project = getProjectEntries('en').map((entry) =>
      itemFromPost(entry, `/en/project/${entry.frontmatter.slug}`, 'projeto', `project-${entry.frontmatter.slug}`)
    )
    const tools = STATIC_SEARCH_ITEMS_EN.filter((item) => item.category === 'ferramenta')
    return [...pages, ...guide, ...articles, ...project, ...tools]
  }

  const articles = getAllPosts().map((post) =>
    itemFromPost(
      post,
      `/blog/${post.frontmatter.slug}`,
      'artigo',
      `artigo-${post.frontmatter.slug}`
    )
  )

  const pages = STATIC_SEARCH_ITEMS.filter((item) => item.category === 'pagina')
  const project = getProjectEntries().map((entry) =>
    itemFromPost(entry, `/projeto/${entry.frontmatter.slug}`, 'projeto', `projeto-${entry.frontmatter.slug}`)
  )
  const tools = STATIC_SEARCH_ITEMS.filter((item) => item.category === 'ferramenta')

  return [...pages, ...guideItems(), ...articles, ...project, ...tools]
}
