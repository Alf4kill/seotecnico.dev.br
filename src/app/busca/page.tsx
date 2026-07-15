import { Suspense } from 'react'
import { BuscaResults } from '@/components/search/BuscaResults'
import { buildMetadata } from '@/lib/metadata'

export const metadata = buildMetadata({
  title: 'Busca',
  description: 'Busque artigos, ferramentas e páginas do SEO Técnico.',
  path: '/busca',
  noindex: true,
})

// Página estática: a query (?q=) é lida no cliente via useSearchParams,
// dentro de <BuscaResults>, mantendo a rota 100% SSG.
export default function BuscaPage() {
  return (
    <section className="container py-12 lg:py-16">
      <h1 className="font-bold text-foreground text-3xl md:text-4xl">Busca</h1>
      <Suspense>
        <BuscaResults initialQuery="" />
      </Suspense>
    </section>
  )
}
