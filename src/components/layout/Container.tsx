import type { ElementType, HTMLAttributes } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// Variantes de container (espelha o utility.css de referência)
//
//  default → width: 80%, max-width: 1280px  (conteúdo padrão de página)
//  wide    → width: 80%, max-width: 1600px  (seções largas)
//  xl      → width: 90%, max-width: 1600px  (header, banners full-bleed)
//
// Em ≤ 768px: default e wide passam para 90%
// Em ≤ 350px: todos passam para 95%
// ─────────────────────────────────────────────────────────────────────────────

type Variant = 'default' | 'wide' | 'xl' | 'xxl'

const variantClass: Record<Variant, string> = {
  default: 'container',
  wide:    'container-wide',
  xl:      'container-xl',
  xxl:      'container-xxl',
}

interface ContainerProps extends HTMLAttributes<HTMLElement> {
  /** Variante de largura máxima. Default: 'default' (80% / 1280px) */
  variant?: Variant
  /** Elemento HTML a renderizar. Default: 'div' */
  as?: ElementType
}

export function Container({
  variant = 'default',
  as: Tag = 'div',
  className,
  children,
  ...props
}: ContainerProps) {
  const classes = [variantClass[variant], className].filter(Boolean).join(' ')

  return (
    <Tag className={classes} {...props}>
      {children}
    </Tag>
  )
}
