import { ImageResponse } from 'next/og'
import { OgCard } from '@/components/seo/OgCard'
import { OG_SIZE } from '@/lib/metadata'
import { ogFonts } from '@/lib/og-fonts'

// Cartão OG de /en/case-studies. Route handler, não file convention: dentro de
// um route group a convenção ganharia hash na URL (ver app/(pt)/opengraph-image).

export const dynamic = 'force-static'

export function GET() {
  return new ImageResponse(
    (
      <OgCard
        badge="Case studies"
        kicker="Problem, fix, measurement"
        title="Technical SEO, implemented and"
        highlight="measured"
        subtitle="LCP 4.9 s → 0.9 s, an SEO merge gate, AI crawler detection and a bilingual layer."
        art={{ kind: 'mark', variant: 'arcs' }}
      />
    ),
    { ...OG_SIZE, fonts: ogFonts() }
  )
}
