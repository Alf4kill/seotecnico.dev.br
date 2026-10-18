import { ImageResponse } from 'next/og'
import { OgCard } from '@/components/seo/OgCard'
import { OG_SIZE } from '@/lib/metadata'
import { ogFonts } from '@/lib/og-fonts'

// Cartão OG de /en/lab, par de /laboratorio. Route handler pelo mesmo motivo
// do cartão português (ver app/(pt)/opengraph-image).

export const dynamic = 'force-static'

export function GET() {
  return new ImageResponse(
    (
      <OgCard
        badge="Lab"
        kicker="Public method"
        title="Technical SEO experiments, with the"
        highlight="record open"
        subtitle="Hypothesis before the data, a secret URL per assistant and every deviation published."
        art={{ kind: 'mark', variant: 'arcs' }}
      />
    ),
    { ...OG_SIZE, fonts: ogFonts() }
  )
}
