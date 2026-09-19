import { site } from '@/lib/site'
import { colors } from '@/lib/design-tokens'

// ─────────────────────────────────────────────────────────────────────────────
// OgCard — layout base das imagens Open Graph (1200×630) geradas com next/og.
//
// Renderizado pelo Satori, que suporta só um subconjunto de CSS: flexbox
// (sem grid), sem classes Tailwind nem CSS custom properties — todo estilo é
// inline, as cores vêm em hex de lib/design-tokens.ts (espelho testado de
// globals.css) e todo elemento com múltiplos filhos precisa de display:flex.
// As fontes (Space Grotesk, IBM Plex Mono) vêm de lib/og-fonts.ts e têm de ser
// passadas ao ImageResponse por quem renderiza este cartão.
//
// Marca e domínio dentro da imagem (§14: o cartão compartilhado carrega a
// autoria mesmo quando copiado). Sem canto arredondado, sem degradê — as
// regras do sistema valem também aqui.
//
// Consumido pelos route handlers de card: app/(pt)/opengraph-image (marca PT),
// app/(en)/en/opengraph-image (marca EN) e app/(pt)/blog/[slug]/opengraph-image
// (por artigo). Dimensões e alt ficam em /lib/metadata.ts.
// ─────────────────────────────────────────────────────────────────────────────

const MONO = 'IBM Plex Mono'
const DISPLAY = 'Space Grotesk'

export interface OgCardProps {
  /** Rótulo de instrumento no canto (ex.: "Artigo · Core Web Vitals"). */
  badge: string
  title: string
  subtitle?: string
}

/** As três formas primárias do sistema, na ordem do manifesto. */
function Shapes() {
  return (
    <svg width="176" height="40" viewBox="0 0 176 40">
      <circle cx="20" cy="20" r="20" fill={colors.primary} />
      <rect x="52" y="0" width="40" height="40" fill={colors.accent} />
      <polygon points="126,0 148,40 104,40" fill={colors.danger} />
      <rect x="160" y="0" width="16" height="40" fill={colors.reference} />
    </svg>
  )
}

export function OgCard({ badge, title, subtitle }: OgCardProps) {
  const domain = new URL(site.url).host

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: colors.background,
        fontFamily: MONO,
      }}
    >
      {/* Faixa de topo: ciano, âmbar e vermelho em pesos desiguais (De Stijl). */}
      <div style={{ display: 'flex', height: 10 }}>
        <div style={{ flexGrow: 1, backgroundColor: colors.primary }} />
        <div style={{ width: 220, backgroundColor: colors.accent }} />
        <div style={{ width: 110, backgroundColor: colors.danger }} />
      </div>

      <div
        style={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '56px 72px 60px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
            <div style={{ fontFamily: DISPLAY, fontSize: 34, fontWeight: 700, color: colors.foreground }}>
              SEO TÉCNICO
            </div>
            <div style={{ fontSize: 20, letterSpacing: 3, color: colors.primary }}>.DEV.BR</div>
          </div>
          <div style={{ fontSize: 20, letterSpacing: 3, textTransform: 'uppercase', color: colors.accent }}>
            {badge}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
          <div style={{ width: 72, height: 5, backgroundColor: colors.primary }} />
          <div
            style={{
              fontFamily: DISPLAY,
              fontSize: title.length > 42 ? 62 : 74,
              fontWeight: 700,
              lineHeight: 1.02,
              letterSpacing: -2,
              color: colors.foreground,
              maxWidth: 1040,
            }}
          >
            {title}
          </div>
          {subtitle && (
            <div style={{ fontSize: 24, lineHeight: 1.45, color: colors.muted, maxWidth: 980 }}>{subtitle}</div>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: `1px solid ${colors.ruleStrong}`,
            paddingTop: 26,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontSize: 22, color: colors.primary }}>{domain}</div>
            <div style={{ fontSize: 20, color: colors.muted }}>{site.author.name}</div>
          </div>
          <Shapes />
        </div>
      </div>
    </div>
  )
}
