import type { Metadata } from 'next'
import { Suspense } from 'react'
import { BuscaResults } from '@/components/search/BuscaResults'

export const metadata: Metadata = {
  title: 'Busca',
  description: 'Busque artigos, ferramentas e páginas do SEO Técnico.',
  alternates: { canonical: '/busca' },
  robots: { index: false, follow: true },
}

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
