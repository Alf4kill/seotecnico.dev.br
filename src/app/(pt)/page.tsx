import Link from 'next/link'
import { WebSiteJsonLd, PersonJsonLd, OrganizationJsonLd } from '@/components/seo/JsonLd'
import { getAllPosts, getGuide } from '@/lib/content'
import { buildMetadata } from '@/lib/metadata'
import { site } from '@/lib/site'
import { ButtonLink } from '@/components/ui/Button'
import { PostRow } from '@/components/blog/PostRow'
import { ToolsStrip } from '@/components/sections/ToolsStrip'

export const metadata = buildMetadata({
  title: 'SEO Técnico: guias e ferramentas de SEO para Next.js',
  absoluteTitle: true,
  description: site.description,
  path: '/',
})

// ─────────────────────────────────────────────────────────────────────────────
// Home. As pranchas do design não têm uma home; ela é composta com o
// vocabulário da listagem do blog (docs/design-system.md → Home).
//
// O parágrafo do hero é o elemento de LCP da página (o motivo das fontes em
// display 'optional', ver RootShell): o texto dele é posicionamento e não
// mudou com o redesign.
// ─────────────────────────────────────────────────────────────────────────────

const LATEST = 4

export default function HomePage() {
  const posts = getAllPosts()
  const guide = getGuide()

  const index = [
    { label: 'Guia pilar', value: `${guide.derived.headings.length} seções`, href: '/guia/seo-tecnico-nextjs' },
    { label: 'Artigos', value: String(posts.length), href: '/blog' },
    { label: 'Ferramentas', value: '3', href: '/ferramentas' },
  ]

  return (
    <>
      <WebSiteJsonLd />
      <OrganizationJsonLd />
      <PersonJsonLd />

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="border-b border-gray py-14 lg:py-22">
        <div className="container-xl grid items-end gap-12 lg:grid-cols-12 lg:gap-6">
          <div className="flex min-w-0 flex-col gap-6 lg:col-span-8">
            <p className="eyebrow flex items-center gap-3.5 text-primary">
              <span aria-hidden="true" className="h-[3px] w-10 bg-primary" />
              Laboratório vivo · seotecnico.dev.br
            </p>
            <h1 className="font-display text-[clamp(2.75rem,1.5rem+5vw,5.5rem)] font-bold leading-[0.96] tracking-[-0.03em] text-foreground">
              SEO técnico para desenvolvedores <span className="text-primary">Next.js</span>
            </h1>
            <p className="max-w-[42rem] text-lg leading-relaxed text-muted lg:text-xl">
              O <strong className="font-semibold text-foreground">SEO Técnico</strong> é um
              laboratório vivo: cada técnica de SEO publicada aqui — metadados,
              dados estruturados, sitemaps, Core Web Vitals — está implementada
              neste próprio site e medida com dados reais do Google Search
              Console. Guias práticos e ferramentas gratuitas, direto do código.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <ButtonLink href="/guia/seo-tecnico-nextjs" title="Guia de SEO técnico para Next.js">
                Começar pelo guia
              </ButtonLink>
              <ButtonLink href="/sobre" variant="outline" title="Sobre o projeto SEO Técnico">
                Conhecer o projeto
              </ButtonLink>
            </div>
          </div>

          {/* Índice de instrumento: contagens reais do build. */}
          <nav aria-label="Índice do site" className="min-w-0 border border-gray bg-surface p-6 lg:col-span-4">
            <p className="eyebrow pb-4 text-[0.625rem]">Índice do laboratório</p>
            <ul>
              {index.map(({ label, value, href }, i) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="group flex items-baseline justify-between gap-4 border-t border-gray py-3.5 transition-colors"
                  >
                    <span className="flex items-baseline gap-3">
                      <span className="font-mono text-xs text-primary">{String(i + 1).padStart(2, '0')}</span>
                      <span className="font-display text-lg font-medium text-foreground group-hover:text-primary">{label}</span>
                    </span>
                    <span className="font-mono text-xs uppercase text-muted">{value}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </section>

      {/* ── Pilar ─────────────────────────────────────────────── */}
      <section className="border-b border-gray py-12 lg:py-16" aria-labelledby="pilar-title">
        <div className="container-xl grid gap-8 lg:grid-cols-12 lg:gap-6">
          <p className="eyebrow text-primary lg:col-span-3">01 · Guia pilar</p>
          <div className="flex flex-col gap-5 lg:col-span-9">
            <h2 id="pilar-title" className="font-display text-[clamp(1.75rem,1.2rem+2vw,2.75rem)] font-bold leading-[1.08] tracking-[-0.025em] text-foreground">
              <Link href="/guia/seo-tecnico-nextjs" className="transition-colors hover:text-primary">
                {guide.frontmatter.title}
              </Link>
            </h2>
            <p className="max-w-[48rem] text-[1.0625rem] leading-relaxed text-body">{guide.frontmatter.description}</p>
            <ol className="grid gap-x-6 gap-y-2 border-t border-gray pt-5 sm:grid-cols-2 lg:grid-cols-3">
              {guide.derived.headings.slice(0, 9).map(({ id, text }, i) => (
                <li key={id}>
                  <Link
                    href={`/guia/seo-tecnico-nextjs#${id}`}
                    className="flex gap-3 py-1 text-sm leading-snug text-muted transition-colors hover:text-foreground"
                  >
                    <span className="font-mono text-label">{String(i + 1).padStart(2, '0')}</span>
                    {text}
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ── Últimos artigos ───────────────────────────────────── */}
      <section className="container-xl py-12 lg:py-16" aria-labelledby="latest-title">
        <div className="flex flex-col gap-3 pb-5 md:flex-row md:items-baseline md:justify-between">
          <h2 id="latest-title" className="font-display text-2xl font-bold tracking-[-0.01em] text-foreground">
            Artigos mais recentes
          </h2>
          <ButtonLink href="/blog" variant="link" className="self-start">
            Ver os {posts.length} artigos
          </ButtonLink>
        </div>
        <ol className="border-b border-gray">
          {posts.slice(0, LATEST).map((post, i) => (
            <PostRow key={post.frontmatter.slug} post={post} index={i + 1} />
          ))}
        </ol>
      </section>

      <ToolsStrip />
    </>
  )
}
