import { controlCode, controlSlug, normalizeRound } from '@/lib/lab-probes'

// Endpoint do código `JS-` (docs/detection-experiment.md §4.6). Só é chamado
// pelo useEffect de FetchedCode, então uma requisição aqui prova que o JS da
// página rodou. Fora de /api/ de propósito: o matcher do proxy deixa passar
// este caminho, e o ai_crawler_hit registra quem executou o JavaScript.

export const dynamic = 'force-dynamic'

const HEADERS = {
  'Cache-Control': 'no-store',
  'X-Robots-Tag': 'noindex, nofollow',
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ probe: string }> }
): Promise<Response> {
  const slug = controlSlug()
  const { probe } = await params
  if (!slug || probe !== slug) return new Response('Not found', { status: 404, headers: HEADERS })

  const round = normalizeRound(new URL(request.url).searchParams.get('r') ?? undefined)
  return Response.json({ code: controlCode(slug, round, 'JS') }, { headers: HEADERS })
}
