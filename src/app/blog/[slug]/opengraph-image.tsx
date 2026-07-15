import { ImageResponse } from 'next/og'
import { notFound } from 'next/navigation'
import { getPostBySlug } from '@/lib/content'
import { OgCard } from '@/components/seo/OgCard'
import { OG_SIZE, OG_CONTENT_TYPE } from '@/lib/metadata'
import { site } from '@/lib/site'

// ─────────────────────────────────────────────────────────────────────────────
// Imagem OG por artigo: título do frontmatter + data + autor, sobre o cartão
// base da marca (OgCard). Sobrepõe a imagem padrão de app/opengraph-image.tsx.
// ─────────────────────────────────────────────────────────────────────────────

export const alt = `Artigo do ${site.name}`
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

interface ImageProps {
  params: Promise<{ slug: string }>
}

export default async function OpengraphImage({ params }: ImageProps) {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) notFound()

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
