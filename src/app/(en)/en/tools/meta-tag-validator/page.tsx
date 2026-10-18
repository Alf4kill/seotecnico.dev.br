import Link from 'next/link'
import { buildMetadata } from '@/lib/metadata'
import { BreadcrumbJsonLd, SoftwareApplicationJsonLd } from '@/components/seo/JsonLd'
import { MetaValidator } from '@/components/tools/MetaValidator'
import { FaqSection } from '@/components/sections/FaqSection'
import { Emblem } from '@/components/art/Art'
import { TOOL_EMBLEMS } from '@/lib/art'

// ─────────────────────────────────────────────────────────────────────────────
// /en/tools/meta-tag-validator — par de /ferramentas/validador-meta-tags
// (lib/hreflang.ts). A mesma rota de API (/api/validador-meta), chamada com
// `lang=en` para as mensagens voltarem em inglês.
// ─────────────────────────────────────────────────────────────────────────────

const TITLE = 'Meta tag and Open Graph validator'
const DESCRIPTION =
  'Paste a URL and see how Google and social networks read your page: title, description, canonical, robots and Open Graph, with what to fix.'
const PATH = '/en/tools/meta-tag-validator'

export const metadata = buildMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: PATH,
  lang: 'en',
})

const faqItems = [
  {
    question: 'Is the validator free? Is the URL I paste stored?',
    answer:
      'It is free and needs no login. The server fetches the URL once to read the tags, and it is neither stored nor logged. The site keeps only an anonymous tool usage event (how many problems were found), subject to your cookie consent.',
  },
  {
    question: 'Why are the limits 60 characters for the title and 155 for the description?',
    answer:
      'Because that is roughly where Google truncates on the results page (the real cut is in pixels, not characters; 60/155 is the safe margin used in practice). Going over is not a penalty: the text just shows up cut off, which tends to lower CTR.',
  },
  {
    question: 'What is a self-referencing canonical and why does it matter?',
    answer:
      "It is the link rel=\"canonical\" tag pointing to the page's own URL. It consolidates variants (campaign parameters, trailing slash, http/https) into a single indexable address. Every indexable page should have one; it is one of the checks this site's own test suite enforces in CI.",
  },
  {
    question: 'Does the tool work with pages that depend on JavaScript?',
    answer:
      'The validator reads the HTML the server responds with, the same document a crawler gets on its first pass. If your meta tags only exist after JavaScript runs (a SPA without SSR), they do not show up here, and that is exactly the problem to fix: render the tags on the server.',
  },
]

export default function MetaTagValidatorPage() {
  return (
    <>
      <SoftwareApplicationJsonLd name={TITLE} description={DESCRIPTION} path={PATH} lang="en" />
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', path: '/en' },
          { name: 'Tools', path: '/en/tools' },
          { name: 'Meta tag validator', path: PATH },
        ]}
      />

      <section className="container-xl py-12 lg:py-16">
        <div className="flex items-start justify-between gap-8">
          <div className="min-w-0">
            <p className="eyebrow mb-5 flex items-center gap-3.5 text-primary">
              <span aria-hidden="true" className="h-[3px] w-10 bg-primary" />
              Free tool · no login
            </p>
            <h1 className="font-display text-[clamp(2.25rem,1.4rem+3.2vw,4rem)] font-bold leading-[1.02] tracking-[-0.025em] text-foreground">
              Meta tag validator
            </h1>
            <p className="mt-5 max-w-[46rem] text-lg leading-relaxed text-muted">
              Paste the URL of any page and see what Google and social networks
              actually read: title, meta description, canonical, robots, H1 and
              Open Graph, with a SERP preview and warnings about what to fix.
              Free, no login, and the URL is not stored.
            </p>
          </div>
          <Emblem id={TOOL_EMBLEMS['validador-meta-tags']} className="hidden w-24 shrink-0 md:block lg:w-28" />
        </div>

        <MetaValidator lang="en" />

        <div className="rich-text mt-16 max-w-[68ch] border-t border-gray pt-4">
          <h2>What the validator checks (and against which standard)</h2>
          <p>
            The checks are the ones this site enforces on itself in CI: a title
            present and up to 60 characters, a meta description up to 155, an
            absolute self-referencing canonical, exactly one H1, the{' '}
            <code>lang</code> attribute, charset, viewport and the Open Graph
            tags that feed link previews on WhatsApp, LinkedIn and the like.
            Each item comes back as ok, warning or error, with the reason, not
            just the verdict. The full standard, with the rationale for each tag
            and the code to implement them in the App Router, is in the guide to
            the{' '}
            <Link
              href="/en/blog/nextjs-metadata-api"
              title="Next.js Metadata API: canonical and the merge that isn't"
            >
              Next.js Metadata API
            </Link>
            .
          </p>

          <h2>Why validate the server HTML, not the DOM</h2>
          <p>
            The tool reads the raw HTML response of your URL, the same document
            Googlebot gets on its first pass, before any JavaScript. Meta tags
            injected on the client may still be seen by Google in the rendering
            queue, but they arrive late, compete with what came in the HTML and
            disappear for crawlers that do not run JS (most AI agents, for
            instance, as measured on this very domain). If your title only
            exists after hydration, the diagnosis is not about the tag, it is
            about rendering: the{' '}
            <Link
              href="/en/blog/nextjs-ssr-ssg-isr"
              title="SSR, SSG and ISR in Next.js: what Googlebot sees"
            >
              SSR, SSG and ISR comparison
            </Link>{' '}
            shows what each strategy delivers to the crawler.
          </p>

          <h2>Canonical: the check that fails most often</h2>
          <p>
            A canonical that is missing, relative or pointing to another URL is
            the most common problem the tool finds, and the cheapest to fix. The
            rule of thumb: every indexable page carries an absolute canonical
            pointing to itself; variants (parameters, trailing slash, the http
            version) consolidate into the canonical address. When to use a
            canonical, when to redirect and when to use noindex, and why{' '}
            <code>noindex</code> + <code>Disallow</code> cancel each other out,
            is covered in{' '}
            <Link
              href="/en/blog/nextjs-redirects-canonicals"
              title="Redirects and canonicals in Next.js: config or middleware"
            >
              redirects and canonicals in Next.js
            </Link>
            . The full context of technical SEO for Next.js, from scratch to CI,
            is in the{' '}
            <Link
              href="/en/guide/technical-seo-nextjs"
              title="Technical SEO for Next.js: the App Router guide"
            >
              technical SEO guide for Next.js
            </Link>
            .
          </p>
        </div>
      </section>

      <FaqSection items={faqItems} titulo="Frequently asked questions" lang="en" />
    </>
  )
}
