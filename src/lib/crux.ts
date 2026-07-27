// ─────────────────────────────────────────────────────────────────────────────
// Checador de Core Web Vitals (/ferramentas/checador-cwv) — a lógica pura.
//
// Mesmo split das outras duas ferramentas: normalização, limiares e leitura da
// resposta ficam aqui (testados sem rede); a chamada à API do CrUX, a chave e
// as defesas de quota ficam na rota; a apresentação no client component.
//
// Diferença importante em relação ao validador de meta tags: esta ferramenta
// NUNCA busca a URL do usuário. Ela pergunta ao Google sobre ela. Não há SSRF
// a defender aqui — o alvo do fetch é sempre chromeuxreport.googleapis.com.
// O que precisa de defesa é a QUOTA, que é finita e compartilhada.
//
// Dado de CAMPO, não de laboratório: é o p75 de usuários reais nos últimos 28
// dias. É por isso que os limiares abaixo são os publicados pelo Google
// (2,5s / 200ms / 0,1) e não os orçamentos mais rígidos que este repo impõe ao
// próprio build (CLAUDE.md §6) — comparar campo com orçamento de lab seria
// ensinar o número errado.
// ─────────────────────────────────────────────────────────────────────────────

export type MetricRating = 'good' | 'needs-improvement' | 'poor'
export type LcpBucket = MetricRating | 'no-data'
export type FormFactor = 'PHONE' | 'DESKTOP'

export type MetricId = 'lcp' | 'inp' | 'cls' | 'fcp' | 'ttfb'

interface MetricSpec {
  id: MetricId
  /** Chave na resposta da API do CrUX. */
  apiKey: string
  label: string
  unit: 'ms' | 'score'
  /** Limite superior de "good" e limite inferior de "poor" (Google, campo). */
  goodMax: number
  poorMin: number
  /** Core Web Vital (entra no ranking) ou métrica de apoio. */
  core: boolean
}

export const METRIC_SPECS: MetricSpec[] = [
  { id: 'lcp',  apiKey: 'largest_contentful_paint',      label: 'LCP',  unit: 'ms',    goodMax: 2500, poorMin: 4000, core: true  },
  { id: 'inp',  apiKey: 'interaction_to_next_paint',     label: 'INP',  unit: 'ms',    goodMax: 200,  poorMin: 500,  core: true  },
  { id: 'cls',  apiKey: 'cumulative_layout_shift',       label: 'CLS',  unit: 'score', goodMax: 0.1,  poorMin: 0.25, core: true  },
  { id: 'fcp',  apiKey: 'first_contentful_paint',        label: 'FCP',  unit: 'ms',    goodMax: 1800, poorMin: 3000, core: false },
  { id: 'ttfb', apiKey: 'experimental_time_to_first_byte', label: 'TTFB', unit: 'ms',  goodMax: 800,  poorMin: 1800, core: false },
]

export function rate(spec: MetricSpec, p75: number): MetricRating {
  if (p75 <= spec.goodMax) return 'good'
  if (p75 < spec.poorMin) return 'needs-improvement'
  return 'poor'
}

/* ------------------------------------------------------------------ *
 * Entrada
 * ------------------------------------------------------------------ */

export type ParsedOrigin = { ok: true; origin: string } | { ok: false; error: string }

/**
 * Normaliza o que o usuário digitou para uma ORIGEM no formato que o CrUX
 * espera (`https://host` ou `https://host:porta`, sem caminho).
 *
 * `www.` NUNCA é removido: para o CrUX `https://exemplo.com` e
 * `https://www.exemplo.com` são origens diferentes, com conjuntos de dados
 * diferentes. "Ajudar" o usuário aqui devolveria dado de outro site.
 */
export function parseOrigin(raw: string): ParsedOrigin {
  const trimmed = raw.trim()
  if (!trimmed) return { ok: false, error: 'Informe um endereço para consultar.' }

  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`

  let url: URL
  try {
    url = new URL(withScheme)
  } catch {
    return { ok: false, error: 'Endereço inválido. Exemplo: exemplo.com.br' }
  }

  if (url.username || url.password) {
    return { ok: false, error: 'Remova usuário e senha do endereço.' }
  }
  // Sem ponto no host é `localhost` ou nome de rede interna: o CrUX nunca terá
  // dado, e a consulta só gastaria quota para devolver "não encontrado".
  if (!url.hostname.includes('.') || url.hostname.endsWith('.localhost')) {
    return { ok: false, error: 'O CrUX só tem dados de sites públicos na internet.' }
  }

  return { ok: true, origin: url.port ? `${url.protocol}//${url.hostname}:${url.port}` : `${url.protocol}//${url.hostname}` }
}

/* ------------------------------------------------------------------ *
 * Resposta
 * ------------------------------------------------------------------ */

export interface MetricResult {
  id: MetricId
  label: string
  unit: 'ms' | 'score'
  core: boolean
  p75: number
  rating: MetricRating
  goodMax: number
  poorMin: number
  /** Fatia de visitas em cada faixa, em % (soma ~100). */
  distribution: { good: number; needsImprovement: number; poor: number }
}

export interface CruxReport {
  origin: string
  formFactor: FormFactor
  /** Janela de 28 dias, em ISO (YYYY-MM-DD). */
  period: { firstDate: string; lastDate: string }
  metrics: MetricResult[]
  lcpBucket: LcpBucket
}

interface RawDate {
  year: number
  month: number
  day: number
}

const iso = (d: RawDate | undefined): string =>
  d ? `${d.year}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}` : ''

/** O p75 chega como número (ms) ou string (CLS). */
const toNumber = (value: unknown): number | null => {
  const n = typeof value === 'string' ? Number(value) : typeof value === 'number' ? value : NaN
  return Number.isFinite(n) ? n : null
}

const pct = (density: unknown): number => Math.round((toNumber(density) ?? 0) * 1000) / 10

interface RawMetric {
  percentiles?: { p75?: unknown }
  histogram?: { density?: unknown }[]
}

interface RawRecord {
  record?: {
    key?: { formFactor?: string }
    metrics?: Record<string, RawMetric>
    collectionPeriod?: { firstDate?: RawDate; lastDate?: RawDate }
  }
}

/**
 * Converte a resposta da API no relatório que a UI consome. Métrica ausente é
 * omitida em vez de virar zero: o CrUX às vezes tem LCP e não tem INP para a
 * mesma origem, e um zero seria lido como "perfeito".
 */
export function parseCruxReport(
  payload: unknown,
  origin: string,
  formFactor: FormFactor
): CruxReport {
  const record = (payload as RawRecord)?.record
  const rawMetrics = record?.metrics ?? {}

  const metrics: MetricResult[] = []
  for (const spec of METRIC_SPECS) {
    const raw = rawMetrics[spec.apiKey]
    const p75 = toNumber(raw?.percentiles?.p75)
    if (p75 === null) continue

    const [good, needsImprovement, poor] = [0, 1, 2].map((i) => pct(raw?.histogram?.[i]?.density))
    metrics.push({
      id: spec.id,
      label: spec.label,
      unit: spec.unit,
      core: spec.core,
      p75,
      rating: rate(spec, p75),
      goodMax: spec.goodMax,
      poorMin: spec.poorMin,
      distribution: { good, needsImprovement, poor },
    })
  }

  const lcp = metrics.find((m) => m.id === 'lcp')

  return {
    origin,
    formFactor,
    period: {
      firstDate: iso(record?.collectionPeriod?.firstDate),
      lastDate: iso(record?.collectionPeriod?.lastDate),
    },
    metrics,
    // Parâmetro do evento-chave `tool_check_cwv` (docs/measurement-plan.md).
    // `no-data` é resultado legítimo e o mais comum em site novo — medir com
    // que frequência acontece é metade do valor da ferramenta.
    lcpBucket: lcp ? lcp.rating : 'no-data',
  }
}

/** Formata o p75 para leitura humana: ms viram segundos acima de 1s; CLS não tem unidade. */
export function formatMetric(metric: MetricResult): string {
  if (metric.unit === 'score') return metric.p75.toFixed(2).replace('.', ',')
  if (metric.p75 >= 1000) return `${(metric.p75 / 1000).toFixed(2).replace('.', ',')} s`
  return `${Math.round(metric.p75)} ms`
}
