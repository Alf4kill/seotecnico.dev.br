import Link from 'next/link'
import { WebSiteJsonLd, PersonJsonLd, OrganizationJsonLd } from '@/components/seo/JsonLd'
import { getAllEnglishPosts, getGuide } from '@/lib/content'
import { buildMetadata } from '@/lib/metadata'
import { site } from '@/lib/site'
import { ButtonLink } from '@/components/ui/Button'
import { PostRow } from '@/components/blog/PostRow'
import { ToolsStrip } from '@/components/sections/ToolsStrip'
import { CentralMark } from '@/components/art/Marks'

// ─────────────────────────────────────────────────────────────────────────────
// Home em inglês — par de hreflang da home portuguesa (lib/hreflang.ts).
//
// Mesma estrutura da home portuguesa, seção por seção: hero com o índice do
// laboratório, guia pilar, artigos mais recentes e a faixa de ferramentas. As
// duas versões do site são organizadas do mesmo jeito; muda o idioma, não o
// caminho do leitor. Os estudos de caso continuam em /en/case-studies,
// linkados de /en/about, /en/blog e /en/lab.
//
// Branding (CLAUDE.md §1): páginas em inglês abrem pelo nome do autor — por
// isso o title e o parágrafo do hero o citam.
// ─────────────────────────────────────────────────────────────────────────────

const PATH = '/en'
const GUIDE = '/en/guide/technical-seo-nextjs'
const LATEST = 4

export const metadata = buildMetadata({
  title: `${site.author.name} — ${site.author.jobTitle}`,
  description:
    'A live technical SEO lab for modern websites, with Next.js as the reference implementation, gated in CI and measured with real Search Console data.',
  path: PATH,
  lang: 'en',
})

export default function EnglishHomePage() {
  const posts = getAllEnglishPosts()
  const guide = getGuide('en')

  const index = [
    { label: 'Pillar guide', value: `${guide.derived.headings.length} sections`, href: GUIDE },
    { label: 'Articles', value: String(posts.length), href: '/en/blog' },
    { label: 'Tools', value: '3', href: '/en/tools' },
  ]

  return (
    <>
      <WebSiteJsonLd />
      <OrganizationJsonLd />
      <PersonJsonLd />

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-gray py-14 lg:py-22">
        {/* Central mark A1 (beam): ceremonial page, behind the header only. */}
        <CentralMark variant="beam" className="-right-24 -top-16 w-[34rem] lg:right-[18%] lg:w-[44rem]" />
        <div className="container-xl relative grid items-end gap-12 lg:grid-cols-12 lg:gap-6">
          <div className="flex min-w-0 flex-col gap-6 lg:col-span-8">
            <p className="eyebrow flex items-center gap-3.5 text-primary">
              <span aria-hidden="true" className="h-[3px] w-10 bg-primary" />
              Live lab · seotecnico.dev.br
            </p>
            <h1 className="font-display text-[clamp(2.75rem,1.5rem+5vw,5.5rem)] font-bold leading-[0.96] tracking-[-0.03em] text-foreground">
              Technical SEO for developers who build <span className="text-primary">modern websites</span>
            </h1>
            <p className="max-w-[42rem] text-lg leading-relaxed text-muted lg:text-xl">
              <strong className="font-semibold text-foreground">{site.name}</strong> is a live lab
              by {site.author.name}, {site.author.jobTitle}: every technical SEO technique
              published here — metadata, structured data, sitemaps, Core Web Vitals — is
              implemented on this very site and measured with real Google Search Console data.
              Practical guides and free tools, straight from the code.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <ButtonLink href={GUIDE} title="Technical SEO for Next.js: the App Router guide">
                Start with the guide
              </ButtonLink>
              <ButtonLink href="/en/about" variant="outline" title={`About ${site.author.name}`}>
                About the project
              </ButtonLink>
            </div>
          </div>

          {/* Instrument index: real counts from the build. */}
          <nav aria-label="Site index" className="min-w-0 border border-gray bg-surface p-6 lg:col-span-4">
            <p className="eyebrow pb-4 text-[0.625rem]">Lab index</p>
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

      {/* ── Pillar ────────────────────────────────────────────── */}
      <section className="border-b border-gray py-12 lg:py-16" aria-labelledby="pillar-title">
        <div className="container-xl grid gap-8 lg:grid-cols-12 lg:gap-6">
          <p className="eyebrow text-primary lg:col-span-3">01 · Pillar guide</p>
          <div className="flex flex-col gap-5 lg:col-span-9">
            <h2 id="pillar-title" className="font-display text-[clamp(1.75rem,1.2rem+2vw,2.75rem)] font-bold leading-[1.08] tracking-[-0.025em] text-foreground">
              <Link href={GUIDE} className="transition-colors hover:text-primary">
                {guide.frontmatter.title}
              </Link>
            </h2>
            <p className="max-w-[48rem] text-[1.0625rem] leading-relaxed text-body">{guide.frontmatter.description}</p>
            <ol className="grid gap-x-6 gap-y-2 border-t border-gray pt-5 sm:grid-cols-2 lg:grid-cols-3">
              {guide.derived.headings.slice(0, 9).map(({ id, text }, i) => (
                <li key={id}>
                  <Link
                    href={`${GUIDE}#${id}`}
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

      {/* ── Latest articles ───────────────────────────────────── */}
      <section className="container-xl py-12 lg:py-16" aria-labelledby="latest-title">
        <div className="flex flex-col gap-3 pb-5 md:flex-row md:items-baseline md:justify-between">
          <h2 id="latest-title" className="font-display text-2xl font-bold tracking-[-0.01em] text-foreground">
            Latest articles
          </h2>
          <ButtonLink href="/en/blog" variant="link" className="self-start">
            See all {posts.length} articles
          </ButtonLink>
        </div>
        <ol className="border-b border-gray">
          {posts.slice(0, LATEST).map((post, i) => (
            <PostRow key={post.frontmatter.slug} post={post} index={i + 1} lang="en" />
          ))}
        </ol>
      </section>

      <ToolsStrip lang="en" />
    </>
  )
}
