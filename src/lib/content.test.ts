import { describe, it, expect } from 'vitest'
import { assertBasedOn, getAllEnglishPosts, getAllPosts, resolveBasedOn, type Post } from './content'
import { isExperiment, type PostStatus } from './categories'

// ─────────────────────────────────────────────────────────────────────────────
// `basedOn` liga um artigo aos experimentos de onde ele tira dados. O link
// errado não quebra nada visível — a caixa "Dados do laboratório" só some —,
// então a regra é conferida aqui e no build: o slug existe na mesma coleção e
// é de um experimento.
// ─────────────────────────────────────────────────────────────────────────────

function post(slug: string, status?: PostStatus, basedOn?: string[]): Post {
  return {
    frontmatter: {
      title: slug,
      description: '',
      slug,
      datePublished: '2026-10-04',
      dateModified: '2026-10-04',
      primaryQuery: slug,
      lang: 'pt-BR',
      category: 'medicao',
      status,
      basedOn,
    },
    content: '',
    derived: { readingTime: 1, headings: [] },
  }
}

describe('isExperiment', () => {
  it('counts measuring, closed and regression as experiments, and nothing else', () => {
    expect(isExperiment('em-medicao')).toBe(true)
    expect(isExperiment('fechado')).toBe(true)
    expect(isExperiment('regressao')).toBe(true)
    expect(isExperiment('referencia')).toBe(false)
    expect(isExperiment(undefined)).toBe(false)
  })
})

describe('assertBasedOn', () => {
  it('accepts a post based on an experiment in the same collection', () => {
    const posts = [post('lab', 'fechado'), post('guia', undefined, ['lab'])]
    expect(() => assertBasedOn(posts, 'blog')).not.toThrow()
  })

  it('rejects a slug that does not exist', () => {
    const posts = [post('guia', undefined, ['nao-existe'])]
    expect(() => assertBasedOn(posts, 'blog')).toThrow(/not a post/)
  })

  it('rejects a slug that is not an experiment', () => {
    const posts = [post('tutorial'), post('guia', undefined, ['tutorial'])]
    expect(() => assertBasedOn(posts, 'blog')).toThrow(/not an experiment/)
  })

  it('resolves sources to title, path and status', () => {
    const posts = [post('lab', 'em-medicao'), post('guia', undefined, ['lab'])]
    expect(resolveBasedOn(posts[1], posts, '/blog')).toEqual([
      { title: 'lab', path: '/blog/lab', status: 'em-medicao' },
    ])
  })
})

describe('published content', () => {
  it('every basedOn in both collections points to an experiment', () => {
    // getAll* já chamam assertBasedOn; o teste existe para o erro aparecer
    // aqui, com nome, e não só no build.
    expect(() => getAllPosts()).not.toThrow()
    expect(() => getAllEnglishPosts()).not.toThrow()
  })
})
