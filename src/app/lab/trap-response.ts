import type { TrapChannel } from '@/lib/lab-traps'

// ─────────────────────────────────────────────────────────────────────────────
// Resposta compartilhada dos honeypots (docs/detection-experiment.md §4).
//
// Route handlers, não page.tsx, por três motivos de medição:
//   1. Controle total dos headers — X-Robots-Tag sai daqui, sem next.config.
//   2. ETag/Last-Modified próprios + 304 real para If-None-Match /
//      If-Modified-Since: revalidação é o discriminador do Axis B (§3.2), e o
//      Next não negocia condicionais por nós em rota dinâmica.
//   3. Zero subresources — a página não dispara nenhum fetch de asset, então
//      o único evento que um hit gera é o do próprio trap.
//
// A página é honesta: um humano que caia aqui lê o que isto é e por quê.
// ─────────────────────────────────────────────────────────────────────────────

const LAST_MODIFIED = 'Sat, 25 Jul 2026 00:00:00 GMT'
const MAX_DELAY_MS = 8000 // bem abaixo do timeout de função da Vercel

const EXPLANATION: Record<TrapChannel, { title: string; how: string }> = {
  robots: {
    title: 'Página de laboratório — sonda do robots.txt',
    how:
      'A URL desta página existe em um único lugar: uma linha <code>Disallow:</code> no ' +
      '<code>/robots.txt</code> deste site. Ela não está no sitemap, não está no índice de ' +
      'busca e nenhuma página aponta para cá. Um acesso automatizado a ela só tem uma ' +
      'explicação: o cliente leu o robots.txt e escolheu buscar exatamente o que o arquivo ' +
      'pede para não buscar.',
  },
  llms: {
    title: 'Página de laboratório — sonda do llms.txt',
    how:
      'A URL desta página existe em um único lugar: um link rotulado no <code>/llms.txt</code> ' +
      'deste site. Ela não está no sitemap, não está no robots.txt e nenhuma página aponta ' +
      'para cá. Um acesso a ela prova que o cliente parseia o llms.txt e segue os links — ' +
      'é isso que está sendo medido, e nada mais.',
  },
}

function html(channel: TrapChannel): string {
  const { title, how } = EXPLANATION[channel]
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>${title}</title>
<style>
  :root { color-scheme: light dark; }
  body { font-family: system-ui, sans-serif; max-width: 42rem; margin: 0 auto; padding: 3rem 1.5rem; line-height: 1.6; }
  code { font-size: 0.95em; }
</style>
</head>
<body>
<h1>${title}</h1>
<p>${how}</p>
<p>Esta rota faz parte de um experimento público de detecção de rastreadores,
documentado no repositório do site (<code>docs/detection-experiment.md</code>).
O experimento classifica comportamento e publica contagens, datas e definições —
não acusações. Nenhum conteúdo real vive atrás desta URL.</p>
<p>O acesso é registrado de forma anônima (caminho, sinais técnicos da requisição
e um código de rede truncado que rotaciona todo mês — nunca o endereço IP),
conforme a <a href="/politica-de-privacidade">política de privacidade</a>.</p>
<p>Se você é uma pessoa e chegou aqui por curiosidade: bem-vinda. É exatamente
isto que a página é, e nada mais.</p>
</body>
</html>
`
}

/** GET handler de um trap; `delayed` liga o atraso configurável (§4.3). */
export function trapHandler(channel: TrapChannel, opts: { delayed: boolean }) {
  const etag = `"trap-${channel}-v1"`
  const body = html(channel)

  return async function GET(request: Request): Promise<Response> {
    if (opts.delayed) {
      const raw = Number(process.env.LAB_TRAP_DELAY_MS ?? 0)
      const delay = Math.min(Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 0, MAX_DELAY_MS)
      if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay))
    }

    const headers: Record<string, string> = {
      'Content-Type': 'text/html; charset=utf-8',
      'X-Robots-Tag': 'noindex, nofollow',
      // `no-cache` = pode guardar, mas revalide — mantém os requests
      // condicionais fluindo, que é o que o Axis B mede.
      'Cache-Control': 'no-cache',
      ETag: etag,
      'Last-Modified': LAST_MODIFIED,
    }

    const ifNoneMatch = request.headers.get('if-none-match')
    if (ifNoneMatch) {
      const matches = ifNoneMatch.split(',').some((t) => {
        const tag = t.trim()
        return tag === etag || tag === `W/${etag}` || tag === '*'
      })
      if (matches) return new Response(null, { status: 304, headers })
      return new Response(body, { status: 200, headers })
    }

    const ifModifiedSince = request.headers.get('if-modified-since')
    if (ifModifiedSince) {
      const since = Date.parse(ifModifiedSince)
      if (!Number.isNaN(since) && since >= Date.parse(LAST_MODIFIED)) {
        return new Response(null, { status: 304, headers })
      }
    }

    return new Response(body, { status: 200, headers })
  }
}
