// ─────────────────────────────────────────────────────────────────────────────
// Marcas de fundo — prancha "Estudo de fundos" (docs/design-system.md → Arte).
//
// Família A, marca central: grande, atrás do cabeçalho de uma página
// cerimonial (home, guia, ferramentas). Nunca atrás do corpo de um artigo.
// Família B, canto morto: pequena, sempre cortada pela borda do bloco.
//
// Cor e opacidade são tokens: as formas usam foreground/primary/accent (tinta
// no claro, luz no escuro) e o SVG inteiro recebe --mark-central-opacity ou
// --mark-corner-opacity, que valem 7%/20% no escuro e 8%/24% no claro — tinta
// escura sobre papel pesa mais que tinta clara sobre grafite.
//
// Uso: o bloco pai tem `relative overflow-hidden`; o conteúdo, `relative`,
// para pintar por cima (elemento posicionado vem antes no DOM). Posição
// absoluta e tamanho fixo: zero CLS. aria-hidden: é decoração.
// ─────────────────────────────────────────────────────────────────────────────

export type CentralVariant = 'beam' | 'axonometric' | 'arcs'

/** A1 feixe construtivista · A2 volume axonométrico · A3 campo de arcos Bauhaus. */
export function CentralMark({ variant, className = '' }: { variant: CentralVariant; className?: string }) {
  return (
    <svg
      viewBox="0 0 400 400"
      aria-hidden="true"
      focusable="false"
      data-mark="central"
      className={`mark-central pointer-events-none absolute ${className}`}
    >
      {variant === 'beam' && (
        <>
          <g strokeWidth="2" fill="none" className="stroke-primary">
            <line x1="20" y1="380" x2="380" y2="60" />
            <line x1="20" y1="330" x2="380" y2="10" />
            <line x1="60" y1="395" x2="400" y2="95" />
            <line x1="100" y1="400" x2="400" y2="140" />
          </g>
          <circle cx="200" cy="200" r="150" fill="none" strokeWidth="3" className="stroke-foreground" />
          <circle cx="200" cy="200" r="86" fill="none" strokeWidth="3" className="stroke-foreground" />
          <path d="M200 50 A 150 150 0 0 1 350 200 L200 200 Z" fillOpacity="0.6" className="fill-accent" />
          <rect x="26" y="196" width="348" height="8" transform="rotate(-28 200 200)" className="fill-foreground" />
        </>
      )}
      {variant === 'axonometric' && (
        <>
          <g strokeWidth="2" fill="none" className="stroke-foreground">
            <polygon points="60,220 200,150 340,220 200,290" />
            <polygon points="60,220 60,140 200,70 200,150" />
            <polygon points="340,220 340,140 200,70 200,150" />
          </g>
          <rect x="150" y="250" width="180" height="90" transform="skewY(-20)" fillOpacity="0.5" className="fill-primary" />
          <circle cx="200" cy="150" r="54" fill="none" strokeWidth="3" className="stroke-accent" />
          <line x1="20" y1="340" x2="380" y2="340" strokeWidth="3" className="stroke-foreground" />
        </>
      )}
      {variant === 'arcs' && (
        <>
          <g fill="none" strokeWidth="3" className="stroke-foreground">
            <path d="M40 360 A 320 320 0 0 1 360 40" />
            <path d="M40 280 A 240 240 0 0 1 280 40" />
            <path d="M40 200 A 160 160 0 0 1 200 40" />
            <path d="M40 120 A 80 80 0 0 1 120 40" />
          </g>
          <path d="M40 360 A 320 320 0 0 1 360 40 L360 360 Z" fillOpacity="0.4" className="fill-primary" />
          <rect x="248" y="248" width="112" height="112" fillOpacity="0.7" className="fill-accent" />
          <circle cx="304" cy="120" r="34" className="fill-foreground" />
        </>
      )}
    </svg>
  )
}

export type CornerVariant = 'arc' | 'dots' | 'ruler' | 'crosshair'

/** B1 arco sangrando · B2 malha de pontos · B3 régua de goteira · B5 mira de registro. */
export function CornerMark({ variant, className = '' }: { variant: CornerVariant; className?: string }) {
  const common = {
    'aria-hidden': true,
    focusable: false,
    'data-mark': 'corner',
    className: `mark-corner pointer-events-none absolute ${className}`,
  } as const
  if (variant === 'arc') {
    return (
      <svg viewBox="0 0 200 200" {...common}>
        <circle cx="100" cy="100" r="96" fill="none" strokeWidth="3" className="stroke-primary" />
        <circle cx="100" cy="100" r="64" fill="none" strokeWidth="3" strokeOpacity="0.7" className="stroke-primary" />
        <path d="M100 4 A 96 96 0 0 1 196 100 L100 100 Z" fillOpacity="0.45" className="fill-primary" />
      </svg>
    )
  }
  if (variant === 'dots') {
    const rows: [number, number[]][] = [
      [10, [10, 40, 70, 100]],
      [40, [10, 40, 70, 100, 130]],
      [70, [10, 40, 70, 100, 130]],
      [100, [10, 40, 70]],
    ]
    return (
      <svg viewBox="0 0 160 120" {...common}>
        <g className="fill-foreground">
          {rows.flatMap(([y, xs]) => xs.map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="3" />))}
        </g>
        <circle cx="70" cy="40" r="7" className="fill-accent" />
      </svg>
    )
  }
  if (variant === 'ruler') {
    return (
      <svg viewBox="0 0 60 210" {...common}>
        <line x1="30" y1="0" x2="30" y2="210" strokeWidth="2" strokeOpacity="0.6" className="stroke-foreground" />
        <g strokeWidth="2" className="stroke-foreground">
          {[20, 45, 70, 95, 120, 145, 170, 195].map((y, i) => (
            <line key={y} x1={i % 4 === 0 ? 18 : 24} y1={y} x2={i % 4 === 0 ? 42 : 36} y2={y} />
          ))}
        </g>
        <line x1="14" y1="120" x2="46" y2="120" strokeWidth="3" className="stroke-primary" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 120 120" {...common}>
      <g strokeWidth="2" fill="none" className="stroke-foreground">
        <circle cx="60" cy="60" r="34" />
        <line x1="60" y1="0" x2="60" y2="42" />
        <line x1="60" y1="78" x2="60" y2="120" />
        <line x1="0" y1="60" x2="42" y2="60" />
        <line x1="78" y1="60" x2="120" y2="60" />
      </g>
      <circle cx="60" cy="60" r="5" className="fill-accent" />
    </svg>
  )
}

/** B4 numeral fantasma: um número enorme cortado pela borda (404, índice de seção). */
export function GhostNumeral({ children, className = '' }: { children: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      data-mark="corner"
      className={`mark-ghost pointer-events-none absolute select-none font-display font-bold leading-none tracking-[-0.05em] text-foreground ${className}`}
    >
      {children}
    </span>
  )
}

/** B6 faixa cortada: a faixa de alerta, girada e sangrando pelo canto. */
export function CutStripe({ className = '' }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      data-mark="corner"
      className={`mark-corner hazard-stripe pointer-events-none absolute h-28 w-56 -rotate-12 ${className}`}
    />
  )
}
