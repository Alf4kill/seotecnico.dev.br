import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

export interface Crumb {
  label: string
  href?: string
}

/** Esquema de cores: `dark` para fundos claros (padrão); `light` para banners escuros. */
type Variant = 'dark' | 'light'

const styles: Record<Variant, { nav: string; link: string; last: string; sep: string }> = {
  dark: {
    nav:  'text-foreground/50',
    link: 'hover:text-primary transition duration-300',
    last: 'font-medium text-foreground/80',
    sep:  'text-foreground/30',
  },
  light: {
    nav:  'text-white',
    link: 'hover:text-primary transition duration-300',
    last: 'font-medium text-white',
    sep:  'text-white/50',
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// Trilha de navegação (breadcrumb). O último item é a página atual (sem link).
// ─────────────────────────────────────────────────────────────────────────────

export function Breadcrumbs({ items, variant = 'dark' }: { items: Crumb[]; variant?: Variant }) {
  const s = styles[variant]
  return (
    <nav aria-label="Trilha de navegação" className={`flex flex-wrap items-center gap-1.5 text-sm ${s.nav}`}>
      {items.map((item, i) => {
        const last = i === items.length - 1
        return (
          <span key={i} className="flex items-center gap-1.5">
            {item.href && !last ? (
              <Link href={item.href} className={s.link} title={item.label}>
                {item.label}
              </Link>
            ) : (
              <span className={last ? s.last : ''} aria-current={last ? 'page' : undefined}>
                {item.label}
              </span>
            )}
            {!last && <ChevronRight className={`h-3.5 w-3.5 ${s.sep}`} />}
          </span>
        )
      })}
    </nav>
  )
}
