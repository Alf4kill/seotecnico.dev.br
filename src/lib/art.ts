import type { CategorySlug } from '@/lib/categories'

// ─────────────────────────────────────────────────────────────────────────────
// Registro da arte — que cena e que emblema vão onde (docs/design-system.md →
// Arte). Os componentes vêm de src/components/art/generated.tsx, gerado por
// scripts/art-import.mjs; aqui só há ids e decisões, sem JSX nem `fs`.
//
// Cenas (360×280) em quatro trios, um por eixo do blog — o artigo herda a cena
// pela categoria, então publicar um artigo novo NUNCA exige editar este arquivo.
// A tabela SCENE_BY_SLUG só fixa a cena quando o tema do desenho casa com o
// assunto (luas gêmeas → hreflang, a única → metadata/canonical).
//
// Emblemas (96×96): as três ferramentas e o índice delas.
// ─────────────────────────────────────────────────────────────────────────────

export const SCENE_IDS = [
  'beam-piercing',
  'broken-vault',
  'light-column',
  'twin-moons',
  'arrival-at-void',
  'vertical-void',
  'contemplation',
  'the-only-one',
  'window',
  'guardian-eye',
  'vigil',
  'tombstone-field',
] as const
export type SceneId = (typeof SCENE_IDS)[number]

export const EMBLEM_IDS = ['staircase', 'dynamo', 'circuit', 'closed-loop'] as const
export type EmblemId = (typeof EMBLEM_IDS)[number]

/** Títulos das obras — legenda na galeria de /design e /en/design. */
export const ART_TITLES: Record<SceneId | EmblemId, { 'pt-BR': string; en: string }> = {
  'beam-piercing': { 'pt-BR': 'Feixe perfurante', en: 'Piercing beam' },
  'broken-vault': { 'pt-BR': 'Abóbada rompida', en: 'Broken vault' },
  'light-column': { 'pt-BR': 'Coluna de luz', en: 'Column of light' },
  'twin-moons': { 'pt-BR': 'Luas gêmeas', en: 'Twin moons' },
  'arrival-at-void': { 'pt-BR': 'Chegada ao vazio', en: 'Arrival at the void' },
  'vertical-void': { 'pt-BR': 'Vazio vertical', en: 'Vertical void' },
  contemplation: { 'pt-BR': 'Contemplação', en: 'Contemplation' },
  'the-only-one': { 'pt-BR': 'A única', en: 'The only one' },
  window: { 'pt-BR': 'Janela', en: 'Window' },
  'guardian-eye': { 'pt-BR': 'Olho guardião', en: 'Guardian eye' },
  vigil: { 'pt-BR': 'A vigília', en: 'The vigil' },
  'tombstone-field': { 'pt-BR': 'Campo de lápides', en: 'Field of tombstones' },
  staircase: { 'pt-BR': 'Escada', en: 'Staircase' },
  dynamo: { 'pt-BR': 'Dínamo', en: 'Dynamo' },
  circuit: { 'pt-BR': 'Circuito', en: 'Circuit' },
  'closed-loop': { 'pt-BR': 'Laço fechado', en: 'Closed loop' },
}

/**
 * Um trio por eixo. Luz para Core Web Vitals (a pintura), vazio para rastreio
 * (o que o robô alcança), janela e contemplação para metadados (como a página
 * se apresenta), vigília para medição.
 */
export const SCENES_BY_CATEGORY: Record<CategorySlug, readonly SceneId[]> = {
  cwv: ['light-column', 'beam-piercing', 'broken-vault'],
  indexacao: ['arrival-at-void', 'twin-moons', 'vertical-void'],
  'dados-estruturados': ['the-only-one', 'window', 'contemplation'],
  medicao: ['guardian-eye', 'vigil', 'tombstone-field'],
}

/** Exceções por slug — só quando o desenho conta o assunto do artigo. */
export const SCENE_BY_SLUG: Readonly<Record<string, SceneId>> = {
  'hreflang-nextjs': 'twin-moons',
  'sitemap-dinamico-nextjs': 'arrival-at-void',
  'ssr-ssg-isr-nextjs': 'vertical-void',
  'metadata-api-nextjs': 'the-only-one',
  'json-ld-nextjs': 'window',
  'detectar-crawlers-ia': 'guardian-eye',
  'gtm-nextjs': 'vigil',
  'melhorar-lcp-nextjs': 'light-column',
  'lcp-alto-next-js': 'beam-piercing',
  'inp-nextjs': 'broken-vault',
}

/** Hash estável do slug — escolhe a cena do trio sem depender da ordem de publicação. */
function stableIndex(slug: string, size: number): number {
  let h = 0
  for (const ch of slug) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return h % size
}

/** Cena do cabeçalho de um artigo: exceção por slug, senão o trio da categoria. */
export function sceneForPost(category: CategorySlug, slug: string): SceneId {
  const fixed = SCENE_BY_SLUG[slug]
  if (fixed) return fixed
  const trio = SCENES_BY_CATEGORY[category]
  return trio[stableIndex(slug, trio.length)]
}

/** Cenas e emblemas das páginas fixas. Uma cena e uma marca central, no máximo, por página. */
export const PAGE_ART = {
  about: 'contemplation',
  notFound: 'tombstone-field',
} as const satisfies Record<string, SceneId>

export const TOOL_EMBLEMS = {
  index: 'closed-loop',
  'gerador-json-ld': 'dynamo',
  'validador-meta-tags': 'circuit',
  'checador-cwv': 'staircase',
} as const satisfies Record<string, EmblemId>
