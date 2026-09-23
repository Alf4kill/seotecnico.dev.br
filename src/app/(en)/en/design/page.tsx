import { BreadcrumbJsonLd, WebPageJsonLd } from '@/components/seo/JsonLd'
import { Manifesto } from '@/components/design/Manifesto'
import { MANIFESTO_REVISED } from '@/components/design/manifesto-copy'
import { buildMetadata } from '@/lib/metadata'

// ─────────────────────────────────────────────────────────────────────────────
// /en/design — the design colophon in English; hreflang pair of /design.
// The English layer exists for the portfolio reader (a design rationale with
// measured contrast is exactly what that reader checks), not to rank.
// ─────────────────────────────────────────────────────────────────────────────

const PATH = '/en/design'
const TITLE = 'Site design: Swiss retro-futurism'
const DESCRIPTION =
  'Why SEO Técnico is dark by default, has a light theme, square corners and three shapes instead of icons: the schools, measured palette and CI rules.'

export const metadata = buildMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: PATH,
  lang: 'en',
  ogImage: { path: `${PATH}/opengraph-image`, alt: TITLE },
})

export default function DesignEnPage() {
  return (
    <>
      <WebPageJsonLd
        path={PATH}
        name={TITLE}
        description={DESCRIPTION}
        lang="en"
        dateModified={MANIFESTO_REVISED}
        imagePath={`${PATH}/opengraph-image`}
      />
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', path: '/en' },
          { name: 'Design', path: PATH },
        ]}
      />
      <Manifesto lang="en" />
    </>
  )
}
