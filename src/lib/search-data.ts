import type { IFuseOptions } from 'fuse.js'

// ─────────────────────────────────────────────────────────────────────────────
// Search data — fonte única de verdade do índice de busca.
// Contém as páginas do site, o guia e as ferramentas.
// TODO: derivar entradas de artigos automaticamente de getAllPosts() quando os
// primeiros artigos forem publicados.
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

export const searchData: SearchItem[] = [
  // ── Páginas ─────────────────────────────────────────────────────────────
  {
    id: 'home',
    title: 'Home',
    description: 'SEO Técnico — guias e ferramentas de SEO para Next.js',
    href: '/',
    category: 'pagina',
  },
  {
    id: 'guia-seo-tecnico-nextjs',
    title: 'Guia de SEO técnico para Next.js',
    description: 'Guia completo: metadados, JSON-LD, sitemaps, Core Web Vitals e mais',
    href: '/guia/seo-tecnico-nextjs',
    category: 'pagina',
    keywords: ['guia', 'app router', 'metadata', 'json-ld', 'sitemap', 'core web vitals'],
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

  // ── Artigos ─────────────────────────────────────────────────────────────
  {
    id: 'artigo-melhorar-lcp-nextjs',
    title: 'Como melhorar o LCP no Next.js: guia pelas 4 subpartes',
    description: 'Diagnóstico pelas 4 subpartes, preload no next/image (v16), next/font e verificação no PSI',
    href: '/blog/melhorar-lcp-nextjs',
    category: 'artigo',
    keywords: ['lcp', 'core web vitals', 'cwv', 'performance', 'preload', 'next/image', 'next/font', 'ttfb', 'render delay'],
  },

  // ── Ferramentas (em breve — apontam para o índice até serem lançadas) ───
  {
    id: 'gerador-json-ld',
    title: 'Gerador de JSON-LD',
    description: 'Gere dados estruturados schema.org válidos para o seu site (em breve)',
    href: '/ferramentas',
    category: 'ferramenta',
    keywords: ['schema', 'dados estruturados', 'rich snippets'],
  },
  {
    id: 'validador-meta-tags',
    title: 'Validador de meta tags',
    description: 'Valide title, description, canonical e Open Graph de qualquer URL (em breve)',
    href: '/ferramentas',
    category: 'ferramenta',
    keywords: ['title', 'description', 'open graph', 'canonical'],
  },
  {
    id: 'checador-cwv',
    title: 'Checador de Core Web Vitals',
    description: 'Consulte LCP, CLS e INP reais de qualquer site via CrUX (em breve)',
    href: '/ferramentas',
    category: 'ferramenta',
    keywords: ['cwv', 'lcp', 'cls', 'inp', 'performance', 'crux'],
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
