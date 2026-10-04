import { ImageResponse } from 'next/og'
import { getAllEnglishPosts, getEnglishPostBySlug } from '@/lib/content'
import { getCategory } from '@/lib/categories'
import { sceneForPost } from '@/lib/art'
import { OgCard } from '@/components/seo/OgCard'
import { OG_SIZE } from '@/lib/metadata'
import { ogFonts } from '@/lib/og-fonts'

// Cartão OG de cada artigo em inglês, servido em /en/blog/<slug>/opengraph-image.
// Mesmo cartão do blog português, com os rótulos em inglês. Route handler, não
// file convention: dentro de um route group a convenção ganharia hash na URL
// (ver app/(pt)/opengraph-image/route.tsx).

export const dynamic = 'force-static'
export const dynamicParams = false

export function generateStaticParams() {
  return getAllEnglishPosts().map(({ frontmatter }) => ({ slug: frontmatter.slug }))
}

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = getEnglishPostBySlug(slug)
  if (!post) return new Response('Not found', { status: 404 })

  const { frontmatter, derived } = post
  const category = frontmatter.category ? getCategory(frontmatter.category) : undefined

  return new ImageResponse(
    (
      <OgCard
        badge="Article"
        kicker={category?.label.en ?? 'Article'}
        shape={category}
        title={frontmatter.title}
        meta={`${frontmatter.datePublished} · ${derived.readingTime} min`}
        art={
          frontmatter.category
            ? { kind: 'scene', id: sceneForPost(frontmatter.category, frontmatter.translationOf ?? slug) }
            : { kind: 'mark', variant: 'beam' }
        }
      />
    ),
    { ...OG_SIZE, fonts: ogFonts() }
  )
}
