import { site } from '@/lib/site'

// ─────────────────────────────────────────────────────────────────────────────
// OgCard — layout base das imagens Open Graph (1200×630) geradas com next/og.
//
// Renderizado pelo Satori, que suporta só um subconjunto de CSS: flexbox
// (sem grid), sem classes Tailwind — todo estilo é inline e todo elemento
// com múltiplos filhos precisa de display:flex explícito.
// Consumido por app/opengraph-image.tsx (marca) e
// app/blog/[slug]/opengraph-image.tsx (por artigo).
// Dimensões e alt ficam em /lib/metadata.ts (compartilhados com buildMetadata).
// ─────────────────────────────────────────────────────────────────────────────

const colors = {
  background: '#111827', // foreground do site, usado como fundo escuro
  surface: '#1F2937',
  primary: '#2563EB',
  primaryLight: '#60A5FA',
  text: '#F9FAFB',
  muted: '#9CA3AF',
}

export interface OgCardProps {
  /** Rótulo pequeno acima do título (ex.: "Artigo" ou o domínio). */
  badge: string
  title: string
  subtitle?: string
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
        justifyContent: 'space-between',
        padding: 72,
        backgroundColor: colors.background,
        backgroundImage: `linear-gradient(135deg, ${colors.background} 55%, #1E3A8A 100%)`,
        fontFamily: 'sans-serif',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 56,
            height: 56,
            borderRadius: 12,
            backgroundColor: colors.primary,
            color: colors.text,
            fontSize: 30,
            fontWeight: 700,
          }}
        >
          {'</>'}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 30, fontWeight: 700, color: colors.text }}>{site.name}</div>
          <div style={{ fontSize: 20, color: colors.muted }}>{badge}</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div
          style={{
            fontSize: title.length > 42 ? 54 : 64,
            fontWeight: 700,
            lineHeight: 1.15,
            color: colors.text,
            maxWidth: 1000,
          }}
        >
          {title}
        </div>
        {subtitle && (
          <div style={{ fontSize: 28, lineHeight: 1.4, color: colors.muted, maxWidth: 940 }}>
            {subtitle}
          </div>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: `2px solid ${colors.surface}`,
          paddingTop: 28,
        }}
      >
        <div style={{ fontSize: 24, fontWeight: 700, color: colors.primaryLight }}>{domain}</div>
        <div style={{ fontSize: 24, color: colors.muted }}>{site.author.name}</div>
      </div>
    </div>
  )
}
