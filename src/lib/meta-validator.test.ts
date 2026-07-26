import { describe, expect, it } from 'vitest'
import {
  countIssues,
  extractMeta,
  isPrivateAddress,
  parseTargetUrl,
  runChecks,
  DESCRIPTION_MAX,
  TITLE_MAX,
} from './meta-validator'

const URL_OK = 'https://exemplo.com.br/pagina'

/** Página sem nenhum problema — a régua dos testes de checagem. */
const PERFECT = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Um title dentro do limite de sessenta caracteres</title>
<meta name="description" content="Uma description objetiva, dentro do limite de cento e cinquenta e cinco caracteres, que descreve a página sem enrolação.">
<link rel="canonical" href="${URL_OK}">
<meta property="og:title" content="Um title">
<meta property="og:description" content="Uma description">
<meta property="og:image" content="https://exemplo.com.br/og.png">
<meta name="twitter:card" content="summary_large_image">
</head>
<body><h1>Título</h1></body>
</html>`

// A guarda de entrada é a fronteira de segurança da ferramenta: um furo aqui é
// SSRF contra a rede interna de quem hospeda. Estes testes existem para que o
// furo apareça no CI, não em produção.
describe('parseTargetUrl', () => {
  /** A URL aceita, ou uma falha ruidosa — nunca um undefined silencioso. */
  const accepted = (raw: string): URL => {
    const result = parseTargetUrl(raw)
    if (!result.ok) throw new Error(`esperava URL para "${raw}", veio: ${result.error}`)
    return result.url
  }
  const rejection = (raw: string): string | null => {
    const result = parseTargetUrl(raw)
    return result.ok ? null : result.error
  }

  it('accepts a public URL and completes a bare domain with https', () => {
    expect(accepted('https://exemplo.com.br/pagina?a=1').href).toBe(
      'https://exemplo.com.br/pagina?a=1'
    )
    expect(accepted('exemplo.com.br').href).toBe('https://exemplo.com.br/')
    expect(accepted('  https://exemplo.com.br  ').hostname).toBe('exemplo.com.br')
  })

  it('rejects any scheme other than http and https', () => {
    for (const raw of ['ftp://exemplo.com', 'file:///etc/passwd', 'gopher://x/']) {
      expect(rejection(raw)).toBe('Só http e https são suportados.')
    }
    // Sem as duas barras não é esquema: `javascript:`/`data:` viram host inválido.
    expect(rejection('javascript:alert(1)')).toBe('URL inválida.')
    expect(rejection('data:text/html,<h1>x')).toBe('URL inválida.')
  })

  it('treats host:port as a host, not as a scheme', () => {
    expect(accepted('exemplo.com:8080').port).toBe('8080')
    expect(rejection('exemplo.com:22')).toBe('Porta não suportada.')
  })

  it('rejects local hostnames before any DNS lookup happens', () => {
    for (const raw of ['http://localhost/', 'http://app.localhost/', 'https://servidor.local/']) {
      expect(rejection(raw)).toBe('Endereços locais não são suportados.')
    }
    // Ponto final (raiz absoluta do DNS) não é rota de escape.
    expect(rejection('http://localhost./')).toBe('Endereços locais não são suportados.')
  })

  it('rejects private and loopback IP literals, v4 and v6', () => {
    for (const raw of [
      'http://127.0.0.1/',
      'http://10.1.2.3/',
      'http://192.168.0.1/',
      'http://172.16.5.4/',
      'http://169.254.169.254/latest/meta-data/', // metadata de nuvem: o alvo clássico
      'http://[::1]/',
      'http://[fd00::1]/',
      'http://[::ffff:127.0.0.1]/', // v4 mapeado: o disfarce que passava batido
    ]) {
      expect(rejection(raw)).toBe('Endereços de rede interna não são suportados.')
    }
  })

  it('lets a public IP literal through', () => {
    expect(accepted('http://93.184.215.14/').hostname).toBe('93.184.215.14')
  })

  it('rejects an empty input', () => {
    expect(rejection('   ')).toBe('Informe uma URL.')
  })
})

describe('isPrivateAddress', () => {
  it('classifies the ranges the DNS step compares against', () => {
    expect(isPrivateAddress('10.0.0.1')).toBe(true)
    expect(isPrivateAddress('100.64.0.1')).toBe(true) // CGNAT
    expect(isPrivateAddress('fe80::1')).toBe(true)
    expect(isPrivateAddress('::ffff:127.0.0.1')).toBe(true) // v4 mapeado em v6
    expect(isPrivateAddress('8.8.8.8')).toBe(false)
    expect(isPrivateAddress('2606:4700::1111')).toBe(false)
  })
})

describe('extractMeta', () => {
  it('extracts every field from a complete page', () => {
    const meta = extractMeta(PERFECT)
    expect(meta.title).toBe('Um title dentro do limite de sessenta caracteres')
    expect(meta.description).toContain('Uma description objetiva')
    expect(meta.canonical).toBe(URL_OK)
    expect(meta.htmlLang).toBe('pt-BR')
    expect(meta.charset).toBe('utf-8')
    expect(meta.viewport).toContain('width=device-width')
    expect(meta.og).toMatchObject({ title: 'Um title', image: 'https://exemplo.com.br/og.png' })
    expect(meta.twitterCard).toBe('summary_large_image')
    expect(meta.h1Count).toBe(1)
    expect(meta.metaRobots).toBeNull()
  })

  it('handles single quotes, bare values and attribute order variations', () => {
    const meta = extractMeta(
      `<html lang=en><head><meta content='desc aqui' name='description'><link href="https://a.b/c" rel=canonical></head>`
    )
    expect(meta.htmlLang).toBe('en')
    expect(meta.description).toBe('desc aqui')
    expect(meta.canonical).toBe('https://a.b/c')
  })

  it('decodes common entities and collapses whitespace in the title', () => {
    const meta = extractMeta(`<title>\n  A &amp; B &#39;c&#39;   d\n</title>`)
    expect(meta.title).toBe("A & B 'c' d")
  })

  it('keeps the FIRST occurrence when a tag is duplicated', () => {
    const meta = extractMeta(
      `<meta name="description" content="primeira"><meta name="description" content="segunda">`
    )
    expect(meta.description).toBe('primeira')
  })

  it('counts every h1 in the document', () => {
    expect(extractMeta('<h1>a</h1><h1 class="x">b</h1>').h1Count).toBe(2)
    expect(extractMeta('<h2>não</h2>').h1Count).toBe(0)
  })
})

describe('runChecks', () => {
  it('a perfect page has zero issues', () => {
    const checks = runChecks(URL_OK, extractMeta(PERFECT))
    expect(countIssues(checks)).toBe(0)
  })

  it('an empty document fails/warns on everything', () => {
    const checks = runChecks(URL_OK, extractMeta('<html><head></head><body></body></html>'))
    const byId = new Map(checks.map((c) => [c.id, c.status]))
    expect(byId.get('title')).toBe('error')
    expect(byId.get('description')).toBe('error')
    expect(byId.get('h1')).toBe('error')
    expect(byId.get('canonical')).toBe('warning')
    expect(countIssues(checks)).toBeGreaterThanOrEqual(8)
  })

  it('flags title and description over the limits as warnings, not errors', () => {
    const meta = extractMeta(
      `<title>${'a'.repeat(TITLE_MAX + 1)}</title><meta name="description" content="${'b'.repeat(DESCRIPTION_MAX + 1)}">`
    )
    const byId = new Map(runChecks(URL_OK, meta).map((c) => [c.id, c]))
    expect(byId.get('title')?.status).toBe('warning')
    expect(byId.get('description')?.status).toBe('warning')
    expect(byId.get('title')?.detail).toContain(String(TITLE_MAX + 1))
  })

  it('accepts a canonical that differs only by trailing slash', () => {
    const meta = extractMeta(`<link rel="canonical" href="${URL_OK}/">`)
    const canonical = runChecks(URL_OK, meta).find((c) => c.id === 'canonical')
    expect(canonical?.status).toBe('ok')
  })

  it('warns on a canonical pointing elsewhere and errors on a relative one', () => {
    const other = extractMeta(`<link rel="canonical" href="https://outro.site/">`)
    expect(runChecks(URL_OK, other).find((c) => c.id === 'canonical')?.status).toBe('warning')

    const relative = extractMeta(`<link rel="canonical" href="/pagina">`)
    expect(runChecks(URL_OK, relative).find((c) => c.id === 'canonical')?.status).toBe('error')
  })

  it('warns on noindex and treats an absent meta robots as ok', () => {
    const noindex = extractMeta(`<meta name="robots" content="noindex, nofollow">`)
    expect(runChecks(URL_OK, noindex).find((c) => c.id === 'robots')?.status).toBe('warning')

    const absent = extractMeta('')
    expect(runChecks(URL_OK, absent).find((c) => c.id === 'robots')?.status).toBe('ok')
  })

  it('warns on multiple h1s', () => {
    const meta = extractMeta('<h1>a</h1><h1>b</h1>')
    expect(runChecks(URL_OK, meta).find((c) => c.id === 'h1')?.status).toBe('warning')
  })
})
