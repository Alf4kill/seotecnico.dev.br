// ─────────────────────────────────────────────────────────────────────────────
// Negociação de conteúdo: quem pede Markdown (H14, docs/experiment-log.md).
//
// Etapa 1 do experimento: só MEDIR. O site continua servindo HTML para todo
// mundo; o proxy registra `accept_md` no `ai_crawler_hit` para saber se existe
// demanda antes de construir a etapa 2 (servir Markdown), que custa um
// renderizador MDX → Markdown, um teste de paridade HTML = Markdown e
// `Vary: Accept` no CDN.
//
// Conta só pedido EXPLÍCITO. `*/*` e `text/*` aceitam Markdown por tabela, mas
// quem os manda não está pedindo Markdown: contar esses pedidos mediria o
// curinga do cliente HTTP, não a demanda.
// ─────────────────────────────────────────────────────────────────────────────

/** Tipos que um cliente usa para pedir Markdown. `text/x-markdown` é o nome pré-RFC 7763. */
const MARKDOWN_TYPES = new Set(['text/markdown', 'text/x-markdown'])

/**
 * `true` quando o header `Accept` lista um tipo Markdown com qualidade > 0.
 *
 * `q=0` é recusa explícita (RFC 9110 §12.4.2): `text/markdown;q=0` significa
 * "tudo menos Markdown" e não pode contar como pedido.
 */
export function acceptsMarkdown(accept: string | null | undefined): boolean {
  if (!accept) return false
  return accept.split(',').some((range) => {
    const [type, ...params] = range.split(';').map((part) => part.trim().toLowerCase())
    if (!MARKDOWN_TYPES.has(type)) return false
    const q = params.find((p) => p.startsWith('q='))
    if (!q) return true
    const value = Number(q.slice(2))
    return Number.isFinite(value) && value > 0
  })
}
