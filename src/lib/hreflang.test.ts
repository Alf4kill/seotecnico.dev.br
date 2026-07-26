import { describe, expect, it } from 'vitest'
import {
  LANGS,
  TRANSLATION_PAIRS,
  X_DEFAULT_LANG,
  counterpartPath,
  langOfPath,
  languageAlternatePaths,
  pairForPath,
} from './hreflang'
import { getGuide } from './content'
import { buildMetadata } from './metadata'
import { site } from './site'

// hreflang falha em silêncio: uma declaração não recíproca não gera erro em
// lugar nenhum, o Google apenas descarta o cluster. Estes testes existem para
// que a falha apareça no CI — e um deles confronta o mapa com o frontmatter,
// porque as duas fontes podem divergir sem que nada quebre em runtime.

describe('TRANSLATION_PAIRS', () => {
  it('gives every pair a path in every declared language', () => {
    for (const pair of TRANSLATION_PAIRS) {
      for (const lang of LANGS) {
        expect(pair.paths[lang], `pair "${pair.id}" is missing ${lang}`).toMatch(/^\//)
      }
    }
  })

  it('never reuses a path across pairs or languages', () => {
    const all = TRANSLATION_PAIRS.flatMap((pair) => LANGS.map((lang) => pair.paths[lang]))
    expect(new Set(all).size, 'a path may belong to exactly one pair/language').toBe(all.length)
  })

  it('agrees with the translated file frontmatter', () => {
    // O lado EM INGLÊS declara `translationOf: <slug pt>`; o id do par é esse
    // mesmo slug. Se alguém renomear um sem o outro, isto quebra.
    const pt = getGuide().frontmatter
    const en = getGuide('en').frontmatter

    expect(en.translationOf, 'the English guide must declare its original').toBe(pt.slug)
    expect(pairForPath('/en/guide/technical-seo-nextjs')?.id).toBe(en.translationOf)
    expect(en.lang).toBe('en')
    expect(pt.lang).toBe('pt-BR')
  })
})

describe('pairForPath / langOfPath / counterpartPath', () => {
  it('resolves both sides of the pillar pair', () => {
    expect(langOfPath('/guia/seo-tecnico-nextjs')).toBe('pt-BR')
    expect(langOfPath('/en/guide/technical-seo-nextjs')).toBe('en')

    expect(counterpartPath('/guia/seo-tecnico-nextjs')).toEqual({
      lang: 'en',
      path: '/en/guide/technical-seo-nextjs',
    })
    expect(counterpartPath('/en/guide/technical-seo-nextjs')).toEqual({
      lang: 'pt-BR',
      path: '/guia/seo-tecnico-nextjs',
    })
  })

  it('returns nothing for a route without a translation', () => {
    expect(pairForPath('/blog/inp-nextjs')).toBeUndefined()
    expect(langOfPath('/sobre')).toBeUndefined()
    expect(counterpartPath('/')).toBeUndefined()
  })
})

describe('languageAlternatePaths', () => {
  it('emits self-reference, the counterpart and x-default', () => {
    const alternates = languageAlternatePaths('/guia/seo-tecnico-nextjs')
    expect(alternates).toEqual({
      'pt-BR': '/guia/seo-tecnico-nextjs',
      en: '/en/guide/technical-seo-nextjs',
      'x-default': '/guia/seo-tecnico-nextjs',
    })
  })

  it('is IDENTICAL on both sides of a pair — that is what reciprocity means', () => {
    expect(languageAlternatePaths('/guia/seo-tecnico-nextjs')).toEqual(
      languageAlternatePaths('/en/guide/technical-seo-nextjs')
    )
  })

  it('points x-default at the original language, not the translation', () => {
    const alternates = languageAlternatePaths('/en/guide/technical-seo-nextjs')
    expect(alternates?.['x-default']).toBe(
      TRANSLATION_PAIRS[0].paths[X_DEFAULT_LANG]
    )
  })

  it('emits nothing for an untranslated route', () => {
    expect(languageAlternatePaths('/sobre')).toBeUndefined()
  })
})

describe('buildMetadata hreflang integration', () => {
  // Derivado de `site`, não fixo: NEXT_PUBLIC_DOMAIN aponta para localhost em
  // ambiente de desenvolvimento, e um base hardcoded tornaria este teste um
  // detector de env var em vez de um teste de hreflang.
  const base = site.url.replace(/\/$/, '')
  const page = (path: string) =>
    buildMetadata({ title: 'T', description: 'D', path })

  it('turns the pair into absolute language alternates', () => {
    // Google exige URL absoluta em hreflang; caminho relativo não conta.
    expect(page('/guia/seo-tecnico-nextjs').alternates?.languages).toEqual({
      'pt-BR': `${base}/guia/seo-tecnico-nextjs`,
      en: `${base}/en/guide/technical-seo-nextjs`,
      'x-default': `${base}/guia/seo-tecnico-nextjs`,
    })
  })

  it('leaves untranslated routes without a languages block', () => {
    expect(page('/sobre').alternates?.languages).toBeUndefined()
  })
})
