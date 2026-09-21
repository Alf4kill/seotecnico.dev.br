import Link from 'next/link'
import type { ComponentProps } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// Ações do sistema (docs/design-system.md → Componentes):
//
// - solid   — ciano cheio, texto grafite. A ação principal da tela; uma só.
// - outline — fio forte, texto claro. Ação secundária.
// - link    — âmbar, sem caixa, com seta. Ação terciária ("Assinar o RSS →").
//
// Todas em mono caixa-alta, ângulo reto, 44–48px de alvo de toque.
// ─────────────────────────────────────────────────────────────────────────────

export type ButtonVariant = 'solid' | 'outline' | 'link'

const BASE =
  'inline-flex items-center justify-center gap-2.5 font-mono text-[0.8125rem] font-semibold uppercase tracking-[0.08em] transition-colors'

const VARIANTS: Record<ButtonVariant, string> = {
  solid: 'min-h-12 px-6 bg-primary-solid text-on-primary hover:bg-primary-solid-hover',
  outline: 'min-h-12 px-6 border border-gray-strong text-foreground hover:border-primary hover:text-primary',
  link: 'min-h-11 text-accent hover:text-foreground',
}

export function buttonClasses(variant: ButtonVariant = 'solid', className = ''): string {
  return `${BASE} ${VARIANTS[variant]} ${className}`.trim()
}

type ButtonLinkProps = ComponentProps<typeof Link> & { variant?: ButtonVariant }

export function ButtonLink({ variant = 'solid', className, children, ...props }: ButtonLinkProps) {
  return (
    <Link {...props} className={buttonClasses(variant, className)}>
      {children}
      {variant === 'link' && <span aria-hidden="true">→</span>}
    </Link>
  )
}
