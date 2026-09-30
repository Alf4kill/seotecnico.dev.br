import { createHmac, randomBytes } from 'node:crypto'

// ─────────────────────────────────────────────────────────────────────────────
// Sondas de laboratório com slug secreto (docs/detection-experiment.md §4.5,
// §4.6, §4.7). O controle positivo: a URL da H15 e, desde a H16, uma URL por
// assistente testado.
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

/**
 * Uma sonda por assistente testado (H16, §4.7; ChatGPT e Claude desde a H17,
 * §4.8), mais a do dono para o teste prévio. Para um agente que não se
 * declara, a URL é a única identidade que ele não escolhe: um hit na sonda do
 * Grok só pode vir de quem recebeu a URL do Grok, diga o user agent o que
 * disser. Acrescentar no FIM: a ordem é a do script de códigos.
 * `grok2` é a sonda do Grok na H17: a URL de `grok` chegou à OpenAI no
 * diagnóstico A (2026-09-30), e a sonda antiga continua no ar para a checagem
 * de revisitas.
 */
export const DERIVED_PROBES = ['gemini', 'deepseek', 'grok', 'owner', 'chatgpt', 'claude', 'grok2'] as const
export type ProbeName = 'h15' | (typeof DERIVED_PROBES)[number]

/**
 * `p-` + 24 hex de HMAC(slug, probe:<nome>). Sem o slug, não há como calcular
 * nem chutar; com ele, qualquer um calcula — por isso a rodada 2 começa
 * rotacionando um slug que já tinha circulado (docs/lab-control-rounds.md).
 */
export function probeSlug(base: string, name: (typeof DERIVED_PROBES)[number]): string {
  return `p-${createHmac('sha256', base).update(`probe:${name}`).digest('hex').slice(0, 24)}`
}

export interface ControlProbe {
  name: ProbeName
  /** O segmento da URL, e a chave dos códigos desta sonda. */
  slug: string
}

/** O segmento de /lab/[probe] → a sonda, ou null (a rota responde 404). */
export function resolveProbe(segment: string, base: string | null = controlSlug()): ControlProbe | null {
  if (!base) return null
  if (segment === base) return { name: 'h15', slug: base }
  const name = DERIVED_PROBES.find((n) => probeSlug(base, n) === segment)
  return name ? { name, slug: segment } : null
}

/** A sonda e o endpoint de um caminho do controle, ou null fora dele. */
export function controlProbeForPath(
  pathname: string,
  base: string | null = controlSlug()
): (ControlProbe & { endpoint: 'page' | 'js' }) | null {
  const match = /^\/lab\/([^/]+)(\/c)?$/.exec(pathname)
  if (!match) return null
  const probe = resolveProbe(match[1], base)
  return probe && { ...probe, endpoint: match[2] ? 'js' : 'page' }
}

/** Se o caminho pertence ao controle — o proxy usa para mandar o X-Robots-Tag. */
export function isControlPath(pathname: string, base: string | null = controlSlug()): boolean {
  return controlProbeForPath(pathname, base) !== null
}

/** O GA4 corta valor de parâmetro em 100 caracteres. */
const GA4_VALUE_MAX = 100

function clip(value: string | null, from = 0): string {
  const text = value?.slice(from, from + GA4_VALUE_MAX) ?? ''
  return text || '(none)'
}

/**
 * `lab_hit`: chave de uma requisição, `2026-09-28T14:05:09Z-a3f9`. O GA4 não
 * tem chave de linha, então sem isto duas tabelas do Explore não dizem quais
 * linhas são o mesmo hit; e o Explore não desce abaixo da hora, então o
 * segundo vem aqui. Hora + 4 hex aleatórios, nada tirado da requisição:
 * identifica o hit, nunca quem o fez (docs/measurement-plan.md).
 */
export function labHitId(now: number = Date.now(), random: () => string = () => randomBytes(2).toString('hex')): string {
  return `${new Date(now).toISOString().slice(0, 19)}Z-${random()}`
}

/**
 * Os parâmetros `lab_*` do `ai_crawler_hit` numa sonda (H16, §4.7;
 * docs/measurement-plan.md). Cabeçalhos brutos, e SÓ aqui: estas URLs são
 * secretas e só os assistentes testados e o dono as recebem, então os
 * cabeçalhos descrevem o fetcher de um fornecedor, não um visitante (§2.3).
 * `ipOwner` chega pronto: é a única parte que faz rede.
 */
export function labHitParams(
  probe: ControlProbe & { endpoint: 'page' | 'js' },
  url: URL,
  headers: Headers,
  ipOwner: string,
  hitId: string = labHitId()
): Record<string, string> {
  const ua = headers.get('user-agent')
  return {
    lab_hit: hitId,
    lab_probe: probe.name,
    lab_round: normalizeRound(url.searchParams.get('r') ?? undefined),
    lab_endpoint: probe.endpoint,
    lab_ua_1: clip(ua),
    // Um user agent de Chrome passa de 100 caracteres; o resto vai aqui.
    ...(ua && ua.length > GA4_VALUE_MAX && { lab_ua_2: clip(ua, GA4_VALUE_MAX) }),
    lab_accept: clip(headers.get('accept')),
    lab_accept_lang: clip(headers.get('accept-language')),
    lab_ip_owner: ipOwner,
    lab_country: clip(headers.get('x-vercel-ip-country')),
    lab_fetch_mode: fetchMode(headers),
  }
}

/**
 * `Sec-Fetch-Mode/Sec-Fetch-Dest` (H17, §4.8): o `fetch()` do script da
 * página chega como `cors/empty`; uma ferramenta que abre a URL do `/c`
 * direto chega como `navigate/document` ou sem nenhum dos dois.
 */
function fetchMode(headers: Headers): string {
  const mode = headers.get('sec-fetch-mode')
  const dest = headers.get('sec-fetch-dest')
  if (!mode && !dest) return '(none)'
  return clip(`${mode || '-'}/${dest || '-'}`)
}
