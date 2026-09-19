import GithubSlugger from 'github-slugger'
import { STATIC_SEARCH_ITEMS } from '@/lib/search-data'

// ─────────────────────────────────────────────────────────────────────────────
// Dados derivados do corpo MDX no build — índice, tempo de leitura e a
// ferramenta que o artigo cita. Nada disso é escrito à mão no frontmatter:
// derivado não diverge do texto, e publicar um artigo continua exigindo um
// arquivo só (a mesma regra do `keywords`, CLAUDE.md §10).
//
// Funções puras sobre a string MDX (sem `fs`), testadas em
// content-derived.test.ts.
// ─────────────────────────────────────────────────────────────────────────────

export interface Heading {
  /** O mesmo id que o rehype-slug grava no <h2> — âncora do índice. */
  id: string
  text: string
}

export interface CitedTool {
  title: string
  href: string
}

/** Blocos cercados (```…```) e a linha de abertura/fechamento. */
const FENCE = /^(```|~~~)[\s\S]*?^\1\s*$/gm

function stripCode(mdx: string): string {
  return mdx.replace(FENCE, '')
}

/**
 * Texto visível de um heading markdown — o que o rehype-slug vai slugificar.
 *
 * Código inline é texto literal: `<script>` num heading aparece como
 * "<script>" e entra no slug. Só FORA dos backticks é que `<…>` é tag e some.
 */
function headingText(raw: string): string {
  return raw
    .split(/(`[^`]*`)/)
    .map((part) =>
      part.startsWith('`')
        ? part.slice(1, -1)
        : part
            .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1') // links e imagens
            .replace(/(\*\*|__|\*|_)(.*?)\1/g, '$2') // ênfase
            .replace(/<[^>]+>/g, '') // tags inline
    )
    .join('')
    .trim()
}

/**
 * Os h2 do artigo, com os ids que o rehype-slug gera.
 *
 * O slugger precisa ver TODOS os headings, na ordem, e não só os h2: o
 * rehype-slug desambigua duplicados ("exemplo", "exemplo-1") numa contagem
 * única do documento, e um h3 repetido antes de um h2 mudaria o id deste.
 */
export function extractHeadings(mdx: string): Heading[] {
  const slugger = new GithubSlugger()
  const headings: Heading[] = []

  for (const line of stripCode(mdx).split(/\r?\n/)) {
    const match = /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line)
    if (!match) continue
    const text = headingText(match[2])
    const id = slugger.slug(text)
    if (match[1].length === 2) headings.push({ id, text })
  }
  return headings
}

const WORDS_PER_MINUTE = 200

/**
 * Minutos de leitura do texto corrido. Código fica de fora: bloco de código
 * se consulta, não se lê em 200 palavras por minuto — contá-lo inflaria os
 * artigos mais técnicos, que são justamente os que mais têm.
 */
export function readingTime(mdx: string): number {
  const prose = stripCode(mdx)
    .replace(/<svg[\s\S]*?<\/svg>/g, ' ') // diagramas inline
    .replace(/<[^>]+>/g, ' ')
    .replace(/[#>*_`|[\]()-]/g, ' ')
  const words = prose.split(/\s+/).filter((w) => /\p{L}/u.test(w)).length
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE))
}

const TOOLS = STATIC_SEARCH_ITEMS.filter((item) => item.category === 'ferramenta')

/**
 * A primeira ferramenta do site que o artigo linka (§6: todo artigo linka ≥1
 * ferramenta). Vai para a margem do artigo como "Ferramenta citada".
 */
export function citedTool(mdx: string): CitedTool | undefined {
  const match = /(?:\]\(|href=["'])(\/ferramentas\/[a-z0-9-]+)/.exec(stripCode(mdx))
  if (!match) return undefined
  const tool = TOOLS.find((t) => t.href === match[1])
  return tool ? { title: tool.title, href: tool.href } : undefined
}
