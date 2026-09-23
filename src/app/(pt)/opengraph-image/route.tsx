import { ImageResponse } from 'next/og'
import { OgCard } from '@/components/seo/OgCard'
import { OG_SIZE } from '@/lib/metadata'
import { ogFonts } from '@/lib/og-fonts'

// ─────────────────────────────────────────────────────────────────────────────
// Card OG da marca em português, servido em /opengraph-image.
//
// Route handler, e não a file convention `opengraph-image.tsx`, por causa dos
// route groups. O Next.js acrescenta um hash ao nome de toda rota de imagem de
// metadata cujo caminho passa por um group (`getMetadataRouteSuffix`, em
// next/dist/lib/metadata/get-metadata-route.js): dentro de app/(pt)/, a URL
// virava /opengraph-image-35ziq1. Toda página que aponta para /opengraph-image
// — o og:image de `buildMetadata` e o `image` do JSON-LD — passaria a apontar
// para um 404, e a URL que o LinkedIn já tem em cache mudaria. Um route handler
// não recebe sufixo: a URL fica exatamente a de produção.
//
// Sem a file convention, nada injeta og:image sozinho — toda página o declara
// via `buildMetadata`, inclusive a home.
// ─────────────────────────────────────────────────────────────────────────────

export const dynamic = 'force-static'

export function GET() {
  return new ImageResponse(
    (
      <OgCard
        kicker="Laboratório vivo"
        title="SEO técnico para desenvolvedores"
        highlight="Next.js"
        subtitle="Guias práticos, ferramentas gratuitas e experimentos medidos com dados reais."
        art={{ kind: 'mark', variant: 'beam' }}
      />
    ),
    { ...OG_SIZE, fonts: ogFonts() }
  )
}
