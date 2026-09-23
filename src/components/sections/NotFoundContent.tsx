import Link from 'next/link'
import { ButtonLink } from '@/components/ui/Button'
import { Scene } from '@/components/art/Art'
import { PAGE_ART } from '@/lib/art'

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
    <section className="container-xl grid min-h-[55vh] items-center gap-10 py-16 lg:grid-cols-12 lg:gap-6 lg:py-24">
      {/* O código de status em escala de cartaz — hierarquia por tamanho, não
          por cor — sobre a cena "Campo de lápides": as páginas que já não
          existem (docs/design-system.md → Arte). */}
      <div className="flex flex-col gap-6 lg:col-span-5">
        <p
          aria-hidden="true"
          className="font-display text-[clamp(6rem,3rem+14vw,13rem)] font-bold leading-[0.8] tracking-[-0.05em] text-primary"
        >
          404
        </p>
        <Scene id={PAGE_ART.notFound} className="w-full max-w-[22.5rem]" />
      </div>

      <div className="flex flex-col gap-5 lg:col-span-7">
        <p className="eyebrow text-accent">Sinal perdido · 404</p>
        <h1 className="font-display text-[clamp(2rem,1.3rem+2.6vw,3.25rem)] font-bold leading-[1.05] tracking-[-0.025em] text-foreground">
          Página não encontrada
        </h1>
        <p className="max-w-md text-base leading-relaxed text-muted">
          A página que você procura pode ter sido removida, teve seu endereço
          alterado ou está temporariamente indisponível.
        </p>

        <div className="flex flex-wrap gap-4 pt-2">
          <ButtonLink href="/" title="Voltar para o início">
            Voltar para o início
          </ButtonLink>
          <ButtonLink href="/guia/seo-tecnico-nextjs" variant="outline" title="Guia de SEO técnico para Next.js">
            Ler o guia de SEO técnico
          </ButtonLink>
        </div>

        {bilingual && (
          // Um único <h1> por página (§6): a versão inglesa é texto de apoio,
          // não um segundo título.
          <p lang="en" className="mt-2 max-w-md border-t border-gray pt-5 text-sm leading-relaxed text-muted">
            Page not found. Looking for the English version of this site?{' '}
            <Link
              href="/en"
              hrefLang="en"
              prefetch={false}
              title="SEO Técnico — English home"
              className="text-primary underline underline-offset-[3px] transition-colors hover:text-primary-hover"
            >
              Go to the English home
            </Link>
            .
          </p>
        )}
      </div>
    </section>
  )
}
