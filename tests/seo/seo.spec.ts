import { test, expect } from '@playwright/test'
import sitemap from '../../src/app/sitemap'
import { getAllPosts, getGuide } from '../../src/lib/content'
import { site } from '../../src/lib/site'
import { ALLOWED_AI_CRAWLERS, DISALLOWED_AI_CRAWLERS } from '../../src/lib/ai-crawlers'

// ─────────────────────────────────────────────────────────────────────────────
// SEO regression suite (CLAUDE.md §8). For every route, asserts:
//   - exactly one <h1>
//   - <title> and meta description present and within length limits
//   - self-referencing canonical
//   - JSON-LD parses as valid JSON with the expected @type set
//   - hreflang pairs consistent in both directions (dormant until /en exists)
//
// Routes are NOT hardcoded: they come from app/sitemap.ts (which itself derives
// from getAllPosts()), so new articles are covered automatically the moment
// their MDX file lands in /content/blog. Noindex utility routes (/busca) are
// appended by hand because they are deliberately absent from the sitemap.
// ─────────────────────────────────────────────────────────────────────────────

const TITLE_MAX = 60
const DESCRIPTION_MAX = 155

const siteBase = site.url.replace(/\/$/, '')

// Sitemap entries carry production-absolute URLs; tests run against localhost,
// so only the pathname is kept.
const sitemapPaths = sitemap().map((entry) => new URL(entry.url).pathname)
const noindexPaths = ['/busca']
const routes = [...sitemapPaths, ...noindexPaths]

const postsBySlug = new Map(
  getAllPosts().map((post) => [post.frontmatter.slug, post.frontmatter])
)
const guideFrontmatter = getGuide().frontmatter

/** `FAQPage` is expected whenever the source frontmatter declares a `faq` array. */
const faqTypes = (frontmatter?: { faq?: unknown[] }) =>
  frontmatter?.faq?.length ? ['FAQPage'] : []

/** JSON-LD @type values each route must emit (CLAUDE.md §6). */
function expectedJsonLdTypes(path: string): string[] {
  if (path === '/') return ['WebSite', 'Organization', 'Person']
  if (path === '/sobre') return ['Person', 'BreadcrumbList']
  if (path.startsWith('/ferramentas/')) return ['SoftwareApplication', 'BreadcrumbList']
  // The guide reads its own frontmatter for the same reason /blog/ does: this
  // branch used to be a hardcoded pair, so a pillar with `faq` that failed to
  // render FaqSection would have passed silently.
  if (path.startsWith('/guia/')) {
    return ['Article', 'BreadcrumbList', ...faqTypes(guideFrontmatter)]
  }
  if (path.startsWith('/blog/')) {
    return [
      'Article',
      'BreadcrumbList',
      ...faqTypes(postsBySlug.get(path.slice('/blog/'.length))),
    ]
  }
  if (noindexPaths.includes(path)) return []
  // Every other page (indexes, institutional) must at least locate itself.
  return ['BreadcrumbList']
}

/** The canonical URL a page at `path` must point to (production-absolute). */
function expectedCanonical(path: string): string {
  return path === '/' ? siteBase : `${siteBase}${path}`
}

/**
 * All <link rel="alternate" hreflang> tags in a raw HTML document.
 *
 * Case-INSENSITIVE on purpose. Next.js serialises the attribute as `hrefLang`
 * (camelCase) in the HTML it serves, while the browser's DOM reports it
 * lowercased — so a case-sensitive matcher passes when reading a live page and
 * finds nothing when reading the same page over HTTP. Attribute names are
 * case-insensitive per the HTML spec, so the markup is valid and Google reads
 * it; only naive tooling is fooled. This helper reads both.
 *
 * The RSS `rel="alternate"` link is excluded by requiring `hreflang`.
 */
function extractHreflangLinks(html: string): { hreflang: string; href: string }[] {
  return (html.match(/<link\b[^>]*>/gi) ?? [])
    .filter((tag) => /rel="alternate"/i.test(tag) && /\bhreflang=/i.test(tag))
    .map((tag) => ({
      hreflang: /\bhreflang="([^"]*)"/i.exec(tag)?.[1] ?? '',
      href: /\bhref="([^"]*)"/i.exec(tag)?.[1] ?? '',
    }))
}

for (const route of routes) {
  test(`SEO invariants: ${route}`, async ({ page }) => {
    const response = await page.goto(route)
    expect(response?.status(), `GET ${route}`).toBe(200)

    // ── Exactly one <h1>, non-empty ─────────────────────────────────────────
    const h1 = page.locator('h1')
    await expect(h1, 'exactly one <h1>').toHaveCount(1)
    expect((await h1.innerText()).trim(), '<h1> must not be empty').not.toBe('')

    // ── <title> present, ≤60 chars ──────────────────────────────────────────
    const title = await page.title()
    expect(title.trim(), '<title> must not be empty').not.toBe('')
    expect(title.length, `<title> "${title}" exceeds ${TITLE_MAX} chars`)
      .toBeLessThanOrEqual(TITLE_MAX)

    // ── Meta description present, ≤155 chars ────────────────────────────────
    const descriptionTag = page.locator('head meta[name="description"]')
    await expect(descriptionTag, 'exactly one meta description').toHaveCount(1)
    const description = (await descriptionTag.getAttribute('content')) ?? ''
    expect(description.trim(), 'meta description must not be empty').not.toBe('')
    expect(
      description.length,
      `meta description (${description.length} chars) exceeds ${DESCRIPTION_MAX}`
    ).toBeLessThanOrEqual(DESCRIPTION_MAX)

    // ── Self-referencing canonical ──────────────────────────────────────────
    const canonical = page.locator('head link[rel="canonical"]')
    await expect(canonical, 'exactly one canonical').toHaveCount(1)
    expect(
      await canonical.getAttribute('href'),
      'canonical must be self-referencing'
    ).toBe(expectedCanonical(route))

    // ── JSON-LD: every block parses; expected @type set present ─────────────
    const jsonLdBlocks = await page
      .locator('script[type="application/ld+json"]')
      .allTextContents()
    const foundTypes: string[] = []
    for (const raw of jsonLdBlocks) {
      let parsed: unknown
      try {
        parsed = JSON.parse(raw)
      } catch {
        throw new Error(`JSON-LD block on ${route} is not valid JSON:\n${raw}`)
      }
      for (const node of Array.isArray(parsed) ? parsed : [parsed]) {
        const type = (node as { '@type'?: string })['@type']
        if (type) foundTypes.push(type)
      }
    }
    for (const type of expectedJsonLdTypes(route)) {
      expect.soft(foundTypes, `JSON-LD @type "${type}" on ${route}`).toContain(type)
    }

    // ── Robots: noindex only where intended ─────────────────────────────────
    const robotsContent =
      (await page.locator('head meta[name="robots"]').first().getAttribute('content').catch(() => null)) ?? ''
    if (noindexPaths.includes(route)) {
      expect(robotsContent, `${route} must be noindex`).toContain('noindex')
    } else if (process.env.SITE_INDEXABLE === 'true') {
      // Only meaningful when the build was made indexable (CI does this);
      // a local build without SITE_INDEXABLE is noindex everywhere by design.
      expect(robotsContent, `${route} must be indexable`).not.toContain('noindex')
    }

    // ── Hreflang: pairs must be consistent in both directions ───────────────
    // Dormant while no /en pages exist; activates automatically once a page
    // emits <link rel="alternate" hreflang>.
    const hreflangLinks = extractHreflangLinks(await page.content())
    if (hreflangLinks.length > 0) {
      expect(
        hreflangLinks.map((l) => l.hreflang),
        `${route} declares hreflang but no x-default`
      ).toContain('x-default')

      for (const link of hreflangLinks) {
        if (link.hreflang === 'x-default') continue
        const alternatePath = new URL(link.href).pathname
        if (alternatePath === route) continue

        const alternateResponse = await page.request.get(alternatePath)
        expect(
          alternateResponse.status(),
          `hreflang target ${alternatePath} must resolve`
        ).toBe(200)
        const reciprocal = extractHreflangLinks(await alternateResponse.text())
        expect(
          reciprocal.map((l) => new URL(l.href).pathname),
          `${alternatePath} must link back to ${route} via hreflang`
        ).toContain(route)
      }
    }
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Crawl plumbing: the discovery endpoints the routes above depend on.
// ─────────────────────────────────────────────────────────────────────────────

test('sitemap.xml serves every enumerated URL', async ({ request }) => {
  const response = await request.get('/sitemap.xml')
  expect(response.status()).toBe(200)
  const xml = await response.text()
  for (const entry of sitemap()) {
    expect(xml, `sitemap.xml must list ${entry.url}`).toContain(`<loc>${entry.url}</loc>`)
  }
})

test('robots.txt responds', async ({ request }) => {
  const response = await request.get('/robots.txt')
  expect(response.status()).toBe(200)
  expect(await response.text()).toContain('User-Agent')
})

/**
 * Groups keyed by user agent, exactly as a crawler reads robots.txt: the most
 * specific group naming the agent wins and `*` is ignored entirely.
 */
function parseRobotsGroups(txt: string): Map<string, string[]> {
  const groups = new Map<string, string[]>()
  let current: string[] | undefined

  for (const line of txt.split('\n')) {
    const [rawKey, ...rest] = line.split(':')
    const key = rawKey.trim().toLowerCase()
    const value = rest.join(':').trim()
    if (key === 'user-agent') {
      current = []
      groups.set(value.toLowerCase(), current)
    } else if (current && value) {
      current.push(`${key}: ${value}`)
    }
  }
  return groups
}

test('robots.txt declares the AI crawler policy per agent', async ({ request }) => {
  // Only meaningful on an indexable build; otherwise robots.txt is the
  // fail-safe `* / Disallow: /` and carries no named group at all.
  test.skip(process.env.SITE_INDEXABLE !== 'true', 'requires an indexable build')

  const groups = parseRobotsGroups(await (await request.get('/robots.txt')).text())

  for (const crawler of DISALLOWED_AI_CRAWLERS) {
    const rules = groups.get(crawler.token.toLowerCase())
    expect(rules, `${crawler.token} must have its own group`).toBeDefined()
    expect(rules, `${crawler.token} (training) must be disallowed`).toContain('disallow: /')
  }

  for (const crawler of ALLOWED_AI_CRAWLERS) {
    const rules = groups.get(crawler.token.toLowerCase())
    expect(rules, `${crawler.token} must have its own group`).toBeDefined()
    expect(rules, `${crawler.token} (retrieval) must be allowed`).toContain('allow: /')
    // A named group REPLACES the `*` group — it does not inherit from it. Every
    // allowed agent must therefore repeat the site-wide disallow for itself, or
    // /api/ silently ends up open to exactly the agents we just named.
    expect(rules, `${crawler.token} must repeat Disallow: /api/`).toContain('disallow: /api/')
    expect(rules, `${crawler.token} must not be blocked outright`).not.toContain('disallow: /')
  }
})

test('llms.txt lists every published URL', async ({ request }) => {
  const response = await request.get('/llms.txt')
  expect(response.status()).toBe(200)
  expect(response.headers()['content-type']).toContain('text/plain')

  const txt = await response.text()
  expect(txt.startsWith('# ')).toBe(true)

  // Same source as the sitemap, so the two can never disagree about what
  // is published — that equivalence is the reason the file is generated.
  for (const { url } of sitemap()) {
    if (!url.includes('/blog/') && !url.includes('/guia/')) continue
    expect(txt, `llms.txt must list ${url}`).toContain(url)
  }
})

test('feed.xml is valid XML', async ({ request }) => {
  const response = await request.get('/feed.xml')
  expect(response.status()).toBe(200)
  expect((await response.text()).trimStart()).toMatch(/^<\?xml/)
})
