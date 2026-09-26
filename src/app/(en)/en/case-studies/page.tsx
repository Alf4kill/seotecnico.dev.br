import type { ReactNode } from 'react'
import Link from 'next/link'
import { BreadcrumbJsonLd, WebPageJsonLd } from '@/components/seo/JsonLd'
import { buildMetadata } from '@/lib/metadata'
import { site } from '@/lib/site'
import { CASE_STUDIES_REVISED } from '@/lib/case-studies'

// ─────────────────────────────────────────────────────────────────────────────
// /en/case-studies — the evidence, in the two minutes a reviewer gives a site.
//
// The experiment log is the proof and is ~100 KB long; nobody hiring reads it
// cold. Each card is the log entry compressed to problem → what was done →
// measured result, with a link to the entry and the pull request so every
// number can be checked. The log stays the source; this page is the index.
//
// Rules this page keeps (the same ones as /en/about):
// - Every fact is verifiable in the repository. No claim the code or the log
//   does not support.
// - No site-traffic numbers (owner decision, 2026-09-13). Lab timings and
//   experiment counts are results; clicks and sessions are not shown here.
//
// English only, no hreflang pair: this page exists for the portfolio reader,
// who arrives by the author's name (see /en).
// ─────────────────────────────────────────────────────────────────────────────

const PATH = '/en/case-studies'
const TITLE = 'Case studies: technical SEO, measured'
const DESCRIPTION =
  'Four problems from this site, what was done in code and what was measured: LCP 4.9 s → 0.9 s, an SEO merge gate, AI crawler detection, hreflang.'

const LOG = `${site.repository}/blob/main/docs/experiment-log.md`
const pr = (n: number) => `${site.repository}/pull/${n}`

export const metadata = buildMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: PATH,
  lang: 'en',
  ogImage: { path: `${PATH}/opengraph-image`, alt: TITLE },
})

interface CaseStudy {
  id: string
  title: string
  metric: { value: string; label: string }
  problem: ReactNode
  done: ReactNode
  result: ReactNode
  links: { label: string; href: string; lang?: 'pt-BR' }[]
}

const CASES: CaseStudy[] = [
  {
    id: 'lcp',
    title: 'Homepage LCP: a render-delay fix, predicted before it shipped',
    metric: { value: '4.9 s → 0.9 s', label: 'LCP, PageSpeed Insights mobile' },
    problem: (
      <>
        PageSpeed Insights mobile scored the homepage 78, with an LCP of 4.9 s. The LCP
        element was text (the hero paragraph), so the image advice did not apply: 1.28 s of
        the time was render delay, held back by the site&rsquo;s only render-blocking
        request (the stylesheet) and a web font on the critical path.
      </>
    ),
    done: (
      <>
        Inlined the CSS with <code>experimental.inlineCss</code> (about 5 KB compressed),
        removing the render-blocking request, and moved the font to{' '}
        <code>display: optional</code> without a preload, so the fallback paints at once
        and no late swap repaints the hero. The hypothesis (render delay ≤ 1.0 s, LCP
        under the 2.0 s lab budget) went into the log before the deploy.
      </>
    ),
    result: (
      <>
        On production: Performance 100, LCP 0.9 s (equal to FCP), render delay 1,280 →
        530 ms, CLS 0. The 14 KiB &ldquo;legacy JavaScript&rdquo; warning was investigated
        and left alone: it is Next.js&rsquo;s own polyfill set, and a modern{' '}
        <code>browserslist</code> produced byte-identical output. The reason is recorded
        instead of the warning being hidden.
      </>
    ),
    links: [
      { label: 'Pull request #9', href: pr(9) },
      { label: 'Log entry, 2026-07-18', href: LOG },
    ],
  },
  {
    id: 'ci-gate',
    title: 'A CI gate that blocks deploys that break SEO, and the hole found in it',
    metric: { value: 'Every PR', label: 'blocked if an SEO invariant fails' },
    problem: (
      <>
        SEO regressions are silent. A dropped canonical, a one-sided hreflang or a 404 share
        image raises no error anywhere; it shows up weeks later in Search Console, if at
        all.
      </>
    ),
    done: (
      <>
        A Playwright suite reads every route from <code>sitemap.ts</code> and asserts one
        H1, title and description length, a self-referencing canonical, the expected
        JSON-LD types, reciprocal hreflang, <code>&lt;html lang&gt;</code> matching the
        page&rsquo;s own hreflang, and share images that resolve to a PNG. Lighthouse CI
        enforces performance budgets on the median of five runs, plus ceilings that do
        not move with runner CPU (script bytes, font files, DOM size).
      </>
    ),
    result: (
      <>
        The suite found a bug in itself: Next.js serves the attribute as{' '}
        <code>hrefLang</code> in camelCase, and the first helper was case-sensitive. Later
        the gate turned out to have a hole: <code>pull_request: branches: [main]</code>{' '}
        filters on the base branch, so stacked pull requests ran nothing. One of them had
        changed the budgets and the tests with zero runs. It was fixed in #61. Google Tag
        Manager&rsquo;s cost (about +200 ms of TBT) is now reported next to the budgets
        instead of being hidden inside a relaxed one.
      </>
    ),
    links: [
      { label: 'Pull request #10', href: pr(10) },
      { label: 'Pull request #61', href: pr(61) },
      { label: 'Pull request #63', href: pr(63) },
    ],
  },
  {
    id: 'ai-crawlers',
    title: 'Detecting AI crawlers: a pilot closed with its defects published',
    metric: { value: '62×', label: 'more undeclared networks than declared-and-disallowed' },
    problem: (
      <>
        &ldquo;Is AI using my content?&rdquo; is usually answered by reading user-agent
        strings, which anyone can send. A zero in that data cannot be told apart from a
        broken instrument.
      </>
    ),
    done: (
      <>
        Request-level telemetry in the Next.js proxy, with identity verification from
        vendor IP feeds, forward-confirmed reverse DNS and Web Bot Auth signatures; trap
        URLs reachable through one channel each; hypotheses and their windows written to
        the log before any data existed.
      </>
    ),
    result: (
      <>
        57 days and 5,480 events after excluding the owner&rsquo;s own traffic, which
        turned out to be 24% of the raw data. GPTBot, from an IP inside OpenAI&rsquo;s
        published range, fetched three disallowed paths, but it never fetched{' '}
        <code>robots.txt</code> in the window, so the finding is &ldquo;fetched without
        having read the directive&rdquo;, not &ldquo;ignored it&rdquo;. Two hypotheses
        were falsified and one was underpowered by about 10×, and all three are published.
        The main lesson: pre-register the statistical power, not only the hypothesis. A
        positive control in September then showed that the instrument records every AI
        assistant visit it should: 10 of 10, all with verified identity.
      </>
    ),
    links: [
      { label: 'Full case study', href: '/en/case-studies/ai-crawler-detection' },
      { label: 'Pull request #57', href: pr(57) },
      { label: 'Pilot verdicts', href: `${LOG}#pilot-closure-and-v2-pre-registration--2026-09-20` },
      { label: 'Method article (in Portuguese)', href: '/blog/detectar-crawlers-ia', lang: 'pt-BR' },
    ],
  },
  {
    id: 'hreflang',
    title: 'A bilingual layer that Google accepted as one cluster',
    metric: { value: '0', label: 'pages under a duplicate or Google-selected canonical' },
    problem: (
      <>
        The English guide lived inside the Portuguese layout. It served{' '}
        <code>&lt;html lang=&quot;pt-BR&quot;&gt;</code> against its own <code>en</code>{' '}
        hreflang, and every link around it led to a Portuguese page.
      </>
    ),
    done: (
      <>
        Translation pairs live in one module, so both sides of a pair come from the same
        object: reciprocity by construction rather than by discipline. Two root layouts
        through route groups serve <code>&lt;html lang=&quot;en&quot;&gt;</code> while
        every route stays static. The move had silently hashed every file-convention OG
        image URL. That was caught before merge, and the cards are now served by route
        handlers.
      </>
    ),
    result: (
      <>
        Search Console shows both pillar URLs drawing impressions independently, with zero
        pages under any duplicate or Google-selected-canonical reason, so the cluster is
        accepted. Two new assertions would have failed on the old code:{' '}
        <code>&lt;html lang&gt;</code> equals the page&rsquo;s own hreflang, and a 404
        carries exactly one robots meta.
      </>
    ),
    links: [
      { label: 'Pull request #37', href: pr(37) },
      { label: 'Pull request #44', href: pr(44) },
    ],
  },
]

const LINK_CLASS = 'text-primary underline underline-offset-[3px] hover:text-primary-hover'

function CaseLink({ label, href, lang }: CaseStudy['links'][number]) {
  if (href.startsWith('/')) {
    // Destination in the other root layout: no prefetch (see LanguageSwitch).
    return (
      <Link href={href} hrefLang={lang} prefetch={lang ? false : undefined} className={LINK_CLASS}>
        {label}
      </Link>
    )
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>
      {label} <span aria-hidden="true">↗</span>
    </a>
  )
}

export default function CaseStudiesPage() {
  return (
    <>
      <WebPageJsonLd
        path={PATH}
        name={TITLE}
        description={DESCRIPTION}
        lang="en"
        dateModified={CASE_STUDIES_REVISED}
        imagePath={`${PATH}/opengraph-image`}
      />
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', path: '/en' },
          { name: 'Case studies', path: PATH },
        ]}
      />

      <section className="container-xl py-12 lg:py-16">
        <p className="eyebrow mb-5 flex items-center gap-3.5 text-primary">
          <span aria-hidden="true" className="h-[3px] w-10 bg-primary" />
          Case studies · problem, fix, measurement
        </p>
        <h1 className="max-w-[56rem] font-display text-[clamp(2.25rem,1.4rem+3.2vw,4rem)] font-bold leading-[1.02] tracking-[-0.025em] text-foreground">
          Case studies: technical SEO, measured
        </h1>
        <p className="mt-6 max-w-[46rem] text-lg leading-relaxed text-muted">
          Four problems from this site, each solved in the codebase and measured. Each case
          links to the pull request with the change and to the{' '}
          <a href={LOG} target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>
            experiment log
          </a>{' '}
          entry where the hypothesis was written before the result existed. By{' '}
          <Link href="/en/about" className={LINK_CLASS}>
            {site.author.name}
          </Link>
          .
        </p>

        <div className="mt-12 flex flex-col">
          {CASES.map((c, i) => (
            <article
              key={c.id}
              id={c.id}
              aria-labelledby={`${c.id}-title`}
              className="grid gap-6 border-t border-gray py-10 lg:grid-cols-12 lg:gap-10"
            >
              <div className="flex flex-col gap-3 lg:col-span-4">
                <p className="eyebrow text-primary">{String(i + 1).padStart(2, '0')}</p>
                <p className="font-display text-[2rem] font-bold leading-none tracking-[-0.02em] text-primary">
                  {c.metric.value}
                </p>
                <p className="eyebrow text-[0.625rem]">{c.metric.label}</p>
              </div>
              <div className="flex flex-col gap-5 lg:col-span-8">
                <h2
                  id={`${c.id}-title`}
                  className="font-display text-[clamp(1.5rem,1.1rem+1.4vw,2.125rem)] font-bold leading-[1.1] tracking-[-0.02em] text-foreground"
                >
                  {c.title}
                </h2>
                <dl className="rich-text flex max-w-[68ch] flex-col gap-4">
                  <div>
                    <dt className="eyebrow">Problem</dt>
                    <dd className="mt-1.5">{c.problem}</dd>
                  </div>
                  <div>
                    <dt className="eyebrow">What was done</dt>
                    <dd className="mt-1.5">{c.done}</dd>
                  </div>
                  <div>
                    <dt className="eyebrow">Measured result</dt>
                    <dd className="mt-1.5">{c.result}</dd>
                  </div>
                </dl>
                <ul className="flex flex-wrap gap-x-6 gap-y-2 text-[0.9375rem]">
                  {c.links.map((link) => (
                    <li key={link.href}>
                      <CaseLink {...link} />
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  )
}
