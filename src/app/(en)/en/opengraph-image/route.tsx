import { ImageResponse } from 'next/og'
import { OgCard } from '@/components/seo/OgCard'
import { OG_SIZE } from '@/lib/metadata'

// ─────────────────────────────────────────────────────────────────────────────
// Card OG da marca em inglês, servido em /en/opengraph-image. Toda página /en/*
// aponta para cá via `buildMetadata({ lang: 'en' })`. Um link de /en
// compartilhado no LinkedIn não pode abrir com o card em português — é o mesmo
// desencontro que o hreflang existe para evitar.
//
// Route handler, não file convention: ver app/(pt)/opengraph-image/route.tsx.
// ─────────────────────────────────────────────────────────────────────────────

export const dynamic = 'force-static'

export function GET() {
  return new ImageResponse(
    (
      <OgCard
        badge="Technical SEO lab"
        title="Technical SEO for Next.js, implemented and measured"
        subtitle="Guides, free tools and experiments measured with real Search Console data."
      />
    ),
    OG_SIZE
  )
}
