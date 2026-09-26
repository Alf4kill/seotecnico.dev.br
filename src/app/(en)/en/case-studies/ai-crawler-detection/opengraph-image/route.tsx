import { ImageResponse } from 'next/og'
import { OgCard } from '@/components/seo/OgCard'
import { OG_SIZE } from '@/lib/metadata'
import { ogFonts } from '@/lib/og-fonts'
import { sceneForPost } from '@/lib/art'

// Cartão OG do case study de crawlers. Route handler, não file convention:
// dentro de um route group a convenção ganharia hash na URL
// (ver app/(pt)/opengraph-image). Mesma cena que o ArticleLayout escolhe.

export const dynamic = 'force-static'

export function GET() {
  return new ImageResponse(
    (
      <OgCard
        badge="Case study"
        kicker="Measurement"
        shape={{ shape: 'circle', tone: 'primary' }}
        title="Detecting AI crawlers on a live site"
        subtitle="A 57-day pilot, six silent instrument defects and a positive control with ChatGPT and Claude."
        art={{ kind: 'scene', id: sceneForPost('medicao', 'ai-crawler-detection') }}
      />
    ),
    { ...OG_SIZE, fonts: ogFonts() }
  )
}
