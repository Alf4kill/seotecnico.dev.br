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
        badge="Colophon · design"
        title="Swiss retro-futurism: why this site looks like this"
        subtitle="Bauhaus, De Stijl and the Swiss school, with a measured palette and rules CI enforces."
      />
    ),
    { ...OG_SIZE, fonts: ogFonts() }
  )
}
