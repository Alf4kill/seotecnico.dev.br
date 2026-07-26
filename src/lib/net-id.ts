import { ipToBigInt } from '@/lib/crawler-verification'

// ─────────────────────────────────────────────────────────────────────────────
// net_id — correlação sem identificação (docs/detection-experiment.md §2.3).
//
// Hash truncado e salgado da SUB-REDE (/24 em v4, /48 em v6), nunca do
// endereço completo. O sal deriva de SHA-256(segredo + "YYYY-MM"), então
// rotaciona todo mês com zero armazenamento: o mesmo cliente produz o mesmo
// net_id dentro do mês (o suficiente para ligar um hit de trap a um fetch de
// /robots.txt) e um net_id diferente no mês seguinte (o suficiente para o
// identificador não se acumular em nada durável).
//
// Fail-safe na mesma forma do sink do GA4: sem NET_ID_SALT_SECRET, retorna
// null e o parâmetro é simplesmente omitido do evento.
// ─────────────────────────────────────────────────────────────────────────────

const V4_PREFIX_BITS = 24n
const V6_PREFIX_BITS = 48n

export async function netId(
  ip: string | null | undefined,
  secret: string | undefined,
  now: Date = new Date()
): Promise<string | null> {
  if (!ip || !secret) return null

  const parsed = ipToBigInt(ip.trim())
  if (!parsed) return null

  // Normaliza via BigInt (não via string): "2001:DB8::" e "2001:db8:0::"
  // produzem o mesmo prefixo.
  const keep = parsed.size === 32 ? V4_PREFIX_BITS : V6_PREFIX_BITS
  const prefix = parsed.value >> (BigInt(parsed.size) - keep)
  const month = now.toISOString().slice(0, 7) // YYYY-MM, UTC

  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(`${secret}:${month}:v${parsed.size}:${prefix.toString(16)}`)
  )

  return Array.from(new Uint8Array(digest).slice(0, 5))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}
