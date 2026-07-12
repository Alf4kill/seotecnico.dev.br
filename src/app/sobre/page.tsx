import type { Metadata } from 'next'
import Link from 'next/link'
import { PersonJsonLd } from '@/components/seo/JsonLd'
import { site } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Sobre o projeto SEO Técnico',
  description:
    'Quem faz o SEO Técnico: um desenvolvedor implementando e medindo SEO técnico em público, com dados reais do Search Console e CrUX.',
  alternates: { canonical: '/sobre' },
}

export default function SobrePage() {
  return (
    <>
      <PersonJsonLd />

      <section className="container max-w-3xl py-12 lg:py-16">
        <h1 className="font-bold text-foreground text-3xl md:text-4xl">
          Sobre o SEO Técnico
        </h1>

        <div className="rich-text mt-8">
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
        </div>
      </section>
    </>
  )
}
