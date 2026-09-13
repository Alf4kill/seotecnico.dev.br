import { describe, expect, it } from 'vitest'
import { absoluteUrl, buildMetadata, rootMetadata } from './metadata'
import { indexable, site } from './site'

const BASE = site.url.replace(/\/$/, '')

describe('absoluteUrl', () => {
  it('returns the bare domain for the home path (no trailing slash)', () => {
    expect(absoluteUrl('/')).toBe(BASE)
  })

  it('appends the path to the domain', () => {
    expect(absoluteUrl('/blog/meu-post')).toBe(`${BASE}/blog/meu-post`)
  })
})

describe('buildMetadata', () => {
  const page = {
    title: 'Blog de SEO técnico para Next.js',
    description: 'Artigos práticos de SEO técnico.',
    path: '/blog',
  }

  it('sets the self-referencing canonical and matching og:url (the prod bug)', () => {
    const meta = buildMetadata(page)
    expect(meta.alternates?.canonical).toBe('/blog')
    expect(meta.openGraph?.url).toBe(`${BASE}/blog`)
  })

  it('links the RSS feed for autodiscovery on every page', () => {
    const meta = buildMetadata(page)
    expect(meta.alternates?.types).toEqual({
      'application/rss+xml': [{ url: '/feed.xml', title: site.name }],
    })
  })

  it('always carries siteName and locale (lost on pages that set openGraph)', () => {
    const meta = buildMetadata(page)
    expect(meta.openGraph?.siteName).toBe(site.name)
    expect(meta.openGraph?.locale).toBe(site.locale)
  })

  it('defaults to og:type website', () => {
    const meta = buildMetadata(page)
    expect(meta.openGraph).toMatchObject({ type: 'website' })
  })

  it('always sets the brand og:image (pages replace inherited openGraph, so it cannot cascade)', () => {
    const meta = buildMetadata(page)
    expect(meta.openGraph?.images).toEqual([
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        type: 'image/png',
        alt: expect.stringContaining(site.name),
      },
    ])
  })

  it('uses a page-specific card when one is given, keeping size and type', () => {
    // No page relies on the opengraph-image file convention any more: inside a
    // route group it hashes the URL. Every og:image is declared here.
    const meta = buildMetadata({
      ...page,
      ogImage: { path: '/blog/meu-post/opengraph-image', alt: 'Meu post' },
    })
    expect(meta.openGraph?.images).toEqual([
      {
        url: '/blog/meu-post/opengraph-image',
        width: 1200,
        height: 630,
        type: 'image/png',
        alt: 'Meu post',
      },
    ])
  })

  it('uses og:type article with timestamps when article dates are given', () => {
    const meta = buildMetadata({
      ...page,
      article: { publishedTime: '2026-07-12', modifiedTime: '2026-07-13' },
    })
    expect(meta.openGraph).toMatchObject({
      type: 'article',
      publishedTime: '2026-07-12',
      modifiedTime: '2026-07-13',
    })
  })

  it('applies the site title template by default and skips it with absoluteTitle', () => {
    expect(buildMetadata(page).title).toBe(page.title)
    expect(buildMetadata({ ...page, absoluteTitle: true }).title).toEqual({
      absolute: page.title,
    })
  })

  it('emits robots on every page, following the indexable fail-safe', () => {
    // Per page, not per layout: see the next describe block for why.
    expect(buildMetadata(page).robots).toEqual({ index: indexable, follow: indexable })
  })

  it('forces noindex when asked, without touching follow', () => {
    expect(buildMetadata({ ...page, noindex: true }).robots).toEqual({
      index: false,
      follow: indexable,
    })
  })

  it('defaults to the Portuguese locale and brand card', () => {
    const meta = buildMetadata(page)
    expect(meta.openGraph?.locale).toBe('pt_BR')
    expect(meta.openGraph?.images).toEqual([expect.objectContaining({ url: '/opengraph-image' })])
  })

  it('switches og:locale AND the brand card together for an English page', () => {
    // An English page carrying pt_BR or the Portuguese card contradicts the
    // hreflang it emits. One `lang` drives both, so neither can be forgotten.
    const meta = buildMetadata({ ...page, path: '/en', lang: 'en' })
    expect(meta.openGraph?.locale).toBe('en_US')
    expect(meta.openGraph?.images).toEqual([
      {
        url: '/en/opengraph-image',
        width: 1200,
        height: 630,
        type: 'image/png',
        alt: expect.stringContaining('technical SEO'),
      },
    ])
  })

  it('throws when the rendered title (with template suffix) exceeds 60 chars', () => {
    const longTitle = 'Um título de página exagerado que passa do limite permitido' // 59 chars + " | SEO Técnico"
    expect(() => buildMetadata({ ...page, title: longTitle })).toThrow(/title/)
    // O mesmo texto passa quando absoluto (sem sufixo do template).
    expect(() => buildMetadata({ ...page, title: longTitle, absoluteTitle: true })).not.toThrow()
  })

  it('throws when the description exceeds 155 chars', () => {
    expect(() => buildMetadata({ ...page, description: 'x'.repeat(156) })).toThrow(/description/)
  })

  it('throws when path does not start with a slash', () => {
    expect(() => buildMetadata({ ...page, path: 'blog' })).toThrow(/path/)
  })
})

describe('rootMetadata', () => {
  it('never sets robots — a layout directive leaks into every 404', () => {
    // Layout metadata is inherited by the not-found UI, to which Next.js adds
    // its own noindex. A layout-level `index, follow` made every 404 serve two
    // conflicting robots metas (baseline 2026-07-20, defect 2).
    expect(rootMetadata('pt-BR')).not.toHaveProperty('robots')
    expect(rootMetadata('en')).not.toHaveProperty('robots')
  })

  it('differs between languages only in og:locale', () => {
    const pt = rootMetadata('pt-BR')
    const en = rootMetadata('en')
    expect(pt.openGraph?.locale).toBe('pt_BR')
    expect(en.openGraph?.locale).toBe('en_US')
    expect({ ...en, openGraph: { ...en.openGraph, locale: 'x' } }).toEqual({
      ...pt,
      openGraph: { ...pt.openGraph, locale: 'x' },
    })
  })
})
