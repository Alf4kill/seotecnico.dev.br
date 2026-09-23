import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { ART_TITLES, EMBLEM_IDS, SCENE_BY_SLUG, SCENE_IDS, SCENES_BY_CATEGORY, sceneForPost } from '@/lib/art'
import { CATEGORIES } from '@/lib/categories'
import { getAllPosts } from '@/lib/content'

// ─────────────────────────────────────────────────────────────────────────────
// O registro da arte (lib/art.ts) contra o conteúdo e contra o CSS: todo
// artigo resolve uma cena, toda cena é usada, e toda cor que a arte gerada
// pede existe como token nos dois temas.
// ─────────────────────────────────────────────────────────────────────────────

const css = fs.readFileSync(path.join(process.cwd(), 'src/app/globals.css'), 'utf8')
const generated = fs.readFileSync(path.join(process.cwd(), 'src/components/art/generated.tsx'), 'utf8')

describe('registro da arte', () => {
  it('cada eixo tem um trio de cenas, sem cena repetida entre eixos', () => {
    for (const { slug } of CATEGORIES) expect(SCENES_BY_CATEGORY[slug]).toHaveLength(3)
    const all = Object.values(SCENES_BY_CATEGORY).flat()
    expect(new Set(all).size).toBe(all.length)
    expect([...all].sort()).toEqual([...SCENE_IDS].sort())
  })

  it('todo artigo publicado resolve uma cena do próprio eixo', () => {
    for (const { frontmatter } of getAllPosts()) {
      expect(frontmatter.category, frontmatter.slug).toBeDefined()
      const scene = sceneForPost(frontmatter.category!, frontmatter.slug)
      expect(SCENES_BY_CATEGORY[frontmatter.category!]).toContain(scene)
    }
  })

  it('exceções por slug apontam para artigos que existem', () => {
    const slugs = new Set(getAllPosts().map((p) => p.frontmatter.slug))
    for (const slug of Object.keys(SCENE_BY_SLUG)) expect(slugs, slug).toContain(slug)
  })

  it('um artigo novo sem exceção cai no trio da categoria, de forma estável', () => {
    const a = sceneForPost('cwv', 'um-artigo-que-ainda-nao-existe')
    expect(SCENES_BY_CATEGORY.cwv).toContain(a)
    expect(sceneForPost('cwv', 'um-artigo-que-ainda-nao-existe')).toBe(a)
  })

  it('toda obra tem título nos dois idiomas', () => {
    for (const id of [...SCENE_IDS, ...EMBLEM_IDS]) {
      expect(ART_TITLES[id]['pt-BR']).toBeTruthy()
      expect(ART_TITLES[id].en).toBeTruthy()
    }
  })
})

describe('arte gerada × tokens', () => {
  const tokens = [...new Set([...generated.matchAll(/\b(?:fill|stroke)-(art-[a-z]+)\b/g)].map((m) => m[1]))]

  it('usa a rampa art', () => {
    expect(tokens.length).toBeGreaterThan(5)
  })

  it.each(tokens)('--%s-rgb existe no escuro e no claro', (token) => {
    const declarations = css.match(new RegExp(`--${token}-rgb:\\s*\\d+ \\d+ \\d+;`, 'g')) ?? []
    expect(declarations).toHaveLength(2)
  })
})
