'use client'

import { useState } from 'react'
import { AlertTriangle, CheckCircle2, Loader2, Search, XCircle } from 'lucide-react'
import { pushEvent } from '@/lib/analytics'
import type { CheckStatus, MetaCheck } from '@/lib/meta-validator'

// ─────────────────────────────────────────────────────────────────────────────
// UI do Validador de meta tags (/ferramentas/validador-meta-tags).
//
// Mesmo split do JsonLdGenerator: a lógica vive em @/lib/meta-validator e roda
// no servidor (rota /api/validador-meta — CORS impede validar de dentro do
// navegador); aqui é só formulário, estados e apresentação. O único evento
// externo é tool_validate_meta com a CONTAGEM de problemas — nunca a URL
// validada (documentado em docs/measurement-plan.md).
// ─────────────────────────────────────────────────────────────────────────────

interface ValidationResponse {
  finalUrl: string
  httpStatus: number
  redirected: boolean
  meta: {
    title: string | null
    description: string | null
    ogTitle: string | null
    ogDescription: string | null
    ogImage: string | null
  }
  checks: MetaCheck[]
  issuesFound: number
}

const inputClass =
  // Borda --control (≥3:1, WCAG 1.4.11) e foco trocando a borda para o ciano.
  'w-full border border-gray-control bg-background px-3 py-2.5 text-sm text-foreground ' +
  'placeholder:text-label focus:border-primary focus:outline-none'

const statusIcon: Record<CheckStatus, typeof CheckCircle2> = {
  ok: CheckCircle2,
  warning: AlertTriangle,
  error: XCircle,
}

// Tokens do tema, nunca hex. Os três estados passam AA como texto sobre o
// cartão: ciano 9,87 · âmbar 7,64 · vermelho clareado 5,18 (design-tokens.test.ts).
const statusClass: Record<CheckStatus, string> = {
  ok: 'text-success',
  warning: 'text-warning',
  error: 'text-danger',
}

function SerpPreview({ data }: { data: ValidationResponse }) {
  const title = data.meta.title ?? data.meta.ogTitle ?? 'Página sem title'
  const description =
    data.meta.description ?? data.meta.ogDescription ?? 'Sem meta description — o Google montará um snippet por conta própria.'
  let host = ''
  let pathname = ''
  try {
    const u = new URL(data.finalUrl)
    host = u.hostname
    pathname = u.pathname === '/' ? '' : ` › ${u.pathname.split('/').filter(Boolean).join(' › ')}`
  } catch {
    host = data.finalUrl
  }

  return (
    <div className="border border-gray bg-background p-4">
      <p className="font-mono text-xs text-muted">
        {host}
        {pathname}
      </p>
      {/* Preview, não link: uma URL digitada pelo usuário não ganha <a> — e o
          truncamento espelha o comportamento da SERP. */}
      <p className="mt-1 truncate text-lg text-primary">{title}</p>
      <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted">{description}</p>
    </div>
  )
}

export function MetaValidator() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ValidationResponse | null>(null)

  async function validate() {
    const target = url.trim()
    if (!target) {
      setError('Informe uma URL para validar.')
      return
    }
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch(`/api/validador-meta?url=${encodeURIComponent(target)}`)
      const body = (await res.json()) as ValidationResponse & { error?: string }
      if (!res.ok || body.error) {
        setError(body.error ?? 'Não foi possível validar esta URL.')
        return
      }
      setResult(body)
      // Evento-chave da ferramenta (measurement-plan.md) — só a contagem,
      // nunca a URL.
      pushEvent({ event: 'tool_validate_meta', issues_found: body.issuesFound })
    } catch {
      setError('Falha de rede ao validar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const errors = result?.checks.filter((c) => c.status === 'error') ?? []
  const warnings = result?.checks.filter((c) => c.status === 'warning') ?? []

  return (
    <div className="mt-10 border border-gray bg-surface p-5 md:p-8">
      <form
        className="flex flex-col gap-3 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault()
          void validate()
        }}
      >
        <label className="flex-1">
          <span className="sr-only">URL da página para validar</span>
          <input
            type="text"
            inputMode="url"
            className={inputClass}
            placeholder="https://seusite.com.br/pagina"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={loading}
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex min-h-11 items-center justify-center gap-2 bg-primary-solid px-6 font-mono text-[0.8125rem] font-semibold uppercase tracking-[0.08em] text-on-primary transition-colors hover:bg-primary-solid-hover disabled:opacity-60"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Search className="h-4 w-4" aria-hidden="true" />
          )}
          {loading ? 'Validando…' : 'Validar'}
        </button>
      </form>

      {error && (
        <p role="alert" className="mt-4 border border-danger/60 bg-danger/10 px-4 py-3 text-sm text-foreground">
          {error}
        </p>
      )}

      {result && (
        <div className="mt-8 space-y-8">
          <div>
            <h2 className="font-display text-xl font-bold text-foreground">Preview na busca</h2>
            <p className="mt-1 text-sm text-muted">
              Como a página tende a aparecer na SERP do Google
              {result.redirected && (
                <> — a URL redirecionou para <code className="break-all">{result.finalUrl}</code></>
              )}
              .
            </p>
            <div className="mt-3">
              <SerpPreview data={result} />
            </div>
          </div>

          <div>
            <h2 className="font-display text-xl font-bold text-foreground">
              Checagens{' '}
              <span className="text-sm font-normal text-muted">
                — {errors.length} {errors.length === 1 ? 'erro' : 'erros'},{' '}
                {warnings.length} {warnings.length === 1 ? 'aviso' : 'avisos'}
              </span>
            </h2>
            <ul className="mt-3 divide-y divide-gray border border-gray">
              {result.checks.map((check) => {
                const Icon = statusIcon[check.status]
                return (
                  <li key={check.id} className="flex gap-3 px-4 py-3">
                    <Icon
                      className={`mt-0.5 h-5 w-5 shrink-0 ${statusClass[check.status]}`}
                      aria-label={
                        check.status === 'ok' ? 'ok' : check.status === 'warning' ? 'aviso' : 'erro'
                      }
                    />
                    <div>
                      <p className="text-sm font-medium text-foreground">{check.label}</p>
                      <p className="text-sm leading-6 text-muted">{check.detail}</p>
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
