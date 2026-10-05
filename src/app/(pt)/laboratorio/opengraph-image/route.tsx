import { ImageResponse } from 'next/og'
import { OgCard } from '@/components/seo/OgCard'
import { OG_SIZE } from '@/lib/metadata'
import { ogFonts } from '@/lib/og-fonts'

// Cartão OG de /laboratorio. Route handler, não file convention: dentro de um
// route group a convenção ganharia hash na URL (ver app/(pt)/opengraph-image).

export const dynamic = 'force-static'

export function GET() {
  return new ImageResponse(
    (
      <OgCard
        badge="Laboratório"
        kicker="Método público"
        title="Experimentos de SEO técnico, com o"
        highlight="registro aberto"
        subtitle="Hipótese antes do dado, URL secreta por assistente e cada desvio publicado."
        art={{ kind: 'mark', variant: 'arcs' }}
      />
    ),
    { ...OG_SIZE, fonts: ogFonts() }
  )
}
