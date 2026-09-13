import Link from 'next/link'
import { ArrowRight, Home } from 'lucide-react'

/**
 * Conteúdo da página 404, compartilhado pelas duas portas por onde um 404
 * chega:
 *
 * - `app/(pt)/not-found.tsx` — `notFound()` chamado dentro de uma rota
 *   portuguesa (ex.: slug de artigo inexistente). Renderiza dentro do root
 *   layout português.
 * - `app/global-not-found.tsx` — URL que não casa com rota nenhuma. Com um root
 *   layout por idioma não existe layout único onde compor esse 404, e a URL
 *   pode ser de qualquer um dos dois sites; daí a versão `bilingual`, que dá ao
 *   leitor de /en/qualquer-coisa uma saída no idioma dele.
 */
export function NotFoundContent({ bilingual = false }: { bilingual?: boolean }) {
  return (
    <section className="container flex min-h-[55vh] flex-col items-center justify-center gap-6 py-16 text-center lg:py-24">
      <p className="font-bold leading-none text-primary text-7xl md:text-8xl lg:text-9xl">
        404
      </p>

      <div className="flex flex-col items-center gap-3">
        <h1 className="font-bold text-foreground text-2xl md:text-3xl lg:text-4xl">
          Página não encontrada
        </h1>
        <p className="max-w-md text-muted text-sm leading-7 lg:text-base">
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

      {bilingual && (
        // Um único <h1> por página (§6): a versão inglesa é texto de apoio,
        // não um segundo título.
        <p lang="en" className="mt-4 max-w-md border-t border-gray pt-6 text-sm leading-7 text-muted">
          Page not found. Looking for the English version of this site?{' '}
          <Link
            href="/en"
            hrefLang="en"
            prefetch={false}
            title="SEO Técnico — English home"
            className="font-semibold text-primary hover:text-primary-dark transition-colors"
          >
            Go to the English home
          </Link>
          .
        </p>
      )}
    </section>
  )
}
