import { getCategory, STATUSES, type CategorySlug, type PostStatus } from '@/lib/categories'
import type { Lang } from '@/lib/hreflang'

// ─────────────────────────────────────────────────────────────────────────────
// Marcadores Bauhaus. A categoria é reconhecida pela forma — círculo, quadrado
// ou triângulo — sempre a mesma, em qualquer tamanho. É o único "ícone" do
// sistema (docs/design-system.md). As formas são decorativas: o rótulo em
// texto está sempre ao lado, então levam aria-hidden.
//
// As classes são escritas por extenso, uma a uma: o Tailwind só gera o que
// encontra literalmente no código.
// ─────────────────────────────────────────────────────────────────────────────

type Size = 'sm' | 'md' | 'lg'

const SQUARE: Record<Size, string> = { sm: 'h-2 w-2', md: 'h-4.5 w-4.5', lg: 'h-12 w-12' }
const CIRCLE: Record<Size, string> = { sm: 'h-2 w-2 rounded-full', md: 'h-4.5 w-4.5 rounded-full', lg: 'h-12 w-12 rounded-full' }
const TRIANGLE: Record<Size, string> = {
  sm: 'h-0 w-0 border-x-[5px] border-b-[9px] border-x-transparent',
  md: 'h-0 w-0 border-x-[10px] border-b-[18px] border-x-transparent',
  lg: 'h-0 w-0 border-x-[27px] border-b-[48px] border-x-transparent',
}

const FILL = {
  primary: 'bg-primary',
  accent: 'bg-accent',
  'shape-danger': 'bg-shape-danger',
  'shape-reference': 'bg-shape-reference',
} as const

const TRIANGLE_FILL = {
  primary: 'border-b-primary',
  accent: 'border-b-accent',
  'shape-danger': 'border-b-shape-danger',
  'shape-reference': 'border-b-shape-reference',
} as const

export function CategoryMark({ category, size = 'sm' }: { category: CategorySlug; size?: Size }) {
  const { shape, tone } = getCategory(category)
  const className =
    shape === 'triangle'
      ? `${TRIANGLE[size]} ${TRIANGLE_FILL[tone]}`
      : `${shape === 'circle' ? CIRCLE[size] : SQUARE[size]} ${FILL[tone]}`
  return <span aria-hidden="true" className={`inline-block shrink-0 ${className}`} />
}

export function CategoryChip({
  category,
  lang = 'pt-BR',
  short = false,
  className = '',
}: {
  category: CategorySlug
  lang?: Lang
  short?: boolean
  className?: string
}) {
  const { label, short: shortLabel } = getCategory(category)
  return (
    <span
      className={`inline-flex min-h-7 items-center gap-2 border border-gray-strong px-3 font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-muted ${className}`}
    >
      <CategoryMark category={category} />
      {short ? shortLabel[lang] : label[lang]}
    </span>
  )
}

const STATUS_TEXT = {
  primary: 'text-primary',
  accent: 'text-accent',
  danger: 'text-danger',
  muted: 'text-muted',
} as const

/** "Em medição", "Fechado"… — o estado de um experimento, em rótulo mono. */
export function StatusLabel({ status, lang = 'pt-BR' }: { status: PostStatus; lang?: Lang }) {
  const entry = STATUSES[status]
  return (
    <span className={`font-mono text-[0.6875rem] uppercase tracking-[0.14em] ${STATUS_TEXT[entry.tone]}`}>
      {entry[lang]}
    </span>
  )
}
