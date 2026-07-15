import { ImageResponse } from 'next/og'
import { OgCard } from '@/components/seo/OgCard'
import { OG_SIZE, OG_CONTENT_TYPE, OG_BRAND_ALT } from '@/lib/metadata'

// ─────────────────────────────────────────────────────────────────────────────
// Imagem OG padrão do site (marca). Por file convention, aplica-se a todas as
// rotas que não definem a própria imagem (blog/[slug] define a sua).
// twitter:image não é declarado: o crawler do X usa og:image como fallback,
// o que evita divergência entre as duas tags nas rotas com imagem própria.
// ─────────────────────────────────────────────────────────────────────────────

export const alt = OG_BRAND_ALT
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <OgCard
        badge="Laboratório de SEO técnico"
        title="SEO técnico para desenvolvedores Next.js"
        subtitle="Guias práticos, ferramentas gratuitas e experimentos medidos com dados reais."
      />
    ),
    OG_SIZE
  )
}
