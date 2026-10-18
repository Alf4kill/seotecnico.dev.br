'use client'

import { useState } from 'react'
import { Gauge, Loader2, Smartphone, Monitor } from 'lucide-react'
import { pushEvent } from '@/lib/analytics'
import { formatMetric, type CruxReport, type MetricRating, type FormFactor } from '@/lib/crux'
import type { Lang } from '@/lib/hreflang'

// ─────────────────────────────────────────────────────────────────────────────
// UI do Checador de Core Web Vitals (/ferramentas/checador-cwv e
// /en/tools/cwv-checker).
//
// Mesmo split das outras duas ferramentas: limiares e leitura da resposta em
// @/lib/crux, a chave e as defesas de quota na rota /api/checador-cwv, e aqui
// só formulário, estado e apresentação. O único efeito externo é
// tool_check_cwv com o `lcp_bucket` — nunca a origem consultada
// (docs/measurement-plan.md).
//
// "Sem dados" é resposta de primeira classe, não erro: a maioria dos sites que
// alguém vai digitar aqui não tem tráfego suficiente para entrar no CrUX, e
// tratar isso como falha ensinaria a conclusão errada.
// ─────────────────────────────────────────────────────────────────────────────

type Report = CruxReport & { inDataset: boolean }

const COPY = {
  'pt-BR': {
    rating: { good: 'Bom', 'needs-improvement': 'Precisa melhorar', poor: 'Ruim' },
    distribution: (good: number, mid: number, poor: number) =>
      `${good}% bom · ${mid}% precisa melhorar · ${poor}% ruim`,
    empty: 'Informe um endereço para consultar.',
    failed: 'Não foi possível consultar esta origem.',
    network: 'Falha de rede ao consultar. Tente novamente.',
    inputLabel: 'Endereço do site',
    placeholder: 'exemplo.com.br',
    submit: 'Consultar',
    loading: 'Consultando…',
    device: 'Dispositivo',
    phone: 'Celular',
    desktop: 'Desktop',
    notInDatasetTitle: 'Esta origem ainda não está no conjunto de dados do CrUX.',
    notInDatasetBody:
      'Não é um erro nem um defeito do site: o CrUX só publica uma origem quando ela reúne visitantes suficientes na janela de 28 dias. Sites novos ou de baixo tráfego simplesmente não aparecem — e a ausência é um dado, não um veredito de performance. Para medir agora, use dados de laboratório (Lighthouse) ou instrumente RUM próprio.',
    fieldDataOf: 'Dados de campo de',
    phoneLower: 'celular',
    desktopLower: 'desktop',
    window: (first: string, last: string) => `janela de ${first} a ${last}`,
  },
  en: {
    rating: { good: 'Good', 'needs-improvement': 'Needs improvement', poor: 'Poor' },
    distribution: (good: number, mid: number, poor: number) =>
      `${good}% good · ${mid}% needs improvement · ${poor}% poor`,
    empty: 'Enter an address to check.',
    failed: 'This origin could not be checked.',
    network: 'Network error while checking. Try again.',
    inputLabel: 'Site address',
    placeholder: 'example.com',
    submit: 'Check',
    loading: 'Checking…',
    device: 'Device',
    phone: 'Phone',
    desktop: 'Desktop',
    notInDatasetTitle: 'This origin is not in the CrUX dataset yet.',
    notInDatasetBody:
      'It is neither an error nor a defect of the site: CrUX only publishes an origin once it gathers enough visitors in the 28-day window. New or low-traffic sites simply do not appear — and the absence is a data point, not a performance verdict. To measure now, use lab data (Lighthouse) or set up your own RUM.',
    fieldDataOf: 'Field data for',
    phoneLower: 'phone',
    desktopLower: 'desktop',
    window: (first: string, last: string) => `window from ${first} to ${last}`,
  },
} as const

const inputClass =
  // Borda --control (≥3:1, WCAG 1.4.11) e foco trocando a borda para o ciano.
  'w-full border border-gray-control bg-background px-3 py-2.5 text-sm text-foreground ' +
  'placeholder:text-label focus:border-primary focus:outline-none'

// Tokens do tema, nunca hex (CLAUDE.md §9).
const ratingClass: Record<MetricRating, string> = {
  good: 'text-success',
  'needs-improvement': 'text-warning',
  poor: 'text-danger',
}

const barClass: Record<MetricRating, string> = {
  good: 'bg-success',
  'needs-improvement': 'bg-warning',
  poor: 'bg-danger',
}

function MetricCard({ metric, lang }: { metric: Report['metrics'][number]; lang: Lang }) {
  const copy = COPY[lang]
  const { distribution } = metric
  return (
    <li className="border border-gray bg-background p-4">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-semibold text-foreground">
          {metric.label}
          {metric.core && <span className="ml-2 text-xs font-normal text-muted">Core Web Vital</span>}
        </span>
        <span className={`font-display text-xl font-bold ${ratingClass[metric.rating]}`}>
          {formatMetric(metric, lang)}
        </span>
      </div>

      <p className={`mt-1 text-xs ${ratingClass[metric.rating]}`}>{copy.rating[metric.rating]}</p>

      {/* Distribuição das visitas reais. O p75 sozinho esconde que um site
          "bom" pode ter um quarto dos usuários em "ruim". */}
      <div className="mt-3 flex h-2 overflow-hidden bg-gray">
        {(['good', 'needs-improvement', 'poor'] as const).map((band) => {
          const value =
            band === 'good'
              ? distribution.good
              : band === 'needs-improvement'
                ? distribution.needsImprovement
                : distribution.poor
          return value > 0 ? (
            <div key={band} className={barClass[band]} style={{ width: `${value}%` }} />
          ) : null
        })}
      </div>
      <p className="mt-2 text-xs text-muted">
        {copy.distribution(distribution.good, distribution.needsImprovement, distribution.poor)}
      </p>
    </li>
  )
}

export function CwvChecker({ lang = 'pt-BR' }: { lang?: Lang }) {
  const copy = COPY[lang]
  const [origin, setOrigin] = useState('')
  const [formFactor, setFormFactor] = useState<FormFactor>('PHONE')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [report, setReport] = useState<Report | null>(null)

  async function check() {
    const target = origin.trim()
    if (!target) {
      setError(copy.empty)
      return
    }
    setLoading(true)
    setError(null)
    setReport(null)
    try {
      const langParam = lang === 'en' ? '&lang=en' : ''
      const res = await fetch(
        `/api/checador-cwv?origin=${encodeURIComponent(target)}&formFactor=${formFactor}${langParam}`
      )
      const body = (await res.json()) as Report & { error?: string }
      if (!res.ok || body.error) {
        setError(body.error ?? copy.failed)
        return
      }
      setReport(body)
      // Evento-chave (measurement-plan.md): só a faixa do LCP, nunca a origem.
      // `no-data` é valor legítimo e o mais informativo deles.
      pushEvent({ event: 'tool_check_cwv', lcp_bucket: body.lcpBucket })
    } catch {
      setError(copy.network)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-10 border border-gray bg-surface p-5 md:p-8">
      <form
        className="flex flex-col gap-3 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault()
          check()
        }}
      >
        <label className="sr-only" htmlFor="cwv-origin">
          {copy.inputLabel}
        </label>
        <input
          id="cwv-origin"
          className={inputClass}
          value={origin}
          onChange={(e) => setOrigin(e.target.value)}
          placeholder={copy.placeholder}
          autoComplete="url"
          inputMode="url"
        />
        <button
          type="submit"
          disabled={loading}
          className="flex min-h-11 shrink-0 items-center justify-center gap-2 bg-primary-solid px-6 font-mono text-[0.8125rem] font-semibold uppercase tracking-[0.08em] text-on-primary transition-colors hover:bg-primary-solid-hover disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Gauge className="h-4 w-4" />}
          {loading ? copy.loading : copy.submit}
        </button>
      </form>

      <fieldset className="mt-4 flex items-center gap-2">
        <legend className="sr-only">{copy.device}</legend>
        {([
          ['PHONE', copy.phone, Smartphone],
          ['DESKTOP', copy.desktop, Monitor],
        ] as const).map(([value, label, Icon]) => (
          <button
            key={value}
            type="button"
            onClick={() => setFormFactor(value)}
            aria-pressed={formFactor === value}
            className={`flex items-center gap-2 border px-3 py-1.5 font-mono text-xs uppercase tracking-[0.08em] ${
              formFactor === value
                ? 'border-primary text-primary'
                : 'border-gray-control text-muted hover:text-foreground'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </fieldset>

      {error && (
        <p role="alert" className="mt-5 text-sm text-danger">
          {error}
        </p>
      )}

      {report && !report.inDataset && (
        <div className="mt-6 border border-gray bg-background p-4">
          <p className="text-sm font-semibold text-foreground">{copy.notInDatasetTitle}</p>
          <p className="mt-2 text-sm leading-6 text-muted">{copy.notInDatasetBody}</p>
        </div>
      )}

      {report && report.inDataset && (
        <div className="mt-6">
          <p className="text-sm text-muted">
            {copy.fieldDataOf} <span className="text-foreground">{report.origin}</span> ·{' '}
            {report.formFactor === 'PHONE' ? copy.phoneLower : copy.desktopLower} ·{' '}
            {copy.window(report.period.firstDate, report.period.lastDate)}
          </p>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2">
            {report.metrics.map((metric) => (
              <MetricCard key={metric.id} metric={metric} lang={lang} />
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
