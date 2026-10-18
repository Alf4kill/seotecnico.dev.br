import type { IFuseOptions } from 'fuse.js'
import type { Lang } from './hreflang'

// ─────────────────────────────────────────────────────────────────────────────
// Search data — a parte do índice que NÃO tem de onde ser derivada.
//
// Artigos e as duas versões da pilar são montados a partir do frontmatter em
// lib/search-index.ts. O que sobrou aqui são rotas sem conteúdo em /content:
// páginas institucionais e ferramentas. Ferramenta ainda não lançada aparece
// de propósito, apontando para o índice — quem procura "checador de cwv"
// merece saber que ele está a caminho.
//
// Este arquivo é importado por client component (SearchModal, BuscaResults):
// nada aqui pode tocar `fs`. É por isso que a montagem mora em outro módulo.
// ─────────────────────────────────────────────────────────────────────────────

export type SearchCategory = 'pagina' | 'artigo' | 'ferramenta'

export interface SearchItem {
  id:          string
  title:       string
  description: string
  href:        string
  category:    SearchCategory
  /** Sinônimos, abreviações técnicas (ex: 'CWV', 'schema') */
  keywords?:   string[]
}

export const STATIC_SEARCH_ITEMS: SearchItem[] = [
  // ── Páginas ─────────────────────────────────────────────────────────────
  {
    id: 'home',
    title: 'Home',
    description: 'SEO Técnico — SEO medido para sites modernos',
    href: '/',
    category: 'pagina',
  },
  {
    id: 'blog',
    title: 'Blog',
    description: 'Artigos de SEO técnico para sites modernos, com código Next.js e experimentos medidos',
    href: '/blog',
    category: 'pagina',
    keywords: ['artigos', 'posts'],
  },
  {
    id: 'ferramentas',
    title: 'Ferramentas',
    description: 'Ferramentas gratuitas de SEO técnico: JSON-LD, meta tags e CWV',
    href: '/ferramentas',
    category: 'pagina',
    keywords: ['tools', 'gratuitas'],
  },
  {
    id: 'sobre',
    title: 'Sobre',
    description: 'Quem faz o SEO Técnico e por que este site é um laboratório vivo',
    href: '/sobre',
    category: 'pagina',
    keywords: ['autor', 'contato', 'projeto'],
  },
  {
    id: 'laboratorio',
    title: 'Laboratório',
    description: 'Os experimentos deste site, com hipótese registrada antes do dado, e os artigos que usam os resultados',
    href: '/laboratorio',
    category: 'pagina',
    keywords: ['experimentos', 'lab', 'método', 'registro', 'pré-registro'],
  },
  {
    id: 'design',
    title: 'Design do site',
    description: 'Por que o site é escuro por padrão, tem tema claro e usa formas no lugar de ícones',
    href: '/design',
    category: 'pagina',
    keywords: ['design', 'colofão', 'retrofuturismo', 'bauhaus', 'paleta', 'contraste', 'tipografia', 'tema claro', 'modo escuro'],
  },

  // ── Ferramentas (as "em breve" apontam para o índice até serem lançadas) ─
  {
    id: 'gerador-json-ld',
    title: 'Gerador de JSON-LD',
    description: 'Gere dados estruturados schema.org válidos, com saída pronta para Next.js',
    href: '/ferramentas/gerador-json-ld',
    category: 'ferramenta',
    keywords: ['schema', 'dados estruturados', 'rich snippets', 'json-ld', 'gerador', 'faq', 'breadcrumb', 'article'],
  },
  {
    id: 'validador-meta-tags',
    title: 'Validador de meta tags',
    description: 'Valide title, description, canonical e Open Graph de qualquer URL, com preview de SERP',
    href: '/ferramentas/validador-meta-tags',
    category: 'ferramenta',
    keywords: ['title', 'description', 'open graph', 'canonical', 'meta tags', 'serp', 'preview', 'validador', 'og:image', 'twitter card', 'h1'],
  },
  {
    id: 'checador-cwv',
    title: 'Checador de Core Web Vitals',
    description: 'Consulte LCP, INP e CLS reais de qualquer site pelo Chrome UX Report, com a distribuição das visitas',
    href: '/ferramentas/checador-cwv',
    category: 'ferramenta',
    keywords: ['cwv', 'lcp', 'cls', 'inp', 'performance', 'crux', 'core web vitals', 'campo', 'field data', 'p75', 'chrome ux report', 'ttfb', 'fcp'],
  },
]

/**
 * O mesmo para a moldura inglesa: páginas em inglês e as três ferramentas, que
 * só existem em português e por isso dizem isso na própria descrição.
 */
export const STATIC_SEARCH_ITEMS_EN: SearchItem[] = [
  // ── Pages ───────────────────────────────────────────────────────────────
  {
    id: 'home-en',
    title: 'Home',
    description: 'SEO Técnico: technical SEO, measured on modern sites',
    href: '/en',
    category: 'pagina',
  },
  {
    id: 'blog-en',
    title: 'Blog',
    description: 'Technical SEO articles for modern sites, with Next.js code and measured experiments',
    href: '/en/blog',
    category: 'pagina',
    keywords: ['articles', 'posts'],
  },
  {
    id: 'lab-en',
    title: 'Lab',
    description: "This site's experiments, with the hypothesis registered before the data, and the articles that use the results",
    href: '/en/lab',
    category: 'pagina',
    keywords: ['experiments', 'laboratory', 'method', 'pre-registration'],
  },
  {
    id: 'case-studies-en',
    title: 'Case studies',
    description: 'Problems from this site, what was done in code and what was measured',
    href: '/en/case-studies',
    category: 'pagina',
    keywords: ['portfolio', 'results', 'case study'],
  },
  {
    id: 'about-en',
    title: 'About',
    description: 'Who builds SEO Técnico and why this site is a live laboratory',
    href: '/en/about',
    category: 'pagina',
    keywords: ['author', 'contact', 'project'],
  },
  {
    id: 'design-en',
    title: 'Site design',
    description: 'Why the site is dark by default, has a light theme and uses shapes instead of icons',
    href: '/en/design',
    category: 'pagina',
    keywords: ['design', 'colophon', 'retro-futurism', 'bauhaus', 'palette', 'contrast', 'typography', 'light theme', 'dark mode'],
  },

  // ── Tools (Portuguese interface) ─────────────────────────────────────────
  {
    id: 'gerador-json-ld-en',
    title: 'JSON-LD generator',
    description: 'Generate valid schema.org structured data, with output ready for Next.js. Interface in Portuguese.',
    href: '/ferramentas/gerador-json-ld',
    category: 'ferramenta',
    keywords: ['schema', 'structured data', 'rich snippets', 'json-ld', 'generator', 'faq', 'breadcrumb', 'article'],
  },
  {
    id: 'validador-meta-tags-en',
    title: 'Meta tag validator',
    description: 'Validate the title, description, canonical and Open Graph of any URL, with a SERP preview. Interface in Portuguese.',
    href: '/ferramentas/validador-meta-tags',
    category: 'ferramenta',
    keywords: ['title', 'description', 'open graph', 'canonical', 'meta tags', 'serp', 'preview', 'validator', 'og:image', 'twitter card', 'h1'],
  },
  {
    id: 'checador-cwv-en',
    title: 'Core Web Vitals checker',
    description: "Look up any site's real LCP, INP and CLS from the Chrome UX Report, with the distribution of visits. Interface in Portuguese.",
    href: '/ferramentas/checador-cwv',
    category: 'ferramenta',
    keywords: ['cwv', 'lcp', 'cls', 'inp', 'performance', 'crux', 'core web vitals', 'field data', 'p75', 'chrome ux report', 'ttfb', 'fcp'],
  },
]

// ── Configuração do Fuse.js ─────────────────────────────────────────────────
export const fuseOptions: IFuseOptions<SearchItem> = {
  keys: [
    { name: 'title',       weight: 2   },
    { name: 'keywords',    weight: 1.5 },
    { name: 'description', weight: 1   },
  ],
  threshold:          0.35,  // 0 = exato, 1 = qualquer coisa; 0.35 = tolerante a erros
  minMatchCharLength: 2,     // ignora buscas com 1 caractere
  includeScore:       true,
  shouldSort:         true,
}

// ── Labels de categoria para exibição ──────────────────────────────────────
export const categoryLabel: Record<SearchCategory, string> = {
  pagina:     'Página',
  artigo:     'Artigo',
  ferramenta: 'Ferramenta',
}

// ── Textos da busca por idioma (modal, página e botão do cabeçalho) ─────────
export interface SearchCopy {
  /** Rota da página de resultados completos. */
  path: string
  category: Record<SearchCategory, string>
  /** Plural do rótulo de categoria, para os títulos de grupo da página. */
  categoryPlural: Record<SearchCategory, string>
  dialog: string
  placeholder: string
  input: string
  open: string
  close: string
  button: string
  seeAll: string
  noResults: string
  minChars: string
}

export const SEARCH_COPY: Record<Lang, SearchCopy> = {
  'pt-BR': {
    path: '/busca',
    category: categoryLabel,
    categoryPlural: { pagina: 'Páginas', artigo: 'Artigos', ferramenta: 'Ferramentas' },
    dialog: 'Busca',
    placeholder: 'Buscar artigos, ferramentas, páginas...',
    input: 'Campo de busca',
    open: 'Abrir busca',
    close: 'Fechar busca',
    button: 'buscar…',
    seeAll: 'Ver todos os resultados para',
    noResults: 'Nenhum resultado encontrado para',
    minChars: 'Digite ao menos 2 caracteres para buscar',
  },
  en: {
    path: '/en/search',
    category: { pagina: 'Page', artigo: 'Article', ferramenta: 'Tool' },
    categoryPlural: { pagina: 'Pages', artigo: 'Articles', ferramenta: 'Tools' },
    dialog: 'Search',
    placeholder: 'Search articles, tools, pages...',
    input: 'Search field',
    open: 'Open search',
    close: 'Close search',
    button: 'search…',
    seeAll: 'See all results for',
    noResults: 'No results found for',
    minChars: 'Type at least 2 characters to search',
  },
}
