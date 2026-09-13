import { ImageResponse } from 'next/og'
import { getAllPosts, getPostBySlug } from '@/lib/content'
import { OgCard } from '@/components/seo/OgCard'
import { OG_SIZE } from '@/lib/metadata'

// ─────────────────────────────────────────────────────────────────────────────
// Imagem OG por artigo: título do frontmatter + data, sobre o cartão base da
// marca (OgCard). Servida em /blog/<slug>/opengraph-image.
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

  const { frontmatter } = post
  const published = new Date(`${frontmatter.datePublished}T00:00:00`).toLocaleDateString('pt-BR')

  return new ImageResponse(
    (
      <OgCard
        badge="Artigo"
        title={frontmatter.title}
        subtitle={`Publicado em ${published}`}
      />
    ),
    OG_SIZE
  )
}
