import type { Post } from '@/lib/content'
import { absoluteUrl } from '@/lib/metadata'
import { site } from '@/lib/site'
import { TRAP_LLMS_PATH } from '@/lib/lab-traps'

// ─────────────────────────────────────────────────────────────────────────────
// /llms.txt — índice do site em markdown, no formato proposto por llmstxt.org.
// Servido por app/llms.txt/route.ts (estático, regenerado a cada build).
//
// HONESTIDADE SOBRE O FORMATO: nenhum fornecedor grande de IA se comprometeu a
// ler llms.txt. O Google já comparou publicamente a proposta à meta keywords.
// Este arquivo NÃO está aqui porque funciona — está aqui porque, com o evento
// `ai_crawler_hit` no ar (proxy.ts), este site consegue MEDIR se alguma coisa
// busca o arquivo. A previsão registrada em docs/experiment-log.md é de zero
// buscas em 90 dias; o dado é que vale publicação, não o palpite.
//
// Deriva de getGuide() + getAllPosts() — a mesma fonte de app/sitemap.ts — para
// que não exista estado em que o índice discorde do que está publicado.
// ─────────────────────────────────────────────────────────────────────────────

/** Páginas sem frontmatter (mesma lista fixa que app/sitemap.ts carrega). */
const TOOL_LINKS = [
  {
    path: '/ferramentas/gerador-json-ld',
    title: 'Gerador de JSON-LD',
    description:
      'Gera Article, FAQPage, BreadcrumbList, Person e Organization válidos, com saída pronta para colar num Server Component do Next.js.',
  },
] as const

const ABOUT_LINKS = [
  {
    path: '/sobre',
    title: 'Sobre',
    description: `Quem escreve: ${site.author.name}, ${site.author.jobTitle}. Metodologia do laboratório e como cada resultado é medido.`,
  },
] as const

/** Uma linha de link markdown: `- [título](url): descrição`. */
function linkLine(path: string, title: string, description: string): string {
  return `- [${title}](${absoluteUrl(path)}): ${description}`
}

function postLine(post: Post): string {
  const { slug, title, description } = post.frontmatter
  return linkLine(`/blog/${slug}`, title, description)
}

export function buildLlmsTxt(guide: Post, posts: Post[]): string {
  const sections = [
    `# ${site.name}`,
    '',
    `> ${site.description} Conteúdo em português (pt-BR), escrito por ${site.author.name}. Cada técnica documentada aqui está implementada neste próprio domínio e medida com Google Search Console, CrUX e experimentos antes/depois — nada é publicado antes de ser implementado e medido.`,
    '',
    '## Guia (pilar)',
    '',
    linkLine('/guia/seo-tecnico-nextjs', guide.frontmatter.title, guide.frontmatter.description),
    '',
    '## Artigos',
    '',
    ...posts.map(postLine),
    '',
    '## Ferramentas',
    '',
    ...TOOL_LINKS.map((t) => linkLine(t.path, t.title, t.description)),
    '',
    '## Sobre',
    '',
    ...ABOUT_LINKS.map((a) => linkLine(a.path, a.title, a.description)),
    '',
    '## Lab',
    '',
    // Sonda de canal (docs/detection-experiment.md §4): esta URL existe SÓ
    // aqui — um acesso a ela prova que o cliente parseia llms.txt e segue os
    // links. Rótulo honesto de propósito: nada neste domínio engana ninguém,
    // inclusive a isca.
    linkLine(
      TRAP_LLMS_PATH,
      'Sonda de leitura do llms.txt',
      'Página de laboratório que mede se agentes de IA seguem links deste arquivo. Não indexada; o conteúdo explica o experimento.'
    ),
    '',
    '## Licença e citação',
    '',
    '- O código deste site é MIT; o conteúdo (textos, imagens e visualizações de dados originais) é todos os direitos reservados.',
    `- Citações curtas com atribuição a ${site.author.name} e link para a URL original são bem-vindas. Reprodução integral, não.`,
    `- Feed RSS: ${absoluteUrl('/feed.xml')}`,
    '',
  ]

  return sections.join('\n')
}
