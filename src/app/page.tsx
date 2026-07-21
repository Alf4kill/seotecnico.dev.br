import Link from 'next/link'
import { ArrowRight, BookOpen, Wrench, FlaskConical } from 'lucide-react'
import { WebSiteJsonLd, PersonJsonLd } from '@/components/seo/JsonLd'
import { buildMetadata } from '@/lib/metadata'
import { site } from '@/lib/site'

export const metadata = buildMetadata({
  title: 'SEO Técnico: guias e ferramentas de SEO para Next.js',
  absoluteTitle: true,
  description: site.description,
  path: '/',
  // A home fica no mesmo segmento de app/opengraph-image.tsx.
  fileOgImage: true,
})

const destaques = [
  {
    icon: BookOpen,
    titulo: 'Guia de SEO técnico',
    descricao:
      'O guia completo de SEO técnico para Next.js com App Router: metadados, JSON-LD, sitemaps, Core Web Vitals e renderização.',
    href: '/guia/seo-tecnico-nextjs',
    cta: 'Ler o guia',
  },
  {
    icon: Wrench,
    titulo: 'Ferramentas gratuitas',
    descricao:
      'Gerador de JSON-LD, validador de meta tags e checador de Core Web Vitals. Sem login, sem custo.',
    href: '/ferramentas',
    cta: 'Ver ferramentas',
  },
  {
    icon: FlaskConical,
    titulo: 'Blog / experimentos',
    descricao:
      'Artigos práticos com código real e experimentos de SEO medidos neste próprio site, antes e depois.',
    href: '/blog',
    cta: 'Ler artigos',
  },
]

export default function HomePage() {
  return (
    <>
      <WebSiteJsonLd />
      <PersonJsonLd />

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="container py-16 lg:py-24">
        <div className="max-w-3xl">
          <h1 className="font-bold text-foreground text-4xl leading-tight md:text-5xl lg:text-6xl">
            SEO técnico para desenvolvedores{' '}
            <span className="text-primary">Next.js</span>
          </h1>
          <p className="mt-6 text-muted text-base leading-8 lg:text-lg">
            O <strong className="text-foreground">SEO Técnico</strong> é um
            laboratório vivo: cada técnica de SEO publicada aqui — metadados,
            dados estruturados, sitemaps, Core Web Vitals — está implementada
            neste próprio site e medida com dados reais do Google Search
            Console. Guias práticos e ferramentas gratuitas, direto do código.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/guia/seo-tecnico-nextjs"
              title="Guia de SEO técnico para Next.js"
              className="inline-flex items-center gap-2 rounded-full font-semibold bg-primary-solid text-white px-6 py-3.5 text-sm lg:text-base transition-colors hover:bg-primary-solid-hover"
            >
              Começar pelo guia
              <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
            </Link>
            <Link
              href="/sobre"
              title="Sobre o projeto SEO Técnico"
              className="inline-flex items-center gap-2 rounded-full font-semibold border-[1.5px] border-gray text-foreground bg-surface px-6 py-3.5 text-sm lg:text-base transition-colors hover:border-primary hover:text-primary"
            >
              Conhecer o projeto
            </Link>
          </div>
        </div>
      </section>

      {/* ── Destaques ─────────────────────────────────────────── */}
      <section className="container pb-16 lg:pb-24" aria-label="Destaques do site">
        <div className="grid gap-6 md:grid-cols-3">
          {destaques.map(({ icon: Icon, titulo, descricao, href, cta }) => (
            <article
              key={href}
              className="flex flex-col rounded-2xl border border-gray bg-surface p-6 transition-shadow hover:shadow-md"
            >
              <Icon className="h-8 w-8 text-primary" strokeWidth={1.75} aria-hidden="true" />
              <h2 className="mt-4 font-bold text-foreground text-lg">{titulo}</h2>
              <p className="mt-2 flex-1 text-sm leading-6 text-muted">{descricao}</p>
              <Link
                href={href}
                title={titulo}
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-dark transition-colors"
              >
                {cta}
                <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
              </Link>
            </article>
          ))}
        </div>
      </section>
    </>
  )
}
