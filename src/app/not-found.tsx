import Link from 'next/link'
import { ArrowRight, Home } from 'lucide-react'

/**
 * Página 404 (não encontrada) — App Router.
 *
 * Renderiza dentro do layout raiz (Header + main + Footer). Traz o conteúdo
 * centralizado no visual do site: numeral 404 na cor da marca, mensagem de
 * apoio e botões de ação (voltar à home / ler o guia).
 */
export default function NotFound() {
  return (
    <section className="container flex min-h-[55vh] flex-col items-center justify-center gap-6 py-16 text-center lg:py-24">
      <p className="font-bold leading-none text-primary text-7xl md:text-8xl lg:text-9xl">
        404
      </p>

      <div className="flex flex-col items-center gap-3">
        <h1 className="font-bold text-foreground text-2xl md:text-3xl lg:text-4xl">
          Página não encontrada
        </h1>
        <p className="max-w-md text-gray-600 text-sm leading-7 lg:text-base">
          A página que você procura pode ter sido removida, teve seu endereço
          alterado ou está temporariamente indisponível.
        </p>
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-center gap-3 lg:gap-4">
        {/* Primário — voltar à home */}
        <Link
          href="/"
          title="Voltar para o início"
          className="inline-flex items-center gap-2 rounded-full font-semibold
                     bg-primary-solid text-white
                     px-6 py-3.5 text-sm lg:text-base
                     transition duration-300 ease-in-out
                     hover:bg-primary-solid-hover
                     focus-visible:outline focus-visible:outline-2
                     focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <Home className="h-4 w-4" strokeWidth={2.5} />
          Voltar para o início
        </Link>

        {/* Secundário — ler o guia */}
        <Link
          href="/guia/seo-tecnico-nextjs"
          title="Guia de SEO técnico para Next.js"
          className="group inline-flex items-center gap-2 rounded-full font-semibold
                     border-[1.5px] border-gray text-foreground bg-surface
                     px-6 py-3.5 text-sm lg:text-base
                     transition duration-300 ease-in-out
                     hover:border-primary hover:text-primary
                     focus-visible:outline focus-visible:outline-2
                     focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Ler o guia de SEO técnico
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" strokeWidth={2.5} />
        </Link>
      </div>
    </section>
  )
}
