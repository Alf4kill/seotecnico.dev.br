import { describe, expect, it } from 'vitest'
import {
  buildSchema,
  componentNames,
  emptyGeneratorInput,
  parseSameAs,
  toJsonLd,
  toNextComponent,
  validateInput,
  type GeneratorInput,
  type GeneratorSchemaType,
} from './jsonld-generator'

/** Deep-clone do estado vazio para mutar com segurança em cada teste. */
function makeInput(overrides: Partial<GeneratorInput> = {}): GeneratorInput {
  return { ...structuredClone(emptyGeneratorInput), ...overrides }
}

describe('parseSameAs', () => {
  it('splits one URL per line, trimming and dropping empties', () => {
    expect(parseSameAs('https://github.com/x\n\n  https://linkedin.com/in/x  \n')).toEqual([
      'https://github.com/x',
      'https://linkedin.com/in/x',
    ])
  })

  it('returns [] for blank text', () => {
    expect(parseSameAs('  \n \n')).toEqual([])
  })
})

describe('validateInput', () => {
  it('flags every missing required Article field', () => {
    const errors = validateInput('Article', makeInput())
    expect(errors).toHaveLength(4) // headline, url, datePublished, authorName
  })

  it('requires at least one complete FAQ pair', () => {
    expect(validateInput('FAQPage', makeInput())).toHaveLength(1)

    const half = makeInput({ faq: [{ question: 'Só pergunta?', answer: '' }] })
    expect(validateInput('FAQPage', half)).toEqual(['Pergunta 1: falta a resposta.'])
  })

  it('requires two breadcrumb levels', () => {
    const one = makeInput({ breadcrumb: [{ name: 'Home', url: 'https://x.dev/' }] })
    expect(validateInput('BreadcrumbList', one)).toHaveLength(1)
  })

  it('passes a valid Organization', () => {
    const input = makeInput({
      organization: { name: 'ACME', url: 'https://acme.dev', logoUrl: '', sameAs: '' },
    })
    expect(validateInput('Organization', input)).toEqual([])
  })
})

describe('buildSchema', () => {
  it('Article: includes required nodes and omits empty optionals', () => {
    const input = makeInput()
    input.article = {
      ...input.article,
      headline: 'Como melhorar o LCP',
      url: 'https://exemplo.dev/blog/lcp',
      datePublished: '2026-07-18',
      authorName: 'Nalpi',
    }
    const schema = buildSchema('Article', input)
    expect(schema).toMatchObject({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: 'Como melhorar o LCP',
      mainEntityOfPage: 'https://exemplo.dev/blog/lcp',
      author: { '@type': 'Person', name: 'Nalpi' },
    })
    // Vazios não podem virar chaves com string vazia:
    expect(schema).not.toHaveProperty('description')
    expect(schema).not.toHaveProperty('dateModified')
    expect(schema).not.toHaveProperty('image')
    expect(schema).not.toHaveProperty('publisher')
    expect(schema.author).not.toHaveProperty('url')
  })

  it('FAQPage: maps only complete pairs into mainEntity', () => {
    const input = makeInput({
      faq: [
        { question: 'P1?', answer: 'R1' },
        { question: '', answer: '' },
        { question: 'P2?', answer: 'R2' },
      ],
    })
    const schema = buildSchema('FAQPage', input) as {
      mainEntity: { name: string; acceptedAnswer: { text: string } }[]
    }
    expect(schema.mainEntity).toHaveLength(2)
    expect(schema.mainEntity[1]).toEqual({
      '@type': 'Question',
      name: 'P2?',
      acceptedAnswer: { '@type': 'Answer', text: 'R2' },
    })
  })

  it('BreadcrumbList: positions are sequential from 1', () => {
    const input = makeInput({
      breadcrumb: [
        { name: 'Home', url: 'https://x.dev/' },
        { name: 'Blog', url: 'https://x.dev/blog' },
        { name: 'Post', url: 'https://x.dev/blog/post' },
      ],
    })
    const schema = buildSchema('BreadcrumbList', input) as {
      itemListElement: { position: number; name: string }[]
    }
    expect(schema.itemListElement.map((i) => i.position)).toEqual([1, 2, 3])
  })

  it('Person: sameAs only present when filled', () => {
    const input = makeInput({
      person: { name: 'Nalpi', jobTitle: '', url: '', sameAs: 'https://github.com/x' },
    })
    expect(buildSchema('Person', input)).toEqual({
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: 'Nalpi',
      sameAs: ['https://github.com/x'],
    })
  })
})

describe('serialization', () => {
  const types: GeneratorSchemaType[] = [
    'Article',
    'FAQPage',
    'BreadcrumbList',
    'Person',
    'Organization',
  ]

  it('toJsonLd output parses back to the same object', () => {
    const input = makeInput({
      person: { name: 'Nalpi', jobTitle: 'Dev', url: '', sameAs: '' },
    })
    const schema = buildSchema('Person', input)
    expect(JSON.parse(toJsonLd(schema))).toEqual(schema)
  })

  it('toNextComponent embeds the schema and exports the named component', () => {
    for (const type of types) {
      const snippet = toNextComponent(type, { '@type': type })
      expect(snippet).toContain(`export function ${componentNames[type]}()`)
      expect(snippet).toContain(`"@type": "${type}"`)
      expect(snippet).toContain("type=\"application/ld+json\"")
      // Snippet must escape "<" like production does (Next.js JSON-LD guide).
      expect(snippet).toContain("JSON.stringify(schema).replace(/</g, '\\\\u003c')")
    }
  })
})
