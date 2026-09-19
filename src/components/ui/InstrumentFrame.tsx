import type { ReactNode } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// Destaque com "cantos de instrumento" — o substituto da barra lateral
// colorida. Moldura fina, preenchimento igual ao da superfície, e o rótulo
// carrega o acento (docs/design-system.md → Nota de laboratório).
//
// `corners="two"` usa só o par diagonal, como a caixa de estado do artigo.
// ─────────────────────────────────────────────────────────────────────────────

type Tone = 'primary' | 'accent'

const CORNER: Record<Tone, string> = {
  primary: 'border-primary',
  accent: 'border-accent',
}
const LABEL: Record<Tone, string> = {
  primary: 'text-primary',
  accent: 'text-accent',
}

export function InstrumentFrame({
  label,
  tone = 'primary',
  corners = 'four',
  as: Tag = 'div',
  className = '',
  children,
}: {
  label?: ReactNode
  tone?: Tone
  corners?: 'four' | 'two'
  as?: 'div' | 'aside' | 'section'
  className?: string
  children: ReactNode
}) {
  const c = `pointer-events-none absolute h-3.5 w-3.5 ${CORNER[tone]}`
  return (
    <Tag className={`relative border border-gray-strong bg-surface p-6 ${className}`}>
      <span aria-hidden="true" className={`${c} -left-px -top-px border-l-2 border-t-2`} />
      {corners === 'four' && <span aria-hidden="true" className={`${c} -right-px -top-px border-r-2 border-t-2`} />}
      {corners === 'four' && <span aria-hidden="true" className={`${c} -bottom-px -left-px border-b-2 border-l-2`} />}
      <span aria-hidden="true" className={`${c} -bottom-px -right-px border-b-2 border-r-2`} />
      {label && (
        <p className={`eyebrow mb-2.5 ${LABEL[tone]}`}>{label}</p>
      )}
      {children}
    </Tag>
  )
}

/**
 * Faixa de instrumento: pares rótulo/valor entre dois fios. Números medidos só
 * entram aqui com fonte ao lado (regra "SIM" do manifesto).
 */
export function InstrumentStrip({
  items,
  className = '',
}: {
  items: { label: string; value: ReactNode; tone?: 'accent' | 'primary' }[]
  className?: string
}) {
  return (
    <dl className={`flex flex-wrap border-y border-gray ${className}`}>
      {items.map(({ label, value, tone }) => (
        <div key={label} className="min-w-28 flex-1 py-3.5 pr-4">
          <dt className="eyebrow text-[0.625rem]">{label}</dt>
          <dd
            className={`font-display text-lg font-medium ${
              tone === 'accent' ? 'text-accent' : tone === 'primary' ? 'text-primary' : 'text-foreground'
            }`}
          >
            {value}
          </dd>
        </div>
      ))}
    </dl>
  )
}
