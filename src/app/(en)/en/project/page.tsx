import Link from 'next/link'
import { getProjectEntries } from '@/lib/content'
import { MANIFESTO_REVISED } from '@/components/design/manifesto-copy'
import { buildMetadata } from '@/lib/metadata'
import { site } from '@/lib/site'
import { BreadcrumbJsonLd, WebPageJsonLd } from '@/components/seo/JsonLd'

// ─────────────────────────────────────────────────────────────────────────────
// /en/project — par de hreflang de /projeto (lib/hreflang.ts), com o mesmo
// texto e a mesma derivação, sobre as entradas inglesas (content/en/project).
// O colofão /en/design é a entrada escrita à mão, como no índice português.
// ─────────────────────────────────────────────────────────────────────────────

const PATH = '/en/project'
const TITLE = 'Project: how this technical SEO site is built'
const DESCRIPTION =
  'How SEO Técnico is built and run: how AI is used, how each page is made and the design decisions, each with the file or commit that backs it.'

const repo = (file: string) => `${site.repository}/blob/main/${file}`

export const metadata = buildMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: PATH,
  lang: 'en',
  ogImage: { path: `${PATH}/opengraph-image`, alt: TITLE },
})

const DESIGN_ENTRY = {
  href: '/en/design',
  title: 'Site design: Swiss retro-futurism',
  summary:
    'Why the site is dark by default, has a light theme, square corners and shapes instead of icons, with the measured palette and the rules CI enforces.',
  date: MANIFESTO_REVISED,
}

const PAGES = [
  { href: '/en/about', label: 'About', answers: 'who runs the site and what it is' },
  { href: '/en/lab', label: 'Lab', answers: 'what was measured, and the method of each experiment' },
  { href: '/en/case-studies', label: 'Case studies', answers: 'the results, told for a hiring reader' },
  { href: PATH, label: 'Project', answers: 'how the site is built and run' },
]

const RECORDS = [
  { label: 'CLAUDE.md', file: 'CLAUDE.md', note: "the project's contract: objectives, rules and scope" },
  { label: 'AI workflow', file: 'docs/ai-workflow.md', note: 'the source of the AI entry, with each number and the command that reproduces it' },
  { label: 'How a page is made', file: 'docs/content-pipeline.md', note: 'from research note to merge' },
  { label: 'Experiment log', file: 'docs/experiment-log.md', note: 'every deliberate change, with its hypothesis and date' },
]

const LINK = 'text-primary underline underline-offset-[3px] hover:text-primary-hover'

export default function EnglishProjectPage() {
  const entries = getProjectEntries('en')
  const items = [
    ...entries.map(({ frontmatter }) => ({
      href: `${PATH}/${frontmatter.slug}`,
      title: frontmatter.title,
      summary: frontmatter.tldr ?? frontmatter.description,
      date: frontmatter.dateModified,
    })),
    DESIGN_ENTRY,
  ]
  const lastUpdate = items.map((item) => item.date).sort().at(-1) as string

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
          { name: 'Project', path: PATH },
        ]}
      />

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="border-b border-gray py-12 lg:py-16">
        <div className="container-xl">
          <p className="eyebrow mb-5 flex items-center gap-3.5 text-primary">
            <span aria-hidden="true" className="h-[3px] w-10 bg-primary" />
            Project · how the site is made
          </p>
          <h1 className="max-w-[56rem] font-display text-[clamp(2.25rem,1.4rem+3.2vw,4rem)] font-bold leading-[1.02] tracking-[-0.025em] text-foreground">
            How this site is built and run
          </h1>
          <p className="mt-6 max-w-[46rem] text-lg leading-relaxed text-muted">
            The blog explains technical SEO techniques; this section explains the site itself: the
            tooling, the process and the decisions behind each page. Every entry points to the file,
            commit or pull request that backs what it says, and every number about the history comes
            with the command that reproduces it.
          </p>
        </div>
      </section>

      {/* ── Entries ───────────────────────────────────────────── */}
      <section className="container-xl py-12" aria-labelledby="entries-title">
        <h2 id="entries-title" className="font-display text-2xl font-bold tracking-[-0.01em] text-foreground">
          The entries
        </h2>
        <ol className="mt-6 border-b border-gray">
          {items.map(({ href, title, summary, date }, i) => (
            <li
              key={href}
              className="grid gap-x-6 gap-y-4 border-t border-gray py-9 md:grid-cols-[5rem_minmax(0,1fr)]"
            >
              <span className="font-display text-[0.9375rem] font-bold tracking-[0.1em] text-primary">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div className="flex min-w-0 flex-col gap-3">
                <h3 className="font-display text-[1.375rem] font-bold leading-tight tracking-[-0.015em] md:text-[1.75rem]">
                  <Link href={href} className="text-foreground transition-colors hover:text-primary">
                    {title}
                  </Link>
                </h3>
                <p className="max-w-[41rem] text-base leading-relaxed text-muted">{summary}</p>
                <p className="font-mono text-xs text-label">
                  updated <time dateTime={date}>{date}</time>
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* ── What each page answers ────────────────────────────── */}
      <section className="container-xl py-12" aria-labelledby="pages-title">
        <h2 id="pages-title" className="font-display text-2xl font-bold tracking-[-0.01em] text-foreground">
          What each page about the site answers
        </h2>
        <ul className="rich-text mt-6 flex max-w-[68ch] flex-col gap-3">
          {PAGES.map(({ href, label, answers }) => (
            <li key={href}>
              {href === PATH ? (
                <strong className="text-foreground">{label}</strong>
              ) : (
                <Link href={href} className={LINK}>
                  {label}
                </Link>
              )}
              : {answers}.
            </li>
          ))}
        </ul>
        <p className="mt-6 max-w-[68ch] text-base leading-relaxed text-muted">
          A measurement becomes an article on the{' '}
          <Link href="/en/blog" className={LINK}>
            blog
          </Link>{' '}
          and goes into the lab; the story of how the site was made, or of something that went
          wrong with it, goes here.
        </p>
      </section>

      {/* ── Source, in the repository ─────────────────────────── */}
      <section className="container-xl py-12" aria-labelledby="records-title">
        <h2 id="records-title" className="font-display text-2xl font-bold tracking-[-0.01em] text-foreground">
          The source, in the repository
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
      </section>
    </>
  )
}
