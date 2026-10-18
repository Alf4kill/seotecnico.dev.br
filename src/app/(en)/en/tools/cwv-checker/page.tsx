import Link from 'next/link'
import { buildMetadata } from '@/lib/metadata'
import { BreadcrumbJsonLd, SoftwareApplicationJsonLd } from '@/components/seo/JsonLd'
import { CwvChecker } from '@/components/tools/CwvChecker'
import { FaqSection } from '@/components/sections/FaqSection'
import { Emblem } from '@/components/art/Art'
import { TOOL_EMBLEMS } from '@/lib/art'

// ─────────────────────────────────────────────────────────────────────────────
// /en/tools/cwv-checker — par de /ferramentas/checador-cwv (lib/hreflang.ts).
// A mesma rota de API (/api/checador-cwv), chamada com `lang=en` para as
// mensagens de erro voltarem em inglês.
// ─────────────────────────────────────────────────────────────────────────────

const TITLE = 'Core Web Vitals checker (field data)'
const DESCRIPTION =
  "Look up any site's real LCP, INP and CLS in the Chrome UX Report: the p75 of real users over the last 28 days, with how visits are distributed."
const PATH = '/en/tools/cwv-checker'

export const metadata = buildMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: PATH,
  lang: 'en',
})

const faqItems = [
  {
    question: 'Why does my site show up as "not in the dataset"?',
    answer:
      'Because CrUX only publishes an origin once it gathers enough visitors in the 28-day window, using Chrome with usage statistics sharing turned on. New or low-traffic sites simply do not appear; it is neither a defect of the site nor a performance verdict. Meanwhile, measure with Lighthouse (lab) or set up your own RUM.',
  },
  {
    question: 'How do these numbers differ from the Lighthouse score?',
    answer:
      'They are different things. Lighthouse is lab: one load, one emulated device, one simulated network, which is great for diagnosis. CrUX is field: the 75th percentile of real visits over the last 28 days, across all your users\' devices and networks. The field is what Google uses as a ranking signal, and it is normal for a site with 100 in Lighthouse to have worse field data.',
  },
  {
    question: 'Why does the result for example.com differ from www.example.com?',
    answer:
      'Because to CrUX they are different origins, with separate datasets. The tool never strips the www on its own: doing so would return data for another address without warning. Check exactly the origin your users visit.',
  },
  {
    question: 'Why is LCP good while some users are in "poor"?',
    answer:
      'Because the p75 is a single cut-off point: it says that 75% of visits came in below that value, and nothing about the remaining quarter. That is why each metric here also shows the distribution across three bands. An origin can be "good" at the p75 with 20% of users in "poor", usually a specific segment of devices or networks.',
  },
  {
    question: 'Is the tool free? Is the address I check stored?',
    answer:
      'It is free and needs no login. The origin you check is neither stored nor logged; the site keeps only an anonymous event with the LCP band (good, needs improvement, poor or no data), subject to your cookie consent.',
  },
]

export default function CwvCheckerPage() {
  return (
    <>
      <SoftwareApplicationJsonLd name={TITLE} description={DESCRIPTION} path={PATH} lang="en" />
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', path: '/en' },
          { name: 'Tools', path: '/en/tools' },
          { name: 'Core Web Vitals checker', path: PATH },
        ]}
      />

      <section className="container-xl py-12 lg:py-16">
        <div className="flex items-start justify-between gap-8">
          <div className="min-w-0">
            <p className="eyebrow mb-5 flex items-center gap-3.5 text-primary">
              <span aria-hidden="true" className="h-[3px] w-10 bg-primary" />
              Free tool · CrUX data
            </p>
            <h1 className="font-display text-[clamp(2.25rem,1.4rem+3.2vw,4rem)] font-bold leading-[1.02] tracking-[-0.025em] text-foreground">
              Core Web Vitals checker
            </h1>
            <p className="mt-5 max-w-[46rem] text-lg leading-relaxed text-muted">
              Type an address and see the field Core Web Vitals of that origin:
              LCP, INP and CLS at the 75th percentile of real users over the last
              28 days, straight from the Chrome UX Report, with how visits are
              distributed across the bands. Free, no login, and the address you
              check is not stored.
            </p>
          </div>
          <Emblem id={TOOL_EMBLEMS['checador-cwv']} className="hidden w-24 shrink-0 md:block lg:w-28" />
        </div>

        <CwvChecker lang="en" />

        <div className="rich-text mt-16 max-w-[68ch] border-t border-gray pt-4">
          <h2>Field and lab measure different things</h2>
          <p>
            The number this tool shows comes from the <strong>field</strong>:
            real visits, real devices, real networks, aggregated by the Chrome
            UX Report over a 28-day window. That is the data Google uses as a
            signal, and that is why it does not match the Lighthouse score,
            which runs a single load on an emulated device. Both measurements
            are useful and do not compete: the field tells you <em>whether</em>{' '}
            there is a problem and for whom; the lab tells you <em>where</em> it
            is and lets you test the fix before shipping.
          </p>
          <p>
            This site practices the separation it teaches. The budgets that
            block CI here are lab budgets, deliberately stricter than the field
            thresholds: LCP under 2.0s in the lab against the field&apos;s 2.5s.
            The gap is not a disagreement with the published threshold; it is
            headroom, because the field p75 includes the slow tail that an
            emulated run never sees.
          </p>

          <h2>The thresholds the tool applies</h2>
          <p>
            They are the ones Google publishes for field data, at the
            origin&apos;s p75: LCP good up to 2.5s and poor above 4s; INP good
            up to 200ms and poor above 500ms; CLS good up to 0.1 and poor above
            0.25. FCP and TTFB appear as support: they are not Core Web Vitals
            and do not count for ranking, but a high TTFB explains a good share
            of poor LCPs. How to diagnose each one in the App Router is in the{' '}
            <Link
              href="/en/blog/improve-lcp-nextjs"
              title="How to improve LCP in Next.js: a guide by the 4 subparts"
            >
              LCP guide by its 4 subparts
            </Link>{' '}
            and in{' '}
            <Link href="/en/blog/nextjs-inp" title="INP in Next.js: how to diagnose and fix it">
              INP in Next.js
            </Link>
            .
          </p>

          <h2>When CrUX does not have your site</h2>
          <p>
            It is the most common result, and it does not mean performance is
            poor: it means the origin has not gathered enough visitors in the
            period yet. The absence is itself a data point: the moment a new
            domain <em>enters</em> CrUX is a measurable milestone, and this
            project recorded its own absence in the July 2026 baseline precisely
            so it could measure the entry later. Until field data exists, the
            way forward is RUM on your own site, which is what this domain does
            with the <code>web-vitals</code> library sending real LCP and INP to
            GA4. The step-by-step is in the{' '}
            <Link
              href="/en/guide/technical-seo-nextjs"
              title="Technical SEO for Next.js: the App Router guide"
            >
              technical SEO guide for Next.js
            </Link>
            . To check the tags of the same page, use the{' '}
            <Link
              href="/en/tools/meta-tag-validator"
              title="Meta tag and Open Graph validator"
            >
              meta tag validator
            </Link>
            .
          </p>
        </div>
      </section>

      <FaqSection items={faqItems} titulo="Frequently asked questions" lang="en" />
    </>
  )
}
