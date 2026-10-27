import { ImageResponse } from 'next/og'
import { OgCard } from '@/components/seo/OgCard'
import { OG_SIZE } from '@/lib/metadata'
import { ogFonts } from '@/lib/og-fonts'

// Cartão OG de /projeto. Route handler, não file convention: dentro de um
// route group a convenção ganharia hash na URL (ver app/(pt)/opengraph-image).

export const dynamic = 'force-static'

export function GET() {
  return new ImageResponse(
    (
      <OgCard
        badge="Projeto"
        kicker="Como o site é feito"
        title="Como este site é construído e"
        highlight="mantido"
        subtitle="Uso de IA, processo de cada página e decisões de design, com o arquivo ou commit que comprova cada uma."
        art={{ kind: 'mark', variant: 'arcs' }}
      />
    ),
    { ...OG_SIZE, fonts: ogFonts() }
  )
}
