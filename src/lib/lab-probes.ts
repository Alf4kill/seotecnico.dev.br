import { createHmac } from 'node:crypto'

// ─────────────────────────────────────────────────────────────────────────────
// Sondas de laboratório com slug secreto (docs/detection-experiment.md §4.5,
// §4.6). Hoje só o controle positivo da H15.
//
// O slug vive SÓ em variável de ambiente: o repositório é público e os
// assistentes testados buscam no GitHub. Um slug ou um código num arquivo
// versionado deixaria o assistante responder a rodada pelo GitHub, sem ler a
// página, e a rodada mediria busca em vez de leitura. Pelo mesmo motivo os
// códigos são derivados na hora, HMAC(slug, rodada:tipo): sem o segredo, não
// há como calculá-los nem chutá-los.
//
// Fail-safe na forma de SITE_INDEXABLE: sem a variável, a rota responde 404
// para qualquer segmento e nenhuma superfície muda.
//
// Só servidor (node:crypto). O Client Component recebe o endpoint pronto.
// scripts/lab-control-codes.mjs repete o algoritmo para o dono imprimir os
// códigos esperados; lab-probes.test.ts falha se os dois divergirem.
// ─────────────────────────────────────────────────────────────────────────────

/** Um código por caminho de renderização (tabela em §4.6). */
export const CONTROL_KINDS = ['SRV', 'UC', 'LD', 'JS'] as const
export type ControlKind = (typeof CONTROL_KINDS)[number]

/** Longo o bastante para não ser chutado; só o que cabe numa URL sem escape. */
const SLUG_PATTERN = /^[a-z0-9-]{16,64}$/

/** Crockford base32: sem I, L, O, U, para o código sobreviver a quem o redigita. */
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'

/** O slug do controle, ou null quando ausente ou fraco demais para ser segredo. */
export function controlSlug(env: Record<string, string | undefined> = process.env): string | null {
  const slug = env.LAB_PROBE_CONTROL_SLUG?.trim()
  return slug && SLUG_PATTERN.test(slug) ? slug : null
}

/** Rodada `?r=`: 1 a 3 dígitos, normalizada para dois (`7` → `07`). Fora disso, `00`. */
export function normalizeRound(raw: string | string[] | undefined): string {
  const value = Array.isArray(raw) ? raw[0] : raw
  return value && /^\d{1,3}$/.test(value) ? value.padStart(2, '0') : '00'
}

/** `SRV-7F3K-2Q9M`: 40 bits do HMAC em 8 caracteres base32, partidos em dois. */
export function controlCode(slug: string, round: string, kind: ControlKind): string {
  const digest = createHmac('sha256', slug).update(`${round}:${kind}`).digest()
  let bits = 0n
  for (const byte of digest.subarray(0, 5)) bits = (bits << 8n) | BigInt(byte)
  let chars = ''
  for (let i = 7; i >= 0; i--) chars += ALPHABET[Number((bits >> BigInt(i * 5)) & 31n)]
  return `${kind}-${chars.slice(0, 4)}-${chars.slice(4)}`
}

/** A página e o endpoint do `JS-`. Ambos ficam sob /lab/<slug>, excluídos por caminho. */
export function controlPaths(slug: string) {
  return { page: `/lab/${slug}`, js: `/lab/${slug}/c` }
}

/** Se o caminho pertence ao controle — o proxy usa para mandar o X-Robots-Tag. */
export function isControlPath(pathname: string, slug: string | null = controlSlug()): boolean {
  if (!slug) return false
  const { page, js } = controlPaths(slug)
  return pathname === page || pathname === js
}
