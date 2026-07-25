import { describe, it, expect } from 'vitest'
import { buildLlmsTxt } from './llms-txt'
import type { Post } from './content'

const post = (slug: string, title: string, description: string): Post => ({
  frontmatter: {
    title,
    description,
    slug,
    datePublished: '2026-07-01',
    dateModified: '2026-07-02',
    primaryQuery: slug.replace(/-/g, ' '),
    lang: 'pt-BR',
  },
  content: '# corpo',
})

const guide = post('seo-tecnico-nextjs', 'Guia de SEO técnico', 'O guia pilar do site.')

describe('buildLlmsTxt', () => {
  it('opens with the site name as the only H1 and a blockquote summary', () => {
    const lines = buildLlmsTxt(guide, []).split('\n')
    expect(lines[0]).toBe('# SEO Técnico')
    expect(lines.filter((l) => l.startsWith('# '))).toHaveLength(1)
    expect(lines[2].startsWith('> ')).toBe(true)
  })

  it('lists every post with an absolute URL, title and description', () => {
    const posts = [
      post('melhorar-lcp-nextjs', 'Como melhorar o LCP', 'Diagnóstico pelas 4 subpartes.'),
      post('json-ld-nextjs', 'JSON-LD no App Router', 'Onde cada schema vive.'),
    ]
    const output = buildLlmsTxt(guide, posts)

    for (const p of posts) {
      expect(output).toContain(
        `- [${p.frontmatter.title}](https://seotecnico.dev.br/blog/${p.frontmatter.slug}): ${p.frontmatter.description}`
      )
    }
  })

  it('keeps the post order it is given (newest first, from getAllPosts)', () => {
    const output = buildLlmsTxt(guide, [
      post('novo', 'Novo', 'Mais recente.'),
      post('antigo', 'Antigo', 'Mais antigo.'),
    ])
    expect(output.indexOf('/blog/novo')).toBeLessThan(output.indexOf('/blog/antigo'))
  })

  it('links the pillar guide under its own section', () => {
    const output = buildLlmsTxt(guide, [])
    expect(output).toContain('## Guia (pilar)')
    expect(output).toContain(
      '- [Guia de SEO técnico](https://seotecnico.dev.br/guia/seo-tecnico-nextjs): O guia pilar do site.'
    )
  })

  it('emits only absolute URLs — a relative link is useless to an off-site agent', () => {
    const output = buildLlmsTxt(guide, [post('a', 'A', 'a')])
    const links = output.match(/\]\(([^)]+)\)/g) ?? []
    expect(links.length).toBeGreaterThan(0)
    for (const link of links) {
      expect(link).toMatch(/\]\(https:\/\//)
    }
  })

  it('states the licence split and the citation terms', () => {
    const output = buildLlmsTxt(guide, [])
    expect(output).toContain('## Licença e citação')
    expect(output).toContain('todos os direitos reservados')
    expect(output).toContain('https://seotecnico.dev.br/feed.xml')
  })

  it('renders an empty blog without producing a broken section', () => {
    const output = buildLlmsTxt(guide, [])
    expect(output).toContain('## Artigos')
    expect(output).not.toContain('undefined')
    expect(output.endsWith('\n')).toBe(true)
  })
})
