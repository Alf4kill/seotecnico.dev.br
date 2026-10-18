import Link from 'next/link'
import { getAllEnglishPosts } from '@/lib/content'
import { isExperiment } from '@/lib/categories'
import { buildMetadata } from '@/lib/metadata'
import { site } from '@/lib/site'
import { BreadcrumbJsonLd, WebPageJsonLd } from '@/components/seo/JsonLd'
import { CategoryChip, StatusLabel } from '@/components/ui/CategoryMark'

// ─────────────────────────────────────────────────────────────────────────────
// /en/lab — par de hreflang de /laboratorio (lib/hreflang.ts), com o mesmo
// texto e a mesma derivação, sobre a coleção inglesa:
// - experimento = post inglês com estado de medição (lib/categories.ts);
// - "artigos que usam estes dados" = posts ingleses cujo `basedOn` cita o
//   experimento.
// Publicar a tradução de um experimento ou de um artigo derivado nunca exige
// editar este arquivo. /en/case-studies continua à parte: é portfólio, e inclui
// trabalho que não é experimento.
// ─────────────────────────────────────────────────────────────────────────────

const PATH = '/en/lab'
const TITLE = 'Lab: technical SEO experiments'
const DESCRIPTION =
  "This site's experiments, with the hypothesis registered before the data and a public record, and the articles that use each one's results."

const repo = (file: string) => `${site.repository}/blob/main/${file}`

export const metadata = buildMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: PATH,
  lang: 'en',
  ogImage: { path: `${PATH}/opengraph-image`, alt: TITLE },
})

const METHOD = [
  {
    title: 'Hypothesis before the data',
    body: 'Each experiment enters the record with its prediction and measurement window before any result exists.',
  },
  {
    title: 'Power before registration',
    body: 'Each hypothesis states the smallest effect its window can detect with the traffic the site has. When human traffic is not enough, the unit becomes agent requests, lab rounds or a public dataset.',
  },
  {
    title: 'Identity by URL, not by user agent',
    body: 'In the tests with AI assistants, each assistant gets its own secret URL. Who requested each page is identified by the address, not by what the request declares.',
  },
  {
    title: 'Null results get published too',
    body: 'Falsified hypotheses, defective instruments and misreadings are published with the same prominence as what worked.',
  },
]

const RECORDS = [
  { label: 'Experiment log', file: 'docs/experiment-log.md', note: 'hypotheses, predictions and verdicts, in date order' },
  { label: 'Rounds with AI assistants', file: 'docs/lab-control-rounds.md', note: 'protocol, full answers and every deviation (in Portuguese)' },
  { label: 'Detection experiment design', file: 'docs/detection-experiment.md', note: 'instrument, traps and criteria' },
]

const LINK = 'text-primary underline underline-offset-[3px] hover:text-primary-hover'

export default function EnglishLabPage() {
  const posts = getAllEnglishPosts()
  const experiments = posts.filter((p) => isExperiment(p.frontmatter.status))
  const derivedFrom = (slug: string) => posts.filter((p) => p.frontmatter.basedOn?.includes(slug))
  // The page changes when an experiment or an article using its data changes.
  const lastUpdate = experiments
    .flatMap((e) => [e, ...derivedFrom(e.frontmatter.slug)])
    .map((p) => p.frontmatter.dateModified)
    .sort()
    .at(-1) as string

  return (
    <>
      <WebPageJsonLd
        path={PATH}
        name={TITLE}
        description={DESCRIPTION}
        lang="en"
        dateModified={lastUpdate}
        imagePath={`${PATH}/opengraph-image`}
      />
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', path: '/en' },
          { name: 'Lab', path: PATH },
        ]}
      />

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="border-b border-gray py-12 lg:py-16">
        <div className="container-xl">
          <p className="eyebrow mb-5 flex items-center gap-3.5 text-primary">
            <span aria-hidden="true" className="h-[3px] w-10 bg-primary" />
            Lab · public method
          </p>
          <h1 className="max-w-[56rem] font-display text-[clamp(2.25rem,1.4rem+3.2vw,4rem)] font-bold leading-[1.02] tracking-[-0.025em] text-foreground">
            Technical SEO experiments, with the record open
          </h1>
          <p className="mt-6 max-w-[46rem] text-lg leading-relaxed text-muted">
            This site is its own test subject. Here are the {experiments.length} experiments
            published so far, the state of each one and the articles that use the results. The
            protocol, the full answers and every deviation are in the repository, where any number
            can be checked.
          </p>
        </div>
      </section>

      {/* ── Method ────────────────────────────────────────────── */}
      <section className="container-xl py-12" aria-labelledby="method-title">
        <h2 id="method-title" className="font-display text-2xl font-bold tracking-[-0.01em] text-foreground">
          How each experiment is run
        </h2>
        <ol className="mt-8 grid gap-6 md:grid-cols-2">
          {METHOD.map(({ title, body }, i) => (
            <li key={title} className="flex flex-col gap-2.5 border-t border-gray pt-5">
              <span className="font-display text-[0.9375rem] font-bold tracking-[0.1em] text-primary">
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3 className="font-display text-xl font-bold leading-tight text-foreground">{title}</h3>
              <p className="max-w-[38rem] text-base leading-relaxed text-muted">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ── Experiments ───────────────────────────────────────── */}
      <section className="container-xl py-12" aria-labelledby="experiments-title">
        <h2 id="experiments-title" className="font-display text-2xl font-bold tracking-[-0.01em] text-foreground">
          The experiments
        </h2>
        <ol className="mt-6 border-b border-gray">
          {experiments.map(({ frontmatter }, i) => {
            const derived = derivedFrom(frontmatter.slug)
            return (
              <li
                key={frontmatter.slug}
                className="grid gap-x-6 gap-y-4 border-t border-gray py-9 md:grid-cols-[5rem_minmax(0,1fr)_12.5rem]"
              >
                <span className="font-display text-[0.9375rem] font-bold tracking-[0.1em] text-primary">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="flex min-w-0 flex-col gap-3">
                  <h3 className="font-display text-[1.375rem] font-bold leading-tight tracking-[-0.015em] md:text-[1.75rem]">
                    <Link href={`/en/blog/${frontmatter.slug}`} className="text-foreground transition-colors hover:text-primary">
                      {frontmatter.title}
                    </Link>
                  </h3>
                  <p className="max-w-[41rem] text-base leading-relaxed text-muted">
                    {frontmatter.tldr ?? frontmatter.description}
                  </p>
                  <p className="font-mono text-xs text-label">
                    published <time dateTime={frontmatter.datePublished}>{frontmatter.datePublished}</time>
                    {frontmatter.dateModified !== frontmatter.datePublished && (
                      <>
                        {' '}· updated <time dateTime={frontmatter.dateModified}>{frontmatter.dateModified}</time>
                      </>
                    )}
                  </p>
                  {derived.length > 0 && (
                    <div className="mt-2 flex flex-col gap-2 border-t border-gray pt-4">
                      <p className="eyebrow text-[0.625rem]">Articles that use this data</p>
                      <ul className="flex flex-col gap-1.5">
                        {derived.map((d) => (
                          <li key={d.frontmatter.slug}>
                            <Link href={`/en/blog/${d.frontmatter.slug}`} className={`text-[0.9375rem] ${LINK}`}>
                              {d.frontmatter.title}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3 md:flex-col md:items-start">
                  {frontmatter.category && <CategoryChip category={frontmatter.category} lang="en" />}
                  {frontmatter.status && <StatusLabel status={frontmatter.status} lang="en" />}
                </div>
              </li>
            )
          })}
        </ol>
      </section>

      {/* ── Public record ─────────────────────────────────────── */}
      <section className="container-xl py-12" aria-labelledby="records-title">
        <h2 id="records-title" className="font-display text-2xl font-bold tracking-[-0.01em] text-foreground">
          The record, in the repository
        </h2>
        <ul className="rich-text mt-6 flex max-w-[68ch] flex-col gap-3">
          {RECORDS.map(({ label, file, note }) => (
            <li key={file}>
              <a href={repo(file)} target="_blank" rel="noopener noreferrer" className={LINK}>
                {label} <span aria-hidden="true">↗</span>
              </a>
              : {note}.
            </li>
          ))}
        </ul>
        <p className="mt-8 max-w-[68ch] text-base leading-relaxed text-muted">
          The other articles on the{' '}
          <Link href="/en/blog" className={LINK}>
            blog
          </Link>{' '}
          are guides: they explain a technique with the code that runs on this site. The ones
          that use numbers from an experiment carry a &ldquo;Lab data&rdquo; box at the top, with
          the link to it. The same results, summarized for a portfolio reader, are in the{' '}
          <Link href="/en/case-studies" className={LINK}>
            case studies
          </Link>
          .
        </p>
      </section>
    </>
  )
}
