import { Suspense } from 'react'
import { BuscaResults } from '@/components/search/BuscaResults'
import { buildMetadata } from '@/lib/metadata'
import { buildSearchIndex } from '@/lib/search-index'

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
    <section className="container-xl py-12 lg:py-16">
      <p className="eyebrow mb-5 flex items-center gap-3.5 text-primary">
        <span aria-hidden="true" className="h-[3px] w-10 bg-primary" />
        Busca no site
      </p>
      <h1 className="font-display text-[clamp(2.25rem,1.4rem+3.2vw,4rem)] font-bold leading-[1.02] tracking-[-0.025em] text-foreground">Busca</h1>
      <Suspense>
        <BuscaResults initialQuery="" items={buildSearchIndex()} />
      </Suspense>
    </section>
  )
}
