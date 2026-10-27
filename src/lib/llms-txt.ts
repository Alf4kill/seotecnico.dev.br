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

/**
 * Páginas sem frontmatter (mesma lista fixa que app/sitemap.ts carrega).
 * llms-txt.test.ts compara com os diretórios de src/app/(pt)/ferramentas: a
 * Ferramenta 3 ficou meses fora daqui porque nada conferia.
 */
const TOOL_LINKS = [
  {
    path: '/ferramentas/gerador-json-ld',
    title: 'Gerador de JSON-LD',
    description:
      'Gera Article, FAQPage, BreadcrumbList, Person e Organization válidos, com saída pronta para colar num Server Component do Next.js.',
  },
  {
    path: '/ferramentas/validador-meta-tags',
    title: 'Validador de meta tags',
    description:
      'Valida title, description, canonical, robots, H1 e Open Graph de qualquer URL, lendo o HTML do servidor — a mesma régua que este site impõe em CI.',
  },
  {
    path: '/ferramentas/checador-cwv',
    title: 'Checador de Core Web Vitals',
    description:
      'Consulta LCP, INP e CLS de campo de qualquer origem pelo Chrome UX Report: o p75 de visitas reais nos últimos 28 dias, com a distribuição.',
  },
] as const

const ABOUT_LINKS = [
  {
    path: '/laboratorio',
    title: 'Laboratório',
    description:
      'Os experimentos deste site — hipótese registrada antes do dado, URL secreta por assistente, registro público — e os artigos que usam os resultados de cada um.',
  },
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

/** Entradas da seção do projeto (CLAUDE.md §5.4), nos dois idiomas. */
export interface ProjectEntries {
  pt: Post[]
  en: Post[]
}

export function buildLlmsTxt(
  guide: Post,
  posts: Post[],
  guideEn?: Post,
  postsEn: Post[] = [],
  project: ProjectEntries = { pt: [], en: [] }
): string {
  const sections = [
    `# ${site.name}`,
    '',
    `> ${site.description} Conteúdo em português (pt-BR), escrito por ${site.author.name}. Cada técnica documentada aqui está implementada neste próprio domínio e medida com Google Search Console, CrUX e experimentos antes/depois — nada é publicado antes de ser implementado e medido.`,
    '',
    '## Guia (pilar)',
    '',
    linkLine('/guia/seo-tecnico-nextjs', guide.frontmatter.title, guide.frontmatter.description),
    '',
    // Seção própria, e não uma linha solta no bloco em português: um extrator
    // que só quer a versão em inglês precisa saber que ela é TRADUÇÃO, não
    // conteúdo adicional — declarar isso aqui é o equivalente textual do
    // hreflang que as duas páginas emitem no <head>.
    ...(guideEn
      ? [
          '## English version',
          '',
          `- [${guideEn.frontmatter.title}](${absoluteUrl('/en/guide/technical-seo-nextjs')}): ${guideEn.frontmatter.description} English translation of the pillar guide above; every chapter article has an English version, listed below.`,
          `- [${site.name} — English home](${absoluteUrl('/en')}): What this lab is, what has been measured so far, and where the evidence lives.`,
          `- [Blog in English](${absoluteUrl('/en/blog')}): The English versions of the articles, with the same filter by kind and axis as the Portuguese blog.`,
          `- [Lab](${absoluteUrl('/en/lab')}): This site's experiments, with the hypothesis registered before the data, and the articles that use each one's results. English version of /laboratorio.`,
          `- [Free technical SEO tools](${absoluteUrl('/en/tools')}): English versions of the three tools above, with the same checks and the same API.`,
          `- [JSON-LD generator](${absoluteUrl('/en/tools/json-ld-generator')}): Generates valid Article, FAQPage, BreadcrumbList, Person and Organization, with output ready to paste into a Next.js Server Component.`,
          `- [Meta tag validator](${absoluteUrl('/en/tools/meta-tag-validator')}): Validates the title, description, canonical, robots, H1 and Open Graph of any URL, reading the server HTML — the same standard this site enforces in CI.`,
          `- [Core Web Vitals checker](${absoluteUrl('/en/tools/cwv-checker')}): Looks up the field LCP, INP and CLS of any origin in the Chrome UX Report: the p75 of real visits over the last 28 days, with the distribution.`,
          `- [Case studies](${absoluteUrl('/en/case-studies')}): Four problems from this site, what was done in code and what was measured, each linked to its pull request and experiment-log entry.`,
          `- [Detecting AI crawlers on a live site](${absoluteUrl('/en/case-studies/ai-crawler-detection')}): A 57-day pilot of AI crawler telemetry with verified identities and honeypots, its six instrument defects, and a positive control with ChatGPT, Claude and Perplexity.`,
          `- [About ${site.author.name}](${absoluteUrl('/en/about')}): Who builds this site and how the work is done — hypothesis first, SEO as a merge gate, own field data.`,
          ...postsEn.map(({ frontmatter }) =>
            linkLine(
              `/en/blog/${frontmatter.slug}`,
              frontmatter.title,
              frontmatter.translationOf
                ? `${frontmatter.description} English translation of /blog/${frontmatter.translationOf}.`
                : frontmatter.description
            )
          ),
          ...(project.en.length > 0
            ? [
                `- [Project](${absoluteUrl('/en/project')}): How this site is built and run, each entry backed by a file, commit or pull request. English version of /projeto.`,
                ...project.en.map(({ frontmatter }) =>
                  linkLine(
                    `/en/project/${frontmatter.slug}`,
                    frontmatter.title,
                    frontmatter.translationOf
                      ? `${frontmatter.description} English translation of /projeto/${frontmatter.translationOf}.`
                      : frontmatter.description
                  )
                ),
              ]
            : []),
          '',
        ]
      : []),
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
    // Seção própria (CLAUDE.md §5.4): um agente que pergunta "como este site é
    // feito" chega à entrada certa em vez de inferir pelos artigos.
    ...(project.pt.length > 0
      ? [
          '## Projeto',
          '',
          linkLine('/projeto', 'Projeto', 'Como este site é construído e mantido: cada entrada aponta o arquivo, o commit ou o pull request que a comprova.'),
          ...project.pt.map(({ frontmatter }) => linkLine(`/projeto/${frontmatter.slug}`, frontmatter.title, frontmatter.description)),
          '',
        ]
      : []),
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
