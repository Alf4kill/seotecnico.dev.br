import { describe, expect, it } from 'vitest'
import { absoluteUrl, buildMetadata } from './metadata'
import { site } from './site'

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

  it('always carries siteName and locale (lost on pages that set openGraph)', () => {
    const meta = buildMetadata(page)
    expect(meta.openGraph?.siteName).toBe(site.name)
    expect(meta.openGraph?.locale).toBe(site.locale)
  })

  it('defaults to og:type website', () => {
    const meta = buildMetadata(page)
    expect(meta.openGraph).toMatchObject({ type: 'website' })
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

  it('sets noindex robots only when asked', () => {
    expect(buildMetadata(page).robots).toBeUndefined()
    expect(buildMetadata({ ...page, noindex: true }).robots).toEqual({
      index: false,
      follow: true,
    })
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
