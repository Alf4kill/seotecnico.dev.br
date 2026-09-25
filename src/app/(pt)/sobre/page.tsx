import Link from 'next/link'
import { PersonJsonLd, BreadcrumbJsonLd } from '@/components/seo/JsonLd'
import { buildMetadata } from '@/lib/metadata'
import { site } from '@/lib/site'
import { Scene } from '@/components/art/Art'
import { PAGE_ART } from '@/lib/art'
import { AvailabilityNote } from '@/components/sections/AvailabilityNote'

export const metadata = buildMetadata({
  title: 'Sobre o projeto SEO Técnico',
  description:
    'Quem faz o SEO Técnico: um desenvolvedor implementando e medindo SEO técnico em público, com dados reais do Search Console e CrUX.',
  path: '/sobre',
})

export default function SobrePage() {
  return (
    <>
      <PersonJsonLd />
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', path: '/' },
          { name: 'Sobre', path: '/sobre' },
        ]}
      />

      <section className="container-xl py-12 lg:py-16">
        <div className="flex items-end justify-between gap-8">
          <div className="min-w-0">
            <p className="eyebrow mb-5 flex items-center gap-3.5 text-primary">
              <span aria-hidden="true" className="h-[3px] w-10 bg-primary" />
              Sobre · autor e projeto
            </p>
            <h1 className="font-display text-[clamp(2.25rem,1.4rem+3.2vw,4rem)] font-bold leading-[1.02] tracking-[-0.025em] text-foreground">
              Sobre o SEO Técnico
            </h1>
          </div>
          {/* Cena "Contemplação": a página do autor (docs/design-system.md → Arte). */}
          <Scene id={PAGE_ART.about} className="hidden w-64 shrink-0 md:block lg:w-80" />
        </div>

        <div className="rich-text mt-10 max-w-[68ch]">
          <p>
            O <strong>SEO Técnico</strong> é um laboratório público de SEO
            técnico para Next.js, feito por {site.author.name} —{' '}
            {site.author.jobTitle} e desenvolvedor web. A premissa é simples:
            em vez de repetir teoria, cada técnica documentada aqui é
            implementada neste próprio domínio e medida com dados reais do
            Google Search Console, do Chrome UX Report e de experimentos
            antes/depois.
          </p>

          <h2>Por que um laboratório vivo?</h2>
          <p>
            Certificações provam teoria; este site prova execução. O código
            está público no GitHub, as mudanças de SEO são registradas como
            experimentos com hipótese e resultado, e o processo inteiro —
            acertos e erros — vira conteúdo do{' '}
            <Link href="/blog" title="Blog de SEO técnico">blog</Link> e do{' '}
            <Link
              href="/guia/seo-tecnico-nextjs"
              title="Guia de SEO técnico para Next.js"
            >
              guia de SEO técnico para Next.js
            </Link>
            .
          </p>

          <h2>O que você encontra aqui</h2>
          <ul>
            <li>
              Guias e artigos de SEO técnico focados em Next.js (App Router),
              sempre com código real;
            </li>
            <li>
              <Link href="/ferramentas" title="Ferramentas gratuitas de SEO">
                Ferramentas gratuitas
              </Link>{' '}
              de SEO técnico, sem login e sem armazenar dados;
            </li>
            <li>
              Experimentos de SEO documentados com metodologia e níveis de
              confiança.
            </li>
          </ul>

          <h2>Por que o site tem esta cara</h2>
          <p>
            O visual também é decisão documentada: fundo escuro por padrão por
            causa da leitura longa, um tema claro com a mesma paleta medida,
            nenhum canto arredondado, três formas no lugar de ícones e cada par
            de cores medido contra o contraste mínimo. A
            explicação completa, com as escolas de design por trás, está no{' '}
            <Link href="/design" title="Design do site: retrofuturismo suíço">
              colofão do design
            </Link>
            .
          </p>
        </div>

        <AvailabilityNote lang="pt-BR" />
      </section>
    </>
  )
}
