import Link from 'next/link'
import { getAllPosts } from '@/lib/content'
import { CATEGORIES } from '@/lib/categories'
import { buildMetadata } from '@/lib/metadata'
import { BreadcrumbJsonLd } from '@/components/seo/JsonLd'
import { ButtonLink, buttonClasses } from '@/components/ui/Button'
import { CategoryMark } from '@/components/ui/CategoryMark'
import { PostRow } from '@/components/blog/PostRow'
import { ToolsStrip } from '@/components/sections/ToolsStrip'

export const metadata = buildMetadata({
  title: 'Blog de SEO técnico para Next.js',
  description:
    'Artigos práticos de SEO técnico para desenvolvedores Next.js: Metadata API, JSON-LD, sitemaps, Core Web Vitals e experimentos medidos.',
  path: '/blog',
})

// ─────────────────────────────────────────────────────────────────────────────
// Índice do blog (docs/design-system.md → Blog · listagem).
//
// Todo número desta página é calculado no build a partir de /content — o
// design original trazia "[N]" e um gráfico ilustrativo; aqui nenhum número
// entra sem fonte (regra "SIM" do manifesto).
// ─────────────────────────────────────────────────────────────────────────────

export default function BlogPage() {
  const posts = getAllPosts()
  const [latest] = posts
  const measuring = posts.filter((p) => p.frontmatter.status === 'em-medicao').length
  const lastUpdate = posts.map((p) => p.frontmatter.dateModified).sort().at(-1)
  const perAxis = CATEGORIES.map((c) => ({
    ...c,
    count: posts.filter((p) => p.frontmatter.category === c.slug).length,
  }))
  const maxPerAxis = Math.max(1, ...perAxis.map((a) => a.count))

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', path: '/' },
          { name: 'Blog', path: '/blog' },
        ]}
      />

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="border-b border-gray py-12 lg:py-18">
        <div className="container-xl grid items-end gap-10 lg:grid-cols-12 lg:gap-6">
          <div className="flex flex-col gap-5.5 lg:col-span-8">
            <p className="eyebrow flex items-center gap-3.5 text-primary">
              <span aria-hidden="true" className="h-[3px] w-10 bg-primary" />
              Blog · laboratório vivo
            </p>
            <h1 className="font-display text-[clamp(2.5rem,1.4rem+4.2vw,4.75rem)] font-bold leading-[0.98] tracking-[-0.025em] text-foreground">
              Artigos de SEO técnico, medidos em produção.
            </h1>
            <p className="max-w-[39rem] text-lg leading-relaxed text-muted">
              Cada artigo responde uma pergunta de SEO técnico para Next.js, com
              o código do App Router e medições feitas neste próprio site.
              Quando o resultado é nulo, ele também é publicado.
            </p>
          </div>

          <div className="flex flex-col gap-4 border border-gray bg-surface p-6 lg:col-span-4">
            <p className="eyebrow text-[0.625rem]">Estado do laboratório</p>
            <dl className="flex flex-col">
              {[
                ['Artigos', String(posts.length), 'text-foreground'],
                ['Em medição', String(measuring), 'text-accent'],
                ['Última atualização', lastUpdate ?? '—', 'text-foreground'],
              ].map(([label, value, tone]) => (
                <div key={label} className="flex items-baseline justify-between border-t border-gray py-3">
                  <dt className="font-mono text-xs uppercase text-muted">{label}</dt>
                  <dd className={`font-display text-base font-medium ${tone}`}>{value}</dd>
                </div>
              ))}
            </dl>
            {/* Âncora comum: o feed é um route handler, não uma página. */}
            <a href="/feed.xml" className={buttonClasses('outline', 'min-h-11')}>
              Assinar o RSS
            </a>
          </div>
        </div>
      </section>

      {/* ── Destaque: o mais recente ──────────────────────────── */}
      {latest && (
        <section className="border-b border-gray py-12 lg:py-14" aria-labelledby="latest-title">
          <div className="container-xl grid gap-10 lg:grid-cols-12 lg:gap-6">
            <div className="flex flex-col gap-6 lg:col-span-7">
              <p className="flex items-center gap-4">
                <span className="font-display text-[0.9375rem] font-bold tracking-[0.1em] text-primary">01</span>
                <span aria-hidden="true" className="h-px w-7 bg-gray-strong" />
                <span className="eyebrow text-accent">Mais recente</span>
              </p>
              <h2 id="latest-title" className="font-display text-[clamp(1.875rem,1.2rem+2.4vw,2.875rem)] font-bold leading-[1.06] tracking-[-0.02em]">
                <Link href={`/blog/${latest.frontmatter.slug}`} className="text-foreground transition-colors hover:text-primary">
                  {latest.frontmatter.title}
                </Link>
              </h2>
              <p className="max-w-[39rem] text-[1.0625rem] leading-relaxed text-muted">{latest.frontmatter.description}</p>
              <p className="font-mono text-xs text-label">
                {latest.frontmatter.datePublished} · {latest.derived.readingTime} min
              </p>
              <ButtonLink href={`/blog/${latest.frontmatter.slug}`} className="self-start">
                Ler o artigo
              </ButtonLink>
            </div>

            {/* Figura com dado real: artigos por eixo, contados no build. */}
            <figure className="relative flex min-h-80 flex-col justify-between gap-6 border border-gray bg-surface p-7 pt-9 lg:col-span-5">
              <div aria-hidden="true" className="absolute inset-x-0 top-0 flex h-1.5">
                <span className="flex-1 bg-primary" />
                <span className="w-30 bg-accent" />
                <span className="w-15 bg-shape-danger" />
              </div>
              <div className="flex justify-between">
                <span className="eyebrow text-[0.625rem]">Artigos por eixo</span>
                <span className="eyebrow text-[0.625rem]">Fig. 01</span>
              </div>
              <ul className="flex h-44 items-end gap-5">
                {perAxis.map(({ slug, short, count }) => (
                  <li key={slug} className="flex h-full flex-1 flex-col justify-end gap-2">
                    <span className="font-display text-sm font-medium text-foreground">{count}</span>
                    <span
                      aria-hidden="true"
                      className={slug === 'cwv' ? 'bg-accent' : slug === 'medicao' ? 'bg-primary' : slug === 'indexacao' ? 'bg-shape-reference' : 'bg-shape-danger'}
                      style={{ height: `${(count / maxPerAxis) * 100}%` }}
                    />
                    <span className="flex items-center gap-1.5 font-mono text-[0.625rem] uppercase tracking-[0.1em] text-muted">
                      <CategoryMark category={slug} />
                      {short['pt-BR']}
                    </span>
                  </li>
                ))}
              </ul>
              <figcaption className="flex justify-between border-t border-gray pt-3.5 font-mono text-xs text-muted">
                <span>Fonte: /content deste repositório</span>
                <span>{posts.length} artigos</span>
              </figcaption>
            </figure>
          </div>
        </section>
      )}

      {/* ── Índice com filtro ─────────────────────────────────── */}
      <section className="category-filter container-xl py-12" aria-labelledby="index-title">
        <div className="flex flex-col gap-6 pb-5 md:flex-row md:items-end md:justify-between">
          <h2 id="index-title" className="font-display text-2xl font-bold tracking-[-0.01em] text-foreground">
            Todos os artigos
          </h2>
          <fieldset>
            <legend className="sr-only">Filtrar por eixo</legend>
            <div className="flex flex-wrap gap-2.5">
              {[{ slug: 'all', label: 'Todos' }, ...CATEGORIES.map((c) => ({ slug: c.slug, label: c.label['pt-BR'] }))].map(
                ({ slug, label }) => (
                  <label key={slug} className="cursor-pointer">
                    <input
                      type="radio"
                      name="eixo"
                      value={slug}
                      defaultChecked={slug === 'all'}
                      className="peer sr-only"
                    />
                    <span className="inline-flex min-h-9 items-center gap-2 border border-gray-strong px-4 font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-muted transition-colors hover:text-foreground">
                      {slug !== 'all' && <CategoryMark category={slug as (typeof CATEGORIES)[number]['slug']} />}
                      {label}
                    </span>
                  </label>
                )
              )}
            </div>
          </fieldset>
        </div>
        <ol className="border-b border-gray">
          {posts.map((post, i) => (
            <PostRow key={post.frontmatter.slug} post={post} index={i + 1} />
          ))}
        </ol>
      </section>

      <ToolsStrip />
    </>
  )
}
