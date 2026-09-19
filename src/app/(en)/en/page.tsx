import { WebSiteJsonLd, PersonJsonLd, OrganizationJsonLd } from '@/components/seo/JsonLd'
import { getAllPosts } from '@/lib/content'
import { buildMetadata } from '@/lib/metadata'
import { site } from '@/lib/site'
import { ButtonLink, buttonClasses } from '@/components/ui/Button'

// ─────────────────────────────────────────────────────────────────────────────
// Home em inglês — par de hreflang da home portuguesa (lib/hreflang.ts).
//
// Não é tradução da home portuguesa, e isso é deliberado. A portuguesa recebe
// quem chega pelo tema; esta recebe quem chega pelo NOME do autor — um link de
// currículo, de LinkedIn, do README do repositório. Esse leitor não quer começar
// por um guia: quer saber em trinta segundos o que foi construído e como
// verificar. Daí a ordem: o que é, o que já foi medido, onde está a prova.
//
// Branding (CLAUDE.md §1): páginas em inglês abrem pelo nome do autor.
// ─────────────────────────────────────────────────────────────────────────────

const PATH = '/en'
const EXPERIMENT_LOG = `${site.repository}/blob/main/docs/experiment-log.md`
const BASELINES = `${site.repository}/tree/main/docs/baseline`

export const metadata = buildMetadata({
  title: `${site.author.name} — ${site.author.jobTitle}`,
  description:
    'A live technical SEO lab for Next.js: every technique implemented on this domain, gated in CI and measured with real Search Console data.',
  path: PATH,
  lang: 'en',
})

/**
 * Retrato datado, não métrica viva. Cada número vem de um arquivo versionado —
 * docs/baseline/ e docs/experiment-log.md — e envelhece junto com a data que o
 * acompanha na página. Atualizar aqui é uma decisão de commit, nunca um efeito
 * colateral de build.
 */
const SNAPSHOT_DATE = '2026-09-11'
const MEASURED = [
  {
    value: '21 / 21',
    label: 'URLs indexed by Google',
    detail: 'None stuck in the "discovered" or "crawled, not indexed" queues.',
  },
  {
    value: '11 of 21',
    label: 'pages in the top 20',
    detail: 'Average Google position ≤ 20, two months after the first article.',
  },
  {
    value: '4.9 s → 0.9 s',
    label: 'homepage LCP',
    detail: 'Render delay fixed in code. PageSpeed Insights mobile: 78 → 100.',
  },
  {
    value: 'Every PR',
    label: 'blocked if SEO breaks',
    detail: 'Playwright SEO assertions on every route, plus Lighthouse budgets.',
  },
]

export default function EnglishHomePage() {
  const postCount = getAllPosts().length
  const snapshot = new Date(`${SNAPSHOT_DATE}T00:00:00`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const sections = [
    {
      mark: 'bg-primary rounded-full',
      title: 'Technical SEO guide for Next.js',
      description:
        'The App Router guide: metadata, JSON-LD, sitemaps, Core Web Vitals, hreflang and rendering — written from the code that runs this site.',
      href: '/en/guide/technical-seo-nextjs',
      cta: 'Read the guide',
    },
    {
      mark: 'bg-accent',
      title: 'Three free SEO tools',
      description:
        'A JSON-LD generator, a meta tag validator and a Core Web Vitals checker backed by the Chrome UX Report. No login, no stored data.',
      href: '/ferramentas',
      cta: 'Open the tools',
      lang: 'pt-BR' as const,
    },
    {
      mark: 'triangle',
      title: `${postCount} in-depth articles`,
      description:
        'Metadata API, JSON-LD, dynamic sitemaps, LCP, INP, hreflang and SPA tracking in GTM — each implemented on this domain before it was written about.',
      href: '/blog',
      cta: 'Browse the articles',
      lang: 'pt-BR' as const,
    },
    {
      mark: 'bg-shape-reference',
      title: 'The lab notebook',
      description:
        'Every SEO change is logged with its hypothesis before the result exists, then judged against Search Console data — including the ones that failed.',
      href: EXPERIMENT_LOG,
      cta: 'Read the experiment log',
      external: true,
    },
  ]

  return (
    <>
      <WebSiteJsonLd />
      <OrganizationJsonLd />
      <PersonJsonLd />

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="border-b border-gray py-14 lg:py-22">
        <div className="container-xl flex max-w-none flex-col gap-6">
          <p className="eyebrow flex items-center gap-3.5 text-primary">
            <span aria-hidden="true" className="h-[3px] w-10 bg-primary" />
            {site.name} · a live technical SEO lab
          </p>
          <h1 className="max-w-[62rem] font-display text-[clamp(2.5rem,1.4rem+4.4vw,5rem)] font-bold leading-[0.98] tracking-[-0.03em] text-foreground">
            Technical SEO for <span className="text-primary">Next.js</span>, implemented and
            measured in public
          </h1>
          <p className="max-w-[46rem] text-lg leading-relaxed text-muted lg:text-xl">
            By <strong className="font-semibold text-foreground">{site.author.name}</strong>,{' '}
            {site.author.jobTitle}. Every technique documented on this site is implemented on
            this same domain, guarded by a CI pipeline that blocks deploys that break SEO, and
            measured with real Google Search Console data. The site is the experiment; the
            repository is the lab notebook.
          </p>
          <div className="flex flex-wrap gap-4 pt-2">
            <ButtonLink href="/en/guide/technical-seo-nextjs" title="Technical SEO for Next.js: the App Router guide">
              Read the guide
            </ButtonLink>
            <ButtonLink href="/en/about" variant="outline" title={`About ${site.author.name}`}>
              About the author
            </ButtonLink>
            <a
              href={site.repository}
              target="_blank"
              rel="noopener noreferrer"
              title="Source code of this site on GitHub"
              className={buttonClasses('outline')}
            >
              Source on GitHub <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
      </section>

      {/* ── Medido ────────────────────────────────────────────── */}
      <section className="container-xl py-12 lg:py-16" aria-labelledby="measured">
        <div className="grid gap-6 lg:grid-cols-12">
          <p className="eyebrow text-primary lg:col-span-3">01 · Measured</p>
          <div className="flex flex-col gap-3 lg:col-span-9">
            <h2 id="measured" className="font-display text-[clamp(1.75rem,1.2rem+2vw,2.75rem)] font-bold leading-[1.08] tracking-[-0.025em] text-foreground">
              Measured so far
            </h2>
            <p className="max-w-[46rem] text-[0.9375rem] leading-relaxed text-muted">
              Google Search Console and PageSpeed Insights, as of{' '}
              <time dateTime={SNAPSHOT_DATE}>{snapshot}</time>. Every number traces back to a
              versioned file in the repository — the{' '}
              <a href={BASELINES} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-[3px] hover:text-primary-hover">
                baselines
              </a>{' '}
              or the{' '}
              <a href={EXPERIMENT_LOG} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-[3px] hover:text-primary-hover">
                experiment log
              </a>
              .
            </p>
          </div>
        </div>

        <dl className="mt-10 grid border-t border-gray sm:grid-cols-2 lg:grid-cols-4">
          {MEASURED.map(({ value, label, detail }) => (
            <div key={label} className="flex flex-col gap-2 border-b border-gray py-6 pr-6 sm:[&:nth-child(odd)]:border-r lg:border-r lg:[&:last-child]:border-r-0 lg:pl-6 lg:first:pl-0">
              <dt className="eyebrow order-2 text-[0.625rem]">{label}</dt>
              <dd className="order-1 font-display text-[2rem] font-bold leading-none tracking-[-0.02em] text-primary">{value}</dd>
              <dd className="order-3 text-sm leading-relaxed text-muted">{detail}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ── O que há no site ──────────────────────────────────── */}
      <section className="container-xl pb-4" aria-labelledby="whats-here">
        <div className="grid gap-6 border-t border-gray pt-12 lg:grid-cols-12">
          <p className="eyebrow text-primary lg:col-span-3">02 · Contents</p>
          <h2 id="whats-here" className="font-display text-[clamp(1.75rem,1.2rem+2vw,2.75rem)] font-bold leading-[1.08] tracking-[-0.025em] text-foreground lg:col-span-9">
            What&rsquo;s on the site
          </h2>
        </div>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {sections.map(({ mark, title, description, href, cta, lang, external }) => (
            <article key={href} className="flex flex-col gap-3 border border-gray bg-surface p-6">
              {mark === 'triangle' ? (
                <span aria-hidden="true" className="h-0 w-0 border-x-[10px] border-b-[18px] border-x-transparent border-b-shape-danger" />
              ) : (
                <span aria-hidden="true" className={`h-4.5 w-4.5 ${mark}`} />
              )}
              <h3 className="font-display text-xl font-bold text-foreground">{title}</h3>
              <p className="flex-1 text-[0.9375rem] leading-relaxed text-muted">{description}</p>
              {external ? (
                <a href={href} target="_blank" rel="noopener noreferrer" className={buttonClasses('link', 'self-start')}>
                  {cta} <span aria-hidden="true">↗</span>
                </a>
              ) : (
                <ButtonLink
                  href={href}
                  hrefLang={lang}
                  // Destino noutro root layout: ver o comentário em LanguageSwitch.
                  prefetch={lang ? false : undefined}
                  title={title}
                  variant="link"
                  className="self-start"
                >
                  {cta}
                  {/* Destino em português: dito no link, não descoberto no clique.
                      O espaço explícito entra no nome acessível: sem ele o leitor
                      de tela lê "tools(in Portuguese)". */}
                  {lang === 'pt-BR' && <>{' '}<span className="normal-case tracking-normal text-muted">(in Portuguese)</span></>}
                </ButtonLink>
              )}
            </article>
          ))}
        </div>
      </section>
    </>
  )
}
