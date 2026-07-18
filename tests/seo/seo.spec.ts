import { test, expect } from '@playwright/test'
import sitemap from '../../src/app/sitemap'
import { getAllPosts } from '../../src/lib/content'
import { site } from '../../src/lib/site'

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

/** JSON-LD @type values each route must emit (CLAUDE.md §6). */
function expectedJsonLdTypes(path: string): string[] {
  if (path === '/') return ['WebSite', 'Person']
  if (path === '/sobre') return ['Person', 'BreadcrumbList']
  if (path.startsWith('/guia/')) return ['Article', 'BreadcrumbList']
  if (path.startsWith('/blog/')) {
    const frontmatter = postsBySlug.get(path.slice('/blog/'.length))
    return [
      'Article',
      'BreadcrumbList',
      ...(frontmatter?.faq?.length ? ['FAQPage'] : []),
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

/** All <link rel="alternate" hreflang> tags in a raw HTML document. */
function extractHreflangLinks(html: string): { hreflang: string; href: string }[] {
  return (html.match(/<link\b[^>]*>/g) ?? [])
    .filter((tag) => tag.includes('rel="alternate"') && tag.includes('hreflang='))
    .map((tag) => ({
      hreflang: /hreflang="([^"]*)"/.exec(tag)?.[1] ?? '',
      href: /href="([^"]*)"/.exec(tag)?.[1] ?? '',
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

test('feed.xml is valid XML', async ({ request }) => {
  const response = await request.get('/feed.xml')
  expect(response.status()).toBe(200)
  expect((await response.text()).trimStart()).toMatch(/^<\?xml/)
})
