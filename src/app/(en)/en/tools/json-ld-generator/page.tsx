import Link from 'next/link'
import { buildMetadata } from '@/lib/metadata'
import { BreadcrumbJsonLd, SoftwareApplicationJsonLd } from '@/components/seo/JsonLd'
import { JsonLdGenerator } from '@/components/tools/JsonLdGenerator'
import { FaqSection } from '@/components/sections/FaqSection'
import { Emblem } from '@/components/art/Art'
import { TOOL_EMBLEMS } from '@/lib/art'

// ─────────────────────────────────────────────────────────────────────────────
// /en/tools/json-ld-generator — par de /ferramentas/gerador-json-ld
// (lib/hreflang.ts). Mesma ferramenta e mesmo padrão de página: client
// component com a UI + conteúdo explicativo renderizado no servidor abaixo.
// ─────────────────────────────────────────────────────────────────────────────

const TITLE = 'JSON-LD and structured data generator'
const DESCRIPTION =
  'Generate valid JSON-LD for Article, FAQPage, BreadcrumbList, Person and Organization, with output ready for Next.js. Free, no login, no stored data.'
const PATH = '/en/tools/json-ld-generator'

export const metadata = buildMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: PATH,
  lang: 'en',
})

const faqItems = [
  {
    question: 'Is the generator free? Is the data I type stored?',
    answer:
      'It is free and needs no login. Everything runs in your browser: no form field is sent to or stored on a server. The site records only an anonymous tool usage event (which schema type was generated), subject to your cookie consent.',
  },
  {
    question: 'Does JSON-LD help Google rankings?',
    answer:
      'Structured data is not a direct ranking factor, but it enables rich results (expanded FAQ, breadcrumb in the URL, article data) that increase visibility and CTR on the results page, and it helps Google understand entities such as the author and the organization.',
  },
  {
    question: 'Where do I paste the generated JSON-LD in Next.js?',
    answer:
      'In a Server Component of the page, inside a script tag with type application/ld+json, using dangerouslySetInnerHTML with JSON.stringify of the schema, escaping "<" as \\u003c, because JSON.stringify does not do it and a schema string could close the tag. The tool\'s "Next.js component" tab returns that code ready to use; it is the same pattern this site uses in production.',
  },
  {
    question: 'Do I need to validate the code before publishing?',
    answer:
      "Yes, always. Use Google's Rich Results Test to check eligibility for rich results and validator.schema.org for schema.org syntax. After publishing, follow structured data errors in Search Console's enhancement reports.",
  },
]

export default function JsonLdGeneratorPage() {
  return (
    <>
      <SoftwareApplicationJsonLd name={TITLE} description={DESCRIPTION} path={PATH} lang="en" />
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', path: '/en' },
          { name: 'Tools', path: '/en/tools' },
          { name: 'JSON-LD generator', path: PATH },
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
              JSON-LD generator
            </h1>
            <p className="mt-5 max-w-[46rem] text-lg leading-relaxed text-muted">
              Pick the schema type, fill in the form and generate valid
              schema.org structured data, as plain JSON-LD or as a Next.js
              component ready to paste into your project. Free, no login, and
              nothing you type is stored.
            </p>
          </div>
          <Emblem id={TOOL_EMBLEMS['gerador-json-ld']} className="hidden w-24 shrink-0 md:block lg:w-28" />
        </div>

        <JsonLdGenerator lang="en" />

        <div className="rich-text mt-16 max-w-[68ch] border-t border-gray pt-4">
          <h2>What JSON-LD is (and why Google prefers this format)</h2>
          <p>
            JSON-LD (JSON for Linked Data) is the structured data format that
            Google{' '}
            <a
              href="https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data"
              target="_blank"
              rel="noopener noreferrer"
            >
              officially recommends
            </a>
            : a block of JSON inside a <code>{'<script>'}</code> tag, separate
            from the visible HTML. Unlike microdata, it does not mix with the
            page markup, so the schema can be generated, tested and versioned
            like any other data. It is what makes a page eligible for rich
            results such as an expanded FAQ, breadcrumbs in the URL and article
            metadata in search.
          </p>

          <h2>How to implement JSON-LD in Next.js (App Router)</h2>
          <p>
            In the App Router, JSON-LD belongs in a <strong>Server
            Component</strong>: the schema ships in the initial HTML, visible to
            Googlebot without depending on JavaScript. The pattern, the same one
            the tool&apos;s &quot;Next.js component&quot; tab generates and the
            same one this site uses on every page:
          </p>
          <pre>
            <code>{`// components/seo/faq-json-ld.tsx
const schema = { /* generator output */ }

export function FaqJsonLd() {
  // JSON.stringify does not escape "<": the replace stops a schema string
  // from closing the script tag (as the Next.js JSON-LD guide recommends).
  const json = JSON.stringify(schema).replace(/</g, '\\\\u003c')
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />
}`}</code>
          </pre>
          <p>
            Render the component inside the page (not in{' '}
            <code>layout.tsx</code>, unless the schema applies to the whole
            site, like <code>WebSite</code>). This generator gives you the
            schema fast; for the full implementation, where each type lives in
            the App Router, how to derive <code>Article</code> from the
            frontmatter and how to lock it all down with automated tests, see{' '}
            <Link
              href="/en/blog/nextjs-json-ld"
              title="How to implement JSON-LD in Next.js (App Router)"
            >
              how to implement JSON-LD in Next.js
            </Link>
            .
          </p>

          <h2>How to validate structured data</h2>
          <p>
            Generate, then validate: the{' '}
            <a
              href="https://search.google.com/test/rich-results"
              target="_blank"
              rel="noopener noreferrer"
            >
              Rich Results Test
            </a>{' '}
            confirms eligibility for Google rich results, and the{' '}
            <a
              href="https://validator.schema.org/"
              target="_blank"
              rel="noopener noreferrer"
            >
              schema.org validator
            </a>{' '}
            checks the syntax. Once published, Search Console reports
            structured data errors and warnings in its enhancement reports;
            that is where you find out whether a template change broke
            something.
          </p>
        </div>
      </section>

      <FaqSection items={faqItems} titulo="Frequently asked questions" lang="en" />
    </>
  )
}
