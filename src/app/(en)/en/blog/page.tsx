import Link from 'next/link'
import { getAllEnglishPosts, getAllPosts } from '@/lib/content'
import { CATEGORIES, isExperiment } from '@/lib/categories'
import { buildMetadata } from '@/lib/metadata'
import { BreadcrumbJsonLd } from '@/components/seo/JsonLd'
import { ButtonLink, buttonClasses } from '@/components/ui/Button'
import { CategoryMark } from '@/components/ui/CategoryMark'
import { PostRow } from '@/components/blog/PostRow'
import { ToolsStrip } from '@/components/sections/ToolsStrip'
import { CornerMark } from '@/components/art/Marks'

// ─────────────────────────────────────────────────────────────────────────────
// /en/blog — the English blog index, the same page as /blog in English.
//
// Same structure and rules as the Portuguese index (docs/design-system.md →
// Blog · listagem): every number is computed at build time from /content, the
// filter by kind or axis works without JavaScript (globals.css →
// .category-filter), and the list is the English collection only.
//
// The two indexes are an hreflang pair (lib/hreflang.ts): same function, the
// blog of each language. The English collection is smaller on purpose — only
// the lab articles are translated (CLAUDE.md §1) — and the page says so, with
// a link to the full Portuguese blog, instead of pretending to be complete.
// No RSS button: the feed exists only in Portuguese.
// ─────────────────────────────────────────────────────────────────────────────

const PATH = '/en/blog'

export const metadata = buildMetadata({
  title: 'Technical SEO blog in English',
  description:
    'Technical SEO lab articles in English: how Google and AI assistants read pages, with Next.js code and experiments measured on this site.',
  path: PATH,
  lang: 'en',
})

const LINK = 'text-primary underline underline-offset-[3px] hover:text-primary-hover'

export default function EnglishBlogPage() {
  const posts = getAllEnglishPosts()
  const portugueseCount = getAllPosts().length
  const [latest] = posts
  const experiments = posts.filter((p) => isExperiment(p.frontmatter.status)).length
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
          { name: 'Home', path: '/en' },
          { name: 'Blog', path: PATH },
        ]}
      />

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-gray py-12 lg:py-18">
        <CornerMark variant="arc" className="-right-16 -top-24 w-72 lg:-right-10 lg:w-80" />
        <div className="container-xl relative grid items-end gap-10 lg:grid-cols-12 lg:gap-6">
          <div className="flex flex-col gap-5.5 lg:col-span-8">
            <p className="eyebrow flex items-center gap-3.5 text-primary">
              <span aria-hidden="true" className="h-[3px] w-10 bg-primary" />
              Blog · live lab
            </p>
            <h1 className="font-display text-[clamp(2.5rem,1.4rem+4.2vw,4.75rem)] font-bold leading-[0.98] tracking-[-0.025em] text-foreground">
              Technical SEO articles, measured in production.
            </h1>
            <p className="max-w-[39rem] text-lg leading-relaxed text-muted">
              Each article answers one technical SEO question with measurements made on this
              very site. When the result is null, it is published too. These are the English
              versions of the lab articles; the{' '}
              <Link href="/blog" hrefLang="pt-BR" prefetch={false} className={LINK}>
                full blog, with {portugueseCount} articles, is in Portuguese
              </Link>
              .
            </p>
          </div>

          <div className="flex flex-col gap-4 border border-gray bg-surface p-6 lg:col-span-4">
            <p className="eyebrow text-[0.625rem]">Lab status</p>
            <dl className="flex flex-col">
              {[
                ['Articles', String(posts.length), 'text-foreground'],
                ['Experiments', String(experiments), 'text-foreground'],
                ['Measuring', String(measuring), 'text-accent'],
                ['Last update', lastUpdate ?? '—', 'text-foreground'],
              ].map(([label, value, tone]) => (
                <div key={label} className="flex items-baseline justify-between border-t border-gray py-3">
                  <dt className="font-mono text-xs uppercase text-muted">{label}</dt>
                  <dd className={`font-display text-base font-medium ${tone}`}>{value}</dd>
                </div>
              ))}
            </dl>
            <Link href="/en/case-studies" className={buttonClasses('outline', 'min-h-11')}>
              See the case studies
            </Link>
          </div>
        </div>
      </section>

      {/* ── Latest ────────────────────────────────────────────── */}
      {latest && (
        <section className="border-b border-gray py-12 lg:py-14" aria-labelledby="latest-title">
          <div className="container-xl grid gap-10 lg:grid-cols-12 lg:gap-6">
            <div className="flex min-w-0 flex-col gap-6 lg:col-span-7">
              <p className="flex items-center gap-4">
                <span className="font-display text-[0.9375rem] font-bold tracking-[0.1em] text-primary">01</span>
                <span aria-hidden="true" className="h-px w-7 bg-gray-strong" />
                <span className="eyebrow text-accent">Latest</span>
              </p>
              <h2 id="latest-title" className="font-display text-[clamp(1.875rem,1.2rem+2.4vw,2.875rem)] font-bold leading-[1.06] tracking-[-0.02em]">
                <Link href={`${PATH}/${latest.frontmatter.slug}`} className="text-foreground transition-colors hover:text-primary">
                  {latest.frontmatter.title}
                </Link>
              </h2>
              <p className="max-w-[39rem] text-[1.0625rem] leading-relaxed text-muted">{latest.frontmatter.description}</p>
              <p className="font-mono text-xs text-label">
                {latest.frontmatter.datePublished} · {latest.derived.readingTime} min
              </p>
              <ButtonLink href={`${PATH}/${latest.frontmatter.slug}`} className="self-start">
                Read the article
              </ButtonLink>
            </div>

            {/* Real data: articles per axis, counted at build time. */}
            <figure className="relative flex min-h-80 min-w-0 flex-col justify-between gap-6 border border-gray bg-surface p-7 pt-9 lg:col-span-5">
              <div aria-hidden="true" className="absolute inset-x-0 top-0 flex h-1.5">
                <span className="flex-1 bg-primary" />
                <span className="w-30 bg-accent" />
                <span className="w-15 bg-shape-danger" />
              </div>
              <div className="flex justify-between">
                <span className="eyebrow text-[0.625rem]">Articles per axis</span>
                <span className="eyebrow text-[0.625rem]">Fig. 01</span>
              </div>
              <ul className="flex h-44 items-end gap-2 sm:gap-5">
                {perAxis.map(({ slug, short, count }) => (
                  <li key={slug} className="flex h-full min-w-0 flex-1 flex-col justify-end gap-2">
                    <span className="font-display text-sm font-medium text-foreground">{count}</span>
                    <span
                      aria-hidden="true"
                      className={slug === 'cwv' ? 'bg-accent' : slug === 'medicao' ? 'bg-primary' : slug === 'indexacao' ? 'bg-shape-reference' : 'bg-shape-danger'}
                      style={{ height: `${(count / maxPerAxis) * 100}%` }}
                    />
                    <span className="flex flex-wrap items-center gap-1.5 font-mono text-[0.625rem] uppercase tracking-[0.1em] text-muted">
                      <CategoryMark category={slug} />
                      {short.en}
                    </span>
                  </li>
                ))}
              </ul>
              <figcaption className="flex justify-between border-t border-gray pt-3.5 font-mono text-xs text-muted">
                <span>Source: /content in this repository</span>
                <span>{posts.length} articles</span>
              </figcaption>
            </figure>
          </div>
        </section>
      )}

      {/* ── Index with filter ─────────────────────────────────── */}
      <section className="category-filter container-xl py-12" aria-labelledby="index-title">
        <div className="flex flex-col gap-6 pb-5 md:flex-row md:items-end md:justify-between">
          <h2 id="index-title" className="font-display text-2xl font-bold tracking-[-0.01em] text-foreground">
            All articles
          </h2>
          <fieldset>
            <legend className="sr-only">Filter by kind or axis</legend>
            <div className="flex flex-wrap gap-2.5">
              {[
                { slug: 'all', label: 'All' },
                { slug: 'experimento', label: 'Experiments' },
                ...CATEGORIES.map((c) => ({ slug: c.slug, label: c.label.en })),
              ].map(({ slug, label }) => (
                <label key={slug} className="cursor-pointer">
                  <input
                    type="radio"
                    name="axis"
                    value={slug}
                    defaultChecked={slug === 'all'}
                    className="peer sr-only"
                  />
                  <span className="inline-flex min-h-9 items-center gap-2 border border-gray-strong px-4 font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-muted transition-colors hover:text-foreground">
                    {slug !== 'all' && slug !== 'experimento' && (
                      <CategoryMark category={slug as (typeof CATEGORIES)[number]['slug']} />
                    )}
                    {label}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        </div>
        <ol className="border-b border-gray">
          {posts.map((post, i) => (
            <PostRow key={post.frontmatter.slug} post={post} index={i + 1} lang="en" />
          ))}
        </ol>
      </section>

      <ToolsStrip lang="en" />
    </>
  )
}
