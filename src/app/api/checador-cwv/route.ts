import { NextResponse, type NextRequest } from 'next/server'
import { parseCruxReport, parseOrigin, type FormFactor } from '@/lib/crux'
import { clientKey, createDailyBudget, createFixedWindow } from '@/lib/rate-limit'
import type { Lang } from '@/lib/hreflang'
import { site } from '@/lib/site'

// ─────────────────────────────────────────────────────────────────────────────
// Backend do checador de CWV: consulta a API do Chrome UX Report.
//
// A chave (`CRUX_API_KEY`) é lida SÓ aqui. Nunca `NEXT_PUBLIC_`: uma chave com
// esse prefixo é embutida no bundle do cliente e fica extraível por qualquer
// visitante — e a quota é de quem publicou, não de quem gastou. Como reforço,
// a chave deve estar restrita à Chrome UX Report API no Cloud Console; uma
// chave irrestrita alcança toda API habilitada no mesmo projeto.
//
// Diferente do validador de meta tags, esta rota não busca a URL do usuário —
// ela pergunta ao Google sobre ela. O destino do fetch é sempre o mesmo host,
// então não há SSRF a defender. O ativo a proteger é a QUOTA:
//
//   - cache de borda de 6h por origem+dispositivo. O CrUX atualiza uma vez por
//     dia e a janela é de 28 dias: consultar de novo em 5 minutos devolveria o
//     mesmo número. Repetição vira HIT na Vercel e não chega ao Google;
//   - janela por chamador (10/min) contra o laço trivial;
//   - orçamento diário global como disjuntor: uma rajada não pode deixar a
//     ferramenta fora do ar para todo mundo até o dia seguinte;
//   - checagem de `Origin`/`Referer`, porque esta rota existe para a página do
//     site. Sem CAPTCHA: §5.3 exige ferramenta sem fricção e sem login.
//
// Sem armazenamento: a origem consultada não é logada nem persistida.
//
// `?lang=en` (a página /en/tools/cwv-checker) troca o idioma das mensagens de
// erro; a resposta de sucesso não tem texto e é a mesma nos dois idiomas. O
// parâmetro entra na chave do cache de borda, então a mesma origem consultada
// nos dois idiomas custa duas consultas ao CrUX em vez de uma — custo aceito
// diante do volume da página inglesa, em troca de uma rota sem estado oculto.
// ─────────────────────────────────────────────────────────────────────────────

const CRUX_ENDPOINT = 'https://chromeuxreport.googleapis.com/v1/records:queryRecord'
const TIMEOUT_MS = 8_000

/** 6h: o CrUX publica uma vez por dia, então nada se perde. */
const EDGE_MAX_AGE = 21_600
const STALE_WHILE_REVALIDATE = 86_400

const perCaller = createFixedWindow({ windowMs: 60_000, max: 10 })
const dailyBudget = createDailyBudget(2_000)

const ERRORS = {
  'pt-BR': {
    unavailable: 'O checador está temporariamente indisponível.',
    forbidden: 'Requisição não autorizada.',
    rateLimited: 'Muitas consultas seguidas. Espere um minuto e tente de novo.',
    dailyLimit: 'O limite diário de consultas desta ferramenta foi atingido. Tente amanhã.',
    cruxFailed: 'Não foi possível consultar o CrUX agora. Tente de novo em instantes.',
    unexpected: 'Resposta inesperada do CrUX.',
  },
  en: {
    unavailable: 'The checker is temporarily unavailable.',
    forbidden: 'Request not authorized.',
    rateLimited: 'Too many checks in a row. Wait a minute and try again.',
    dailyLimit: "This tool's daily query limit has been reached. Try again tomorrow.",
    cruxFailed: 'CrUX could not be queried right now. Try again in a moment.',
    unexpected: 'Unexpected response from CrUX.',
  },
} as const

function fail(error: string, status: number): NextResponse {
  // Erro nunca é cacheado na borda: um 429 de um chamador não pode virar a
  // resposta dos próximos.
  return NextResponse.json({ error }, { status, headers: { 'Cache-Control': 'no-store' } })
}

/**
 * Aceita apenas chamadas vindas do próprio site. Requisição sem `Origin` nem
 * `Referer` passa: navegação direta e alguns proxies os omitem, e barrar isso
 * quebraria usuários reais sem deter ninguém — quem abusa manda o header que
 * quiser.
 */
function fromThisSite(request: NextRequest): boolean {
  const origin = request.headers.get('origin') ?? request.headers.get('referer')
  if (!origin) return true
  try {
    return new URL(origin).host === new URL(site.url).host || new URL(origin).hostname === 'localhost'
  } catch {
    return false
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const lang: Lang = request.nextUrl.searchParams.get('lang') === 'en' ? 'en' : 'pt-BR'
  const copy = ERRORS[lang]

  const key = process.env.CRUX_API_KEY
  if (!key) {
    // Mesmo fail-safe do resto do site: sem configuração, a ferramenta diz que
    // está indisponível em vez de fingir que a origem não tem dados.
    return fail(copy.unavailable, 503)
  }

  if (!fromThisSite(request)) return fail(copy.forbidden, 403)

  if (perCaller.hit(clientKey(request))) {
    return fail(copy.rateLimited, 429)
  }

  const parsed = parseOrigin(request.nextUrl.searchParams.get('origin') ?? '', lang)
  if (!parsed.ok) return fail(parsed.error, 400)

  const formFactor: FormFactor =
    request.nextUrl.searchParams.get('formFactor') === 'DESKTOP' ? 'DESKTOP' : 'PHONE'

  if (!dailyBudget.spend()) {
    return fail(copy.dailyLimit, 503)
  }

  let response: Response
  try {
    response = await fetch(`${CRUX_ENDPOINT}?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ origin: parsed.origin, formFactor }),
      cache: 'no-store',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
  } catch {
    return fail(copy.cruxFailed, 502)
  }

  // 404 é resposta legítima e o caso mais comum: a origem não tem visitas
  // suficientes na janela de 28 dias para entrar no conjunto. Não é erro do
  // usuário, e é dado — por isso volta 200, com cache, e alimenta o
  // `lcp_bucket: no-data` do evento-chave.
  if (response.status === 404) {
    return NextResponse.json(
      { ...parseCruxReport({}, parsed.origin, formFactor), inDataset: false },
      { headers: { 'Cache-Control': `public, s-maxage=${EDGE_MAX_AGE}, stale-while-revalidate=${STALE_WHILE_REVALIDATE}` } }
    )
  }

  if (!response.ok) {
    // 403/429 aqui é quota ou chave — problema do dono do site, não de quem
    // consulta, e a mensagem não deve expor qual dos dois.
    return fail(copy.cruxFailed, 502)
  }

  const payload = await response.json().catch(() => null)
  if (!payload) return fail(copy.unexpected, 502)

  return NextResponse.json(
    { ...parseCruxReport(payload, parsed.origin, formFactor), inDataset: true },
    { headers: { 'Cache-Control': `public, s-maxage=${EDGE_MAX_AGE}, stale-while-revalidate=${STALE_WHILE_REVALIDATE}` } }
  )
}
