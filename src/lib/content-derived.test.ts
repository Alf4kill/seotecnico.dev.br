import { describe, expect, it } from 'vitest'
import { citedTool, extractHeadings, readingTime } from '@/lib/content-derived'
import { getAllPosts, getGuide, getRelatedPosts } from '@/lib/content'
import { CATEGORIES, getCategory, isCategorySlug, isPostStatus } from '@/lib/categories'

describe('extractHeadings', () => {
  it('devolve só os h2, com o id que o rehype-slug gera', () => {
    const mdx = [
      '## O que é LCP?',
      'texto',
      '### Subparte',
      '## Como medir `LCP` no [Next.js](https://nextjs.org)',
    ].join('\n')
    expect(extractHeadings(mdx)).toEqual([
      { id: 'o-que-é-lcp', text: 'O que é LCP?' },
      { id: 'como-medir-lcp-no-nextjs', text: 'Como medir LCP no Next.js' },
    ])
  })

  it('conta duplicados no documento inteiro, como o rehype-slug', () => {
    const mdx = ['### Exemplo', '## Exemplo'].join('\n')
    expect(extractHeadings(mdx)).toEqual([{ id: 'exemplo-1', text: 'Exemplo' }])
  })

  it('ignora # dentro de blocos de código', () => {
    const mdx = ['```bash', '## não é heading', '```', '## Real'].join('\n')
    expect(extractHeadings(mdx)).toEqual([{ id: 'real', text: 'Real' }])
  })

  it('código inline com < > é texto, não tag (casos reais do blog)', () => {
    const mdx = [
      '## O componente base: um `<script>` e nada mais',
      '## `<html lang>`: o que o App Router não deixa você fazer',
      '## Tag de verdade <span>some</span> daqui',
    ].join('\n')
    expect(extractHeadings(mdx).map((h) => h.id)).toEqual([
      'o-componente-base-um-script-e-nada-mais',
      'html-lang-o-que-o-app-router-não-deixa-você-fazer',
      'tag-de-verdade-some-daqui',
    ])
  })

  it('aceita CRLF', () => {
    expect(extractHeadings('## Um\r\ntexto\r\n## Dois\r\n')).toHaveLength(2)
  })
})

describe('readingTime', () => {
  it('conta 200 palavras por minuto e nunca devolve zero', () => {
    expect(readingTime('palavra '.repeat(1000))).toBe(5)
    expect(readingTime('curto')).toBe(1)
  })

  it('não conta código nem diagramas', () => {
    const code = '```ts\n' + 'const x = 1\n'.repeat(2000) + '```\n'
    const svg = '<svg>' + '<text>rótulo</text>'.repeat(2000) + '</svg>'
    expect(readingTime(code + svg + 'palavra '.repeat(400))).toBe(2)
  })
})

describe('citedTool', () => {
  it('encontra o primeiro link markdown para uma ferramenta', () => {
    const mdx = 'Veja o [checador](/ferramentas/checador-cwv) e o [gerador](/ferramentas/gerador-json-ld).'
    expect(citedTool(mdx)).toEqual({
      title: 'Checador de Core Web Vitals',
      href: '/ferramentas/checador-cwv',
    })
  })

  it('aceita href em JSX e ignora rota que não é ferramenta', () => {
    expect(citedTool('<a href="/ferramentas/validador-meta-tags">x</a>')?.href).toBe(
      '/ferramentas/validador-meta-tags'
    )
    expect(citedTool('[x](/ferramentas/inexistente)')).toBeUndefined()
    expect(citedTool('sem ferramenta')).toBeUndefined()
  })
})

describe('categorias e estado', () => {
  it('slugs únicos, e a validação só aceita os declarados', () => {
    const slugs = CATEGORIES.map((c) => c.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    expect(isCategorySlug('cwv')).toBe(true)
    expect(isCategorySlug('seo')).toBe(false)
    expect(() => getCategory('nenhuma' as never)).toThrow()
  })

  it('estado rejeita chave herdada do protótipo', () => {
    expect(isPostStatus('em-medicao')).toBe(true)
    expect(isPostStatus('toString')).toBe(false)
    expect(isPostStatus(undefined)).toBe(false)
  })
})

describe('conteúdo publicado', () => {
  const posts = getAllPosts()

  it('todo artigo tem categoria, índice e ferramenta citada (§6)', () => {
    for (const { frontmatter, derived } of posts) {
      expect(frontmatter.category, frontmatter.slug).toBeDefined()
      expect(derived.headings.length, frontmatter.slug).toBeGreaterThan(0)
      expect(derived.citedTool, `${frontmatter.slug} não linka ferramenta`).toBeDefined()
    }
  })

  it('toda categoria tem ao menos um artigo — nenhum filtro vazio', () => {
    for (const { slug } of CATEGORIES) {
      expect(posts.some((p) => p.frontmatter.category === slug), slug).toBe(true)
    }
  })

  it('a pilar não tem categoria: cobre todos os eixos', () => {
    expect(getGuide('pt-BR').frontmatter.category).toBeUndefined()
  })

  it('relacionados: mesmo eixo primeiro, nunca o próprio, no máximo 3', () => {
    const [first] = posts
    const related = getRelatedPosts(first.frontmatter.slug)
    expect(related).toHaveLength(3)
    expect(related.map((p) => p.frontmatter.slug)).not.toContain(first.frontmatter.slug)
    const sameAxis = posts.filter(
      (p) => p.frontmatter.category === first.frontmatter.category && p !== first
    ).length
    related.slice(0, Math.min(sameAxis, 3)).forEach((p) =>
      expect(p.frontmatter.category).toBe(first.frontmatter.category)
    )
  })
})
