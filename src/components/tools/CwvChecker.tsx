'use client'

import { useState } from 'react'
import { Gauge, Loader2, Smartphone, Monitor } from 'lucide-react'
import { pushEvent } from '@/lib/analytics'
import { formatMetric, type CruxReport, type MetricRating, type FormFactor } from '@/lib/crux'

// ─────────────────────────────────────────────────────────────────────────────
// UI do Checador de Core Web Vitals (/ferramentas/checador-cwv).
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

const inputClass =
  'w-full rounded-lg border border-gray bg-surface px-3 py-2 text-sm text-foreground ' +
  'placeholder:text-muted/60 focus:border-primary focus:outline-none'

// Tokens do tema, nunca hex (CLAUDE.md §9).
const ratingClass: Record<MetricRating, string> = {
  good: 'text-success',
  'needs-improvement': 'text-warning',
  poor: 'text-danger',
}

const ratingLabel: Record<MetricRating, string> = {
  good: 'Bom',
  'needs-improvement': 'Precisa melhorar',
  poor: 'Ruim',
}

const barClass: Record<MetricRating, string> = {
  good: 'bg-success',
  'needs-improvement': 'bg-warning',
  poor: 'bg-danger',
}

function MetricCard({ metric }: { metric: Report['metrics'][number] }) {
  const { distribution } = metric
  return (
    <li className="rounded-lg border border-gray bg-background p-4">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-semibold text-foreground">
          {metric.label}
          {metric.core && <span className="ml-2 text-xs font-normal text-muted">Core Web Vital</span>}
        </span>
        <span className={`text-lg font-bold ${ratingClass[metric.rating]}`}>
          {formatMetric(metric)}
        </span>
      </div>

      <p className={`mt-1 text-xs ${ratingClass[metric.rating]}`}>{ratingLabel[metric.rating]}</p>

      {/* Distribuição das visitas reais. O p75 sozinho esconde que um site
          "bom" pode ter um quarto dos usuários em "ruim". */}
      <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-gray/40">
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
        {distribution.good}% bom · {distribution.needsImprovement}% precisa melhorar ·{' '}
        {distribution.poor}% ruim
      </p>
    </li>
  )
}

export function CwvChecker() {
  const [origin, setOrigin] = useState('')
  const [formFactor, setFormFactor] = useState<FormFactor>('PHONE')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [report, setReport] = useState<Report | null>(null)

  async function check() {
    const target = origin.trim()
    if (!target) {
      setError('Informe um endereço para consultar.')
      return
    }
    setLoading(true)
    setError(null)
    setReport(null)
    try {
      const res = await fetch(
        `/api/checador-cwv?origin=${encodeURIComponent(target)}&formFactor=${formFactor}`
      )
      const body = (await res.json()) as Report & { error?: string }
      if (!res.ok || body.error) {
        setError(body.error ?? 'Não foi possível consultar esta origem.')
        return
      }
      setReport(body)
      // Evento-chave (measurement-plan.md): só a faixa do LCP, nunca a origem.
      // `no-data` é valor legítimo e o mais informativo deles.
      pushEvent({ event: 'tool_check_cwv', lcp_bucket: body.lcpBucket })
    } catch {
      setError('Falha de rede ao consultar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-10 rounded-2xl border border-gray bg-surface p-5 md:p-8">
      <form
        className="flex flex-col gap-3 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault()
          check()
        }}
      >
        <label className="sr-only" htmlFor="cwv-origin">
          Endereço do site
        </label>
        <input
          id="cwv-origin"
          className={inputClass}
          value={origin}
          onChange={(e) => setOrigin(e.target.value)}
          placeholder="exemplo.com.br"
          autoComplete="url"
          inputMode="url"
        />
        <button
          type="submit"
          disabled={loading}
          className="flex shrink-0 items-center justify-center gap-2 rounded-lg bg-primary-solid px-6 py-2.5 font-semibold text-white hover:bg-primary/90 disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Gauge className="h-4 w-4" />}
          {loading ? 'Consultando…' : 'Consultar'}
        </button>
      </form>

      <fieldset className="mt-4 flex items-center gap-2">
        <legend className="sr-only">Dispositivo</legend>
        {([
          ['PHONE', 'Celular', Smartphone],
          ['DESKTOP', 'Desktop', Monitor],
        ] as const).map(([value, label, Icon]) => (
          <button
            key={value}
            type="button"
            onClick={() => setFormFactor(value)}
            aria-pressed={formFactor === value}
            className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm ${
              formFactor === value
                ? 'border-primary text-primary'
                : 'border-gray text-muted hover:text-foreground'
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
        <div className="mt-6 rounded-lg border border-gray bg-background p-4">
          <p className="text-sm font-semibold text-foreground">
            Esta origem ainda não está no conjunto de dados do CrUX.
          </p>
          <p className="mt-2 text-sm leading-6 text-muted">
            Não é um erro nem um defeito do site: o CrUX só publica uma origem quando ela reúne
            visitantes suficientes na janela de 28 dias. Sites novos ou de baixo tráfego
            simplesmente não aparecem — e a ausência é um dado, não um veredito de performance.
            Para medir agora, use dados de laboratório (Lighthouse) ou instrumente RUM próprio.
          </p>
        </div>
      )}

      {report && report.inDataset && (
        <div className="mt-6">
          <p className="text-sm text-muted">
            Dados de campo de <span className="text-foreground">{report.origin}</span> ·{' '}
            {report.formFactor === 'PHONE' ? 'celular' : 'desktop'} · janela de{' '}
            {report.period.firstDate} a {report.period.lastDate}
          </p>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2">
            {report.metrics.map((metric) => (
              <MetricCard key={metric.id} metric={metric} />
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
