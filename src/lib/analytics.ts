// ─────────────────────────────────────────────────────────────────────────────
// Typed dataLayer helper — the ONLY way custom events are pushed on this site.
// Never call window.dataLayer.push directly from components (CLAUDE.md §7.2).
//
// Every event here MUST be documented in /docs/measurement-plan.md BEFORE
// being implemented.
// ─────────────────────────────────────────────────────────────────────────────

declare global {
  interface Window {
    dataLayer?: unknown[]
  }
}

/** Custom events documented in docs/measurement-plan.md */
export type AnalyticsEvent =
  | { event: 'tool_generate_jsonld'; schema_type: string }
  | { event: 'tool_validate_meta'; issues_found: number }
  | { event: 'tool_check_cwv'; lcp_bucket: 'good' | 'needs-improvement' | 'poor' | 'no-data' }
  | { event: 'article_read'; article_slug: string }
  | { event: 'outbound_click'; link_domain: string }

export function pushEvent(e: AnalyticsEvent): void {
  if (typeof window === 'undefined') return
  window.dataLayer = window.dataLayer ?? []
  window.dataLayer.push(e)
}

// ─────────────────────────────────────────────────────────────────────────────
// Consent Mode v2 (LGPD)
//
// O default "denied" é definido por um script inline ANTES do GTM carregar
// (ver app/layout.tsx). Aqui ficam apenas a atualização de consentimento e a
// persistência da escolha do usuário.
// ─────────────────────────────────────────────────────────────────────────────

export const CONSENT_STORAGE_KEY = 'seotecnico:consent-analytics'

export type ConsentChoice = 'granted' | 'denied'

/**
 * Empurra um comando gtag('consent', ...) para o dataLayer.
 * IMPORTANTE: os comandos de consent precisam ser enviados como objeto
 * `arguments` (não array) — por isso a function declaration, não arrow.
 */
function gtag(...args: unknown[]): void {
  void args // parâmetros tipados para os call sites; o GTM lê `arguments`
  window.dataLayer = window.dataLayer ?? []
  // eslint-disable-next-line prefer-rest-params
  window.dataLayer.push(arguments)
}

/** Aplica a escolha do usuário (banner ou escolha salva de visita anterior). */
export function applyConsent(choice: ConsentChoice): void {
  if (typeof window === 'undefined') return
  gtag('consent', 'update', { analytics_storage: choice })
}

// ── Store mínimo para useSyncExternalStore (ConsentBanner) ──────────────────
const consentListeners = new Set<() => void>()

/** Assina mudanças de consentimento feitas nesta aba (saveConsent notifica). */
export function subscribeConsent(cb: () => void): () => void {
  consentListeners.add(cb)
  return () => {
    consentListeners.delete(cb)
  }
}

export function saveConsent(choice: ConsentChoice): void {
  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, choice)
  } catch {
    // localStorage indisponível (modo privado etc.) — segue sem persistir
  }
  consentListeners.forEach((cb) => cb())
}

export function getSavedConsent(): ConsentChoice | null {
  try {
    const v = localStorage.getItem(CONSENT_STORAGE_KEY)
    return v === 'granted' || v === 'denied' ? v : null
  } catch {
    return null
  }
}
