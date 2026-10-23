import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import type { Reporter, TestCase, TestResult } from '@playwright/test/reporter'
import type { A11yResult, ContrastNode } from './seo/a11y.spec'

// ─────────────────────────────────────────────────────────────────────────────
// Reporter do aviso de contraste (tests/seo/a11y.spec.ts).
//
// Junta o anexo `a11y-result` de cada teste do axe e escreve:
//  - test-results/a11y-results.json: tudo, para contar antes/depois;
//  - test-results/a11y-report.md: violações por regra e impacto, e os avisos
//    de contraste agrupados por PAR de cores — um par de tokens costuma
//    explicar dezenas de nós, e é sobre o par que a decisão de design se toma;
//  - no GitHub Actions, o mesmo markdown no resumo do job e uma anotação
//    ::warning:: por par (o GitHub corta anotações em excesso; por nó seria
//    ruído).
//
// Nunca falha a execução: quem bloqueia é o próprio teste, para as regras que
// não são aviso.
// ─────────────────────────────────────────────────────────────────────────────

const JSON_PATH = 'test-results/a11y-results.json'
const MD_PATH = 'test-results/a11y-report.md'

interface Pair {
  scheme: string
  fg: string
  bg: string
  ratio: number
  required: number
  nodes: number
  routes: Set<string>
  example: ContrastNode
}

export default class A11yReporter implements Reporter {
  // Chave = id do teste: numa repetição (retries no CI) vale a última tentativa.
  private results = new Map<string, A11yResult>()

  onTestEnd(test: TestCase, result: TestResult) {
    const attachment = result.attachments.find((a) => a.name === 'a11y-result')
    if (!attachment?.body) return
    this.results.set(test.id, JSON.parse(attachment.body.toString()) as A11yResult)
  }

  onEnd() {
    if (this.results.size === 0) return
    const results = [...this.results.values()].sort((a, b) =>
      `${a.scheme}${a.route}${a.state}`.localeCompare(`${b.scheme}${b.route}${b.state}`)
    )
    const md = render(results)

    mkdirSync(dirname(JSON_PATH), { recursive: true })
    writeFileSync(JSON_PATH, JSON.stringify(results, null, 2))
    writeFileSync(MD_PATH, md)
    if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${md}\n`)

    const pairs = contrastPairs(results)
    if (process.env.GITHUB_ACTIONS) {
      for (const p of pairs) {
        console.log(
          `::warning title=Contraste abaixo de AA (aviso)::${p.fg} sobre ${p.bg} (${p.scheme}) = ` +
            `${p.ratio}:1, exigido ${p.required}:1 — ${p.nodes} nó(s) em ${p.routes.size} rota(s). ` +
            `Exemplo: ${p.example.selector}`
        )
      }
    }
    console.log(
      `\naxe: ${results.length} auditorias · ${pairs.length} par(es) de cor em aviso · relatório em ${MD_PATH}`
    )
  }
}

function contrastPairs(results: A11yResult[]): Pair[] {
  const pairs = new Map<string, Pair>()
  for (const r of results) {
    for (const node of r.contrast) {
      const key = `${r.scheme}|${node.fg}|${node.bg}|${node.required}`
      const pair = pairs.get(key) ?? {
        scheme: r.scheme,
        fg: node.fg,
        bg: node.bg,
        ratio: node.ratio,
        required: node.required,
        nodes: 0,
        routes: new Set<string>(),
        example: node,
      }
      pair.nodes += 1
      pair.routes.add(r.route)
      pair.ratio = Math.min(pair.ratio, node.ratio)
      pairs.set(key, pair)
    }
  }
  return [...pairs.values()].sort((a, b) => a.ratio - b.ratio)
}

function render(results: A11yResult[]): string {
  const blocking = new Map<string, { impact: string; nodes: number; audits: number; help: string }>()
  for (const r of results) {
    for (const v of r.violations.filter((v) => !v.warnOnly)) {
      const row = blocking.get(v.id) ?? { impact: v.impact ?? '?', nodes: 0, audits: 0, help: v.help }
      row.nodes += v.nodes
      row.audits += 1
      blocking.set(v.id, row)
    }
  }
  const pairs = contrastPairs(results)
  const contrastNodes = results.reduce((n, r) => n + r.contrast.length, 0)
  const incomplete = results.reduce((n, r) => n + r.contrastIncomplete, 0)

  const lines = [
    '## Acessibilidade (axe, WCAG 2.0/2.1 A e AA)',
    '',
    `${results.length} auditorias (rotas × temas, mais as ferramentas com resultado).`,
    '',
    '### Violações bloqueantes',
    '',
  ]
  if (blocking.size === 0) {
    lines.push('Nenhuma.')
  } else {
    lines.push('| Regra | Impacto | Nós | Auditorias | O que é |', '|---|---|---|---|---|')
    for (const [id, row] of [...blocking].sort((a, b) => b[1].nodes - a[1].nodes)) {
      lines.push(`| \`${id}\` | ${row.impact} | ${row.nodes} | ${row.audits} | ${row.help} |`)
    }
  }

  lines.push(
    '',
    '### Contraste — aviso, não bloqueia',
    '',
    'A decisão de trocar uma cor é do dono do design. O portão bloqueante de contraste por papel de cor ' +
      'continua em `tests/seo/contrast.spec.ts`.',
    '',
    `${contrastNodes} nó(s) abaixo do exigido, em ${pairs.length} par(es) de cor. ` +
      `${incomplete} nó(s) que o axe não conseguiu decidir (fundo em imagem ou sobreposto) ficam para revisão manual.`,
    ''
  )
  if (pairs.length > 0) {
    lines.push(
      '| Tema | Texto | Fundo | Razão (pior) | Exigido | Nós | Rotas | Exemplo |',
      '|---|---|---|---|---|---|---|---|'
    )
    for (const p of pairs) {
      const example = p.example.html.replace(/\|/g, '\\|').replace(/\s+/g, ' ')
      lines.push(
        `| ${p.scheme} | \`${p.fg}\` | \`${p.bg}\` | ${p.ratio}:1 | ${p.required}:1 | ${p.nodes} | ${p.routes.size} | \`${example}\` |`
      )
    }
  }
  return `${lines.join('\n')}\n`
}
