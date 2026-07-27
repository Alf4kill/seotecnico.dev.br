import type { IFuseOptions } from 'fuse.js'

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
    description: 'SEO Técnico — guias e ferramentas de SEO para Next.js',
    href: '/',
    category: 'pagina',
  },
  {
    id: 'blog',
    title: 'Blog',
    description: 'Artigos práticos de SEO técnico para desenvolvedores Next.js',
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
