import { ImageResponse } from 'next/og'
import { getAllPosts, getPostBySlug } from '@/lib/content'
import { getCategory } from '@/lib/categories'
import { OgCard } from '@/components/seo/OgCard'
import { OG_SIZE } from '@/lib/metadata'
import { ogFonts } from '@/lib/og-fonts'

// ─────────────────────────────────────────────────────────────────────────────
// Imagem OG por artigo: título do frontmatter, eixo e data, sobre o cartão
// base da marca (OgCard). Servida em /blog/<slug>/opengraph-image.
//
// Route handler, não file convention: dentro do route group (pt) a convenção
// geraria /blog/<slug>/opengraph-image-18vth1, quebrando o `image` do JSON-LD do
// artigo e a URL já compartilhada. Ver app/(pt)/opengraph-image/route.tsx.
// ─────────────────────────────────────────────────────────────────────────────

export const dynamic = 'force-static'

// Mesma regra da página do artigo: só slugs publicados; o resto é 404.
export const dynamicParams = false

export function generateStaticParams() {
  return getAllPosts().map(({ frontmatter }) => ({ slug: frontmatter.slug }))
}

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) return new Response('Not found', { status: 404 })

  const { frontmatter, derived } = post
  const axis = frontmatter.category ? ` · ${getCategory(frontmatter.category).short['pt-BR']}` : ''

  return new ImageResponse(
    (
      <OgCard
        badge={`Artigo${axis}`}
        title={frontmatter.title}
        subtitle={`Publicado ${frontmatter.datePublished} · ${derived.readingTime} min de leitura`}
      />
    ),
    { ...OG_SIZE, fonts: ogFonts() }
  )
}
