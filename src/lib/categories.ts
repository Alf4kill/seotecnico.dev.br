// ─────────────────────────────────────────────────────────────────────────────
// Eixos temáticos do blog e o estado de cada artigo.
//
// Cada categoria tem uma forma Bauhaus fixa — círculo, quadrado ou triângulo —
// e uma cor do sistema. A forma é o "ícone" da categoria em qualquer tamanho:
// o sistema não usa ícone ilustrativo (docs/design-system.md, regras).
//
// Categorias NÃO geram URL. Com 12 artigos em 4 eixos, uma página de arquivo
// por categoria seria uma lista de três links — página fina, o risco que o §1
// nomeia. Elas servem ao filtro da /blog (sem JavaScript) e aos relacionados.
//
// Este módulo é importado por client components: nada aqui toca `fs`.
// ─────────────────────────────────────────────────────────────────────────────

export type CategoryShape = 'circle' | 'square' | 'triangle'
/** Cor da forma — token do Tailwind (bg-*, border-b-*). */
export type CategoryTone = 'primary' | 'accent' | 'shape-danger' | 'shape-reference'

export interface Category {
  slug: string
  label: { 'pt-BR': string; en: string }
  /** Rótulo curto para chips no celular. */
  short: { 'pt-BR': string; en: string }
  shape: CategoryShape
  tone: CategoryTone
}

export const CATEGORIES = [
  {
    slug: 'cwv',
    label: { 'pt-BR': 'Core Web Vitals', en: 'Core Web Vitals' },
    short: { 'pt-BR': 'CWV', en: 'CWV' },
    shape: 'square',
    tone: 'accent',
  },
  {
    slug: 'indexacao',
    label: { 'pt-BR': 'Rastreio e indexação', en: 'Crawling and indexing' },
    short: { 'pt-BR': 'Indexação', en: 'Indexing' },
    shape: 'square',
    tone: 'shape-reference',
  },
  {
    slug: 'dados-estruturados',
    label: { 'pt-BR': 'Metadados e dados estruturados', en: 'Metadata and structured data' },
    short: { 'pt-BR': 'Dados', en: 'Data' },
    shape: 'triangle',
    tone: 'shape-danger',
  },
  {
    slug: 'medicao',
    label: { 'pt-BR': 'Medição', en: 'Measurement' },
    short: { 'pt-BR': 'Medição', en: 'Measurement' },
    shape: 'circle',
    tone: 'primary',
  },
] as const satisfies readonly Category[]

export type CategorySlug = (typeof CATEGORIES)[number]['slug']

export function isCategorySlug(value: unknown): value is CategorySlug {
  return CATEGORIES.some((c) => c.slug === value)
}

export function getCategory(slug: CategorySlug): Category {
  const category = CATEGORIES.find((c) => c.slug === slug)
  if (!category) throw new Error(`[categories] slug desconhecido: ${slug}`)
  return category
}

/**
 * Estado de um artigo que é experimento. Opcional: tutorial não tem estado.
 * Só entra quando é verdade — "em medição" promete uma volta com dado real.
 */
export const STATUSES = {
  'em-medicao': { 'pt-BR': 'Em medição', en: 'Measuring', tone: 'accent' },
  fechado: { 'pt-BR': 'Fechado', en: 'Closed', tone: 'primary' },
  regressao: { 'pt-BR': 'Regressão', en: 'Regression', tone: 'danger' },
  referencia: { 'pt-BR': 'Referência', en: 'Reference', tone: 'muted' },
} as const

export type PostStatus = keyof typeof STATUSES

export function isPostStatus(value: unknown): value is PostStatus {
  return typeof value === 'string' && Object.hasOwn(STATUSES, value)
}
