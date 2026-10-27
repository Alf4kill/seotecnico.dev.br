import { ImageResponse } from 'next/og'
import { getProjectEntries, getProjectEntry } from '@/lib/content'
import { OgCard } from '@/components/seo/OgCard'
import { OG_SIZE } from '@/lib/metadata'
import { ogFonts } from '@/lib/og-fonts'

// Cartão OG por entrada do projeto, servido em /projeto/<slug>/opengraph-image.
// Route handler, não file convention: dentro de um route group a convenção
// ganharia hash na URL (ver app/(pt)/opengraph-image).

export const dynamic = 'force-static'

export const dynamicParams = false

export function generateStaticParams() {
  return getProjectEntries().map(({ frontmatter }) => ({ slug: frontmatter.slug }))
}

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const entry = getProjectEntry(slug)
  if (!entry) return new Response('Not found', { status: 404 })

  const { frontmatter, derived } = entry

  return new ImageResponse(
    (
      <OgCard
        badge="Projeto"
        kicker="Como o site é feito"
        title={frontmatter.title}
        meta={`${frontmatter.datePublished} · ${derived.readingTime} min`}
        art={{ kind: 'mark', variant: 'arcs' }}
      />
    ),
    { ...OG_SIZE, fonts: ogFonts() }
  )
}
