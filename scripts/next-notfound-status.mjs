// ─────────────────────────────────────────────────────────────────────────────
// Que status HTTP o Next.js devolve para uma página que não existe — por
// variante de rota e por User-Agent.
//
// Compila a fixture de audits/next-notfound-status/ com o Next.js instalado
// neste repositório, sobe `next start` numa porta local, pede um slug real e
// um inexistente em cada rota com cinco User-Agents e imprime a tabela.
// Base: docs/research/2026-11-08-soft-404.md §2.3 e o artigo de soft 404.
//
// Por que o User-Agent importa: desde o 15.2 o Next.js manda o metadata em
// streaming, exceto para os "HTML-limited bots" (regex HTML_LIMITED_BOT_UA_RE
// em next/dist/shared/lib/router/utils/html-bots.js). O Googlebot não está na
// lista; o Google-InspectionTool (Inspeção de URL, teste de pesquisa
// aprimorada) e o Bingbot estão. Se notFound() só roda em generateMetadata, o
// status depende de quem pergunta.
//
// Por que --webpack: o Turbopack recusa resolver `next` fora da raiz da
// fixture (o node_modules fica na raiz do repositório).
//
//   node scripts/next-notfound-status.mjs              # compila, mede, imprime
//   node scripts/next-notfound-status.mjs --no-build   # reusa o .next existente
//   node scripts/next-notfound-status.mjs --out audits/next-notfound-status/result.json
// ─────────────────────────────────────────────────────────────────────────────

import fs from 'node:fs'
import path from 'node:path'
import http from 'node:http'
import { spawn, spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const FIXTURE = path.join(ROOT, 'audits', 'next-notfound-status')
const NEXT_BIN = path.join(ROOT, 'node_modules', 'next', 'dist', 'bin', 'next')
const NEXT_VERSION = JSON.parse(fs.readFileSync(path.join(ROOT, 'node_modules', 'next', 'package.json'), 'utf8')).version
const PORT = 3999

const argv = process.argv.slice(2)
const arg = (name, fallback) => {
  const i = argv.indexOf(`--${name}`)
  return i === -1 ? fallback : argv[i + 1]
}
const OUT = arg('out', path.join(FIXTURE, 'result.json'))

// Strings de UA dos documentos de cada empresa (Googlebot e InspectionTool:
// "Google's common crawlers"; Bingbot: Bing Webmaster). A versão do Chrome é
// fixa só para o resultado ser reproduzível.
const USER_AGENTS = {
  Chrome: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  Googlebot:
    'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  'Google-InspectionTool':
    'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36 (compatible; Google-InspectionTool/1.0)',
  Bingbot: 'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
  curl: 'curl/8.0.0',
}

const ROUTES = [
  { id: 'plain', label: '`notFound()` in the page, no `loading`' },
  { id: 'stream', label: 'same, with `loading` in the segment' },
  { id: 'meta', label: '`notFound()` in `generateMetadata` and in the page' },
  { id: 'metaonly', label: '`notFound()` only in `generateMetadata`' },
]

const env = { ...process.env, NEXT_TELEMETRY_DISABLED: '1' }

if (!argv.includes('--no-build')) {
  const build = spawnSync(process.execPath, [NEXT_BIN, 'build', '--webpack'], { cwd: FIXTURE, env, stdio: 'inherit' })
  if (build.status !== 0) process.exit(build.status ?? 1)
}

const server = spawn(process.execPath, [NEXT_BIN, 'start', '-p', String(PORT)], { cwd: FIXTURE, env, stdio: 'ignore' })
const stop = () => server.kill()
process.on('exit', stop)

function get(urlPath, ua) {
  return new Promise((resolve, reject) => {
    const req = http.get(
      { host: '127.0.0.1', port: PORT, path: urlPath, headers: { 'User-Agent': ua, Accept: 'text/html' } },
      (res) => {
        let body = ''
        res.setEncoding('utf8')
        res.on('data', (c) => (body += c))
        res.on('end', () => resolve({ status: res.statusCode, body }))
      },
    )
    req.on('error', reject)
  })
}

// Espera o servidor responder (até 60 s).
for (let i = 0; ; i++) {
  try {
    await get('/plain/real', USER_AGENTS.curl)
    break
  } catch {
    if (i > 120) throw new Error('next start did not come up on port ' + PORT)
    await new Promise((r) => setTimeout(r, 500))
  }
}

const results = []
for (const route of ROUTES) {
  for (const [agent, ua] of Object.entries(USER_AGENTS)) {
    for (const slug of ['real', 'does-not-exist']) {
      const { status, body } = await get(`/${route.id}/${slug}`, ua)
      results.push({
        route: route.id,
        agent,
        slug,
        status,
        noindex: /<meta name="robots" content="[^"]*noindex/i.test(body),
        notFoundUi: body.includes('Not found'),
      })
    }
  }
}
stop()

// Sanidade: todo slug real tem de dar 200, senão a fixture está quebrada.
const broken = results.filter((r) => r.slug === 'real' && r.status !== 200)
if (broken.length) {
  console.error('fixture broken: real slug did not answer 200', broken)
  process.exit(1)
}

const agents = Object.keys(USER_AGENTS)
const rows = ROUTES.map((route) => {
  const cells = agents.map((a) => {
    const r = results.find((x) => x.route === route.id && x.agent === a && x.slug === 'does-not-exist')
    return `${r.status}${r.noindex ? '' : ' (no noindex)'}`
  })
  return `| ${route.label} | ${cells.join(' | ')} |`
})
const table = [`| Missing slug, next@${NEXT_VERSION} | ${agents.join(' | ')} |`, `|---|${agents.map(() => '---').join('|')}|`, ...rows].join('\n')

console.log('\n' + table + '\n')
console.log('Every missing-slug response above carries <meta name="robots" content="noindex"> unless marked.')

fs.writeFileSync(
  OUT,
  JSON.stringify({ measuredAt: new Date().toISOString(), next: NEXT_VERSION, command: 'node scripts/next-notfound-status.mjs', userAgents: USER_AGENTS, results }, null, 2) + '\n',
)
console.log(`written ${path.relative(ROOT, OUT)}`)
process.exit(0)
