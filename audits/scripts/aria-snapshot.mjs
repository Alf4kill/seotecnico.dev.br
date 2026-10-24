// ─────────────────────────────────────────────────────────────────────────────
// What a tree-reading agent gets from this site's header, before and after the
// label-in-name fix of 2026-10-23 (commit 37043a3).
//
// Playwright's `ariaSnapshot()` is the same accessibility-tree YAML that
// Playwright MCP hands to a model by default. The "after" is the served page.
// The "before" is reconstructed in the same page by restoring the one attribute
// the fix removed (`aria-label` on the brand link) and hiding the sr-only hint
// it added — the commit's diff, applied backwards in the DOM.
//
//   node audits/scripts/aria-snapshot.mjs --base http://localhost:3100
// ─────────────────────────────────────────────────────────────────────────────

import { chromium } from '@playwright/test'

const i = process.argv.indexOf('--base')
const base = (i > -1 ? process.argv[i + 1] : 'http://localhost:3100').replace(/\/$/, '')

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
await page.route('**/*', (route) =>
  new URL(route.request().url()).origin === base ? route.continue() : route.abort()
)

// What an agent (or a voice-control user) would ask for: the text on screen.
// Playwright matches a string name as a case-insensitive substring.
const byVisibleText = (page) => page.getByRole('link', { name: 'SEO Técnico .DEV.BR' })

for (const path of ['/', '/en']) {
  await page.goto(`${base}${path}`)
  const brand = page.locator('header a').first()
  console.log(`\n# ${path} — after (served)`)
  console.log(await brand.ariaSnapshot())
  console.log(`# ${path} — links found by visible text: ${await byVisibleText(page).count()}`)

  const label = path === '/' ? 'SEO Técnico — página inicial' : 'SEO Técnico — home'
  await brand.evaluate((a, l) => {
    a.setAttribute('aria-label', l)
    a.querySelector('.sr-only')?.remove()
  }, label)
  console.log(`# ${path} — before (aria-label restored)`)
  console.log(await brand.ariaSnapshot())
  console.log(`# ${path} — links found by visible text: ${await byVisibleText(page).count()}`)
  console.log(`# ${path} — visible text: ${JSON.stringify(await brand.innerText())}`)
}

// The JSON-LD generator's output (commit 58b019d named it). Same reversal:
// the fix added role, aria-label and tabindex to the <pre>.
await page.goto(`${base}/ferramentas/gerador-json-ld`)
await page.getByLabel(/título do artigo/i).fill('Meu artigo')
await page.getByLabel(/url canônica/i).fill('https://exemplo.dev/blog/meu-artigo')
await page.getByLabel(/data de publicação/i).fill('2026-10-23')
await page.getByLabel(/nome do autor/i).fill('Nalpi')
await page.getByRole('button', { name: /gerar json-ld/i }).click()
const output = page.getByRole('region', { name: /resultado/i })
const lines = (await output.ariaSnapshot()).split('\n')
console.log('\n# /ferramentas/gerador-json-ld — after (served), first lines')
console.log(lines.slice(0, 3).join('\n'))
await output.evaluate((pre) => ['role', 'aria-label', 'tabindex'].forEach((a) => pre.removeAttribute(a)))
console.log('# region found by role + name after the reversal:', await page.getByRole('region', { name: /resultado/i }).count())

await browser.close()
