import { ImageResponse } from 'next/og'
import { getProjectEntries, getProjectEntry } from '@/lib/content'
import { OgCard } from '@/components/seo/OgCard'
import { OG_SIZE } from '@/lib/metadata'
import { ogFonts } from '@/lib/og-fonts'

// Cartão OG por entrada inglesa do projeto, em /en/project/<slug>/opengraph-image.
// Route handler, não file convention (ver app/(pt)/opengraph-image).

export const dynamic = 'force-static'

export const dynamicParams = false

export function generateStaticParams() {
  return getProjectEntries('en').map(({ frontmatter }) => ({ slug: frontmatter.slug }))
}

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const entry = getProjectEntry(slug, 'en')
  if (!entry) return new Response('Not found', { status: 404 })

  const { frontmatter, derived } = entry

  return new ImageResponse(
    (
      <OgCard
        badge="Project"
        kicker="How the site is made"
        title={frontmatter.title}
        meta={`${frontmatter.datePublished} · ${derived.readingTime} min`}
        art={{ kind: 'mark', variant: 'arcs' }}
      />
    ),
    { ...OG_SIZE, fonts: ogFonts() }
  )
}
