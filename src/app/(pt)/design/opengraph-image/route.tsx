import { ImageResponse } from 'next/og'
import { OgCard } from '@/components/seo/OgCard'
import { OG_SIZE } from '@/lib/metadata'
import { ogFonts } from '@/lib/og-fonts'

// Cartão OG da página do design. Route handler, não file convention: dentro de
// um route group a convenção ganharia hash na URL (ver app/(pt)/opengraph-image).

export const dynamic = 'force-static'

export function GET() {
  return new ImageResponse(
    (
      <OgCard
        badge="Colofão · design"
        title="Retrofuturismo suíço: por que este site é assim"
        subtitle="Bauhaus, De Stijl e a escola suíça, com a paleta medida e as regras que o CI verifica."
      />
    ),
    { ...OG_SIZE, fonts: ogFonts() }
  )
}
