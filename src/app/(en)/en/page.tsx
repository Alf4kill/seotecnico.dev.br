import Link from 'next/link'
import { ArrowRight, ArrowUpRight, BookOpen, FileText, FlaskConical, Wrench } from 'lucide-react'
import { WebSiteJsonLd, PersonJsonLd, OrganizationJsonLd } from '@/components/seo/JsonLd'
import { getAllPosts } from '@/lib/content'
import { buildMetadata } from '@/lib/metadata'
import { site } from '@/lib/site'

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
      icon: BookOpen,
      title: 'Technical SEO guide for Next.js',
      description:
        'The App Router guide: metadata, JSON-LD, sitemaps, Core Web Vitals, hreflang and rendering — written from the code that runs this site.',
      href: '/en/guide/technical-seo-nextjs',
      cta: 'Read the guide',
    },
    {
      icon: Wrench,
      title: 'Three free SEO tools',
      description:
        'A JSON-LD generator, a meta tag validator and a Core Web Vitals checker backed by the Chrome UX Report. No login, no stored data.',
      href: '/ferramentas',
      cta: 'Open the tools',
      lang: 'pt-BR' as const,
    },
    {
      icon: FileText,
      title: `${postCount} in-depth articles`,
      description:
        'Metadata API, JSON-LD, dynamic sitemaps, LCP, INP, hreflang and SPA tracking in GTM — each implemented on this domain before it was written about.',
      href: '/blog',
      cta: 'Browse the articles',
      lang: 'pt-BR' as const,
    },
    {
      icon: FlaskConical,
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
      <section className="container py-16 lg:py-24">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            {site.name} · a live technical SEO lab
          </p>
          <h1 className="mt-4 font-bold text-foreground text-4xl leading-tight md:text-5xl lg:text-6xl">
            Technical SEO for <span className="text-primary">Next.js</span>, implemented and
            measured in public
          </h1>
          <p className="mt-6 text-muted text-base leading-8 lg:text-lg">
            By <strong className="text-foreground">{site.author.name}</strong>,{' '}
            {site.author.jobTitle}. Every technique documented on this site is implemented on
            this same domain, guarded by a CI pipeline that blocks deploys that break SEO, and
            measured with real Google Search Console data. The site is the experiment; the
            repository is the lab notebook.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/en/guide/technical-seo-nextjs"
              title="Technical SEO for Next.js: the App Router guide"
              className="inline-flex items-center gap-2 rounded-full font-semibold bg-primary-solid text-white px-6 py-3.5 text-sm lg:text-base transition-colors hover:bg-primary-solid-hover"
            >
              Read the guide
              <ArrowRight className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
            </Link>
            <Link
              href="/en/about"
              title={`About ${site.author.name}`}
              className="inline-flex items-center gap-2 rounded-full font-semibold border-[1.5px] border-gray text-foreground bg-surface px-6 py-3.5 text-sm lg:text-base transition-colors hover:border-primary hover:text-primary"
            >
              About the author
            </Link>
            <a
              href={site.repository}
              target="_blank"
              rel="noopener noreferrer"
              title="Source code of this site on GitHub"
              className="inline-flex items-center gap-2 rounded-full font-semibold border-[1.5px] border-gray text-foreground bg-surface px-6 py-3.5 text-sm lg:text-base transition-colors hover:border-primary hover:text-primary"
            >
              Source on GitHub
              <ArrowUpRight className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>

      {/* ── Medido ────────────────────────────────────────────── */}
      <section className="container pb-16 lg:pb-24" aria-labelledby="measured">
        <div className="max-w-3xl">
          <h2 id="measured" className="font-bold text-foreground text-2xl md:text-3xl">
            Measured so far
          </h2>
          <p className="mt-3 text-sm leading-6 text-muted">
            Google Search Console and PageSpeed Insights, as of{' '}
            <time dateTime={SNAPSHOT_DATE}>{snapshot}</time>. Every number traces back to a
            versioned file in the repository — the{' '}
            <a
              href={BASELINES}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-primary hover:text-primary-dark transition-colors"
            >
              baselines
            </a>{' '}
            or the{' '}
            <a
              href={EXPERIMENT_LOG}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-primary hover:text-primary-dark transition-colors"
            >
              experiment log
            </a>
            .
          </p>
        </div>

        <dl className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {MEASURED.map(({ value, label, detail }) => (
            <div key={label} className="flex flex-col rounded-2xl border border-gray bg-surface p-6">
              <dt className="order-2 mt-2 font-semibold text-foreground">{label}</dt>
              <dd className="order-1 font-bold text-primary text-3xl">{value}</dd>
              <dd className="order-3 mt-2 text-sm leading-6 text-muted">{detail}</dd>
            </div>
          ))}
        </dl>

        {/* A franqueza é o argumento. Um laboratório que só publica o que deu
            certo é marketing; este registra também o que ainda não aconteceu, e
            por quê — é o que o torna verificável. */}
        <p className="mt-8 max-w-3xl text-base leading-7 text-foreground">
          What it has not done yet is earn traffic: four clicks in three months. The data points
          to authority, not indexing, as the constraint — and the reasoning is in the{' '}
          <a
            href={EXPERIMENT_LOG}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-primary hover:text-primary-dark transition-colors"
          >
            experiment log
          </a>
          , next to every prediction that turned out wrong.
        </p>
      </section>

      {/* ── O que há no site ──────────────────────────────────── */}
      <section className="container pb-16 lg:pb-24" aria-labelledby="whats-here">
        <h2 id="whats-here" className="font-bold text-foreground text-2xl md:text-3xl">
          What&rsquo;s on the site
        </h2>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {sections.map(({ icon: Icon, title, description, href, cta, lang, external }) => (
            <article
              key={href}
              className="flex flex-col rounded-2xl border border-gray bg-surface p-6 transition-shadow hover:shadow-md"
            >
              <Icon className="h-8 w-8 text-primary" strokeWidth={1.75} aria-hidden="true" />
              <h3 className="mt-4 font-bold text-foreground text-lg">{title}</h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-muted">{description}</p>
              {external ? (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-dark transition-colors"
                >
                  {cta}
                  <ArrowUpRight className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
                </a>
              ) : (
                <Link
                  href={href}
                  hrefLang={lang}
                  // Destino noutro root layout: ver o comentário em LanguageSwitch.
                  prefetch={lang ? false : undefined}
                  title={title}
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-dark transition-colors"
                >
                  {cta}
                  {/* Destino em português: dito no link, não descoberto no clique. */}
                  {lang === 'pt-BR' && (
                    // O espaço explícito não aparece (item de flex só com espaço é
                    // descartado), mas entra no nome acessível: sem ele o leitor de
                    // tela lê "tools(in Portuguese)".
                    <>{' '}<span className="font-normal text-muted">(in Portuguese)</span></>
                  )}
                  <ArrowRight className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
                </Link>
              )}
            </article>
          ))}
        </div>
      </section>
    </>
  )
}
