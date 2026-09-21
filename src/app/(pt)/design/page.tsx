import { BreadcrumbJsonLd, WebPageJsonLd } from '@/components/seo/JsonLd'
import { Manifesto } from '@/components/design/Manifesto'
import { MANIFESTO_REVISED } from '@/components/design/manifesto-copy'
import { buildMetadata } from '@/lib/metadata'

// ─────────────────────────────────────────────────────────────────────────────
// /design — o colofão: por que o site tem a cara que tem (docs/design-system.md
// é a referência de implementação; esta é a explicação pública). Par de
// hreflang de /en/design (lib/hreflang.ts). Linkado do rodapé e de /sobre.
// ─────────────────────────────────────────────────────────────────────────────

const PATH = '/design'
const TITLE = 'Design do site: retrofuturismo suíço'
const DESCRIPTION =
  'Por que o SEO Técnico é escuro, sem cantos arredondados e usa três formas no lugar de ícones: as escolas, a paleta medida e as regras que o CI verifica.'

export const metadata = buildMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: PATH,
  ogImage: { path: `${PATH}/opengraph-image`, alt: TITLE },
})

export default function DesignPage() {
  return (
    <>
      <WebPageJsonLd
        path={PATH}
        name={TITLE}
        description={DESCRIPTION}
        lang="pt-BR"
        dateModified={MANIFESTO_REVISED}
        imagePath={`${PATH}/opengraph-image`}
      />
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', path: '/' },
          { name: 'Design', path: PATH },
        ]}
      />
      <Manifesto lang="pt-BR" />
    </>
  )
}
