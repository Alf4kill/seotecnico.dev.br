import { ImageResponse } from 'next/og'
import { OgCard } from '@/components/seo/OgCard'
import { OG_SIZE } from '@/lib/metadata'
import { ogFonts } from '@/lib/og-fonts'

// Cartão OG de /en/project. Route handler, não file convention: dentro de um
// route group a convenção ganharia hash na URL (ver app/(pt)/opengraph-image).

export const dynamic = 'force-static'

export function GET() {
  return new ImageResponse(
    (
      <OgCard
        badge="Project"
        kicker="How the site is made"
        title="How this site is built and"
        highlight="run"
        subtitle="AI use, how each page is made and the design decisions, with the file or commit that backs each one."
        art={{ kind: 'mark', variant: 'arcs' }}
      />
    ),
    { ...OG_SIZE, fonts: ogFonts() }
  )
}
