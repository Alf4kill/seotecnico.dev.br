import Link from 'next/link'
import { PersonJsonLd, BreadcrumbJsonLd } from '@/components/seo/JsonLd'
import { buildMetadata } from '@/lib/metadata'
import { site } from '@/lib/site'
import { Scene } from '@/components/art/Art'
import { PAGE_ART } from '@/lib/art'
import { AvailabilityNote } from '@/components/sections/AvailabilityNote'

// ─────────────────────────────────────────────────────────────────────────────
// "Sobre" em inglês — par de hreflang de /sobre (lib/hreflang.ts).
//
// Emite o MESMO nó `Person` (@id `/sobre#person`) que o resto do site: é uma
// pessoa só, com duas páginas que falam dela. Um @id novo aqui criaria, para
// quem lê o grafo, um segundo autor homônimo.
//
// Todo fato desta página precisa ser verificável no repositório — a suíte, o
// log de experimentos, o RUM. Nada de afirmação que o código não sustente.
// ─────────────────────────────────────────────────────────────────────────────

const PATH = '/en/about'

export const metadata = buildMetadata({
  title: `About ${site.author.name}`,
  description:
    'Who builds SEO Técnico: a web developer doing technical SEO in the codebase — with tests, a CI gate and real Search Console data.',
  path: PATH,
  lang: 'en',
})

export default function EnglishAboutPage() {
  return (
    <>
      <PersonJsonLd />
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', path: '/en' },
          { name: 'About', path: PATH },
        ]}
      />

      <section className="container-xl py-12 lg:py-16">
        <div className="flex items-end justify-between gap-8">
          <div className="min-w-0">
            <p className="eyebrow mb-5 flex items-center gap-3.5 text-primary">
              <span aria-hidden="true" className="h-[3px] w-10 bg-primary" />
              About · author and project
            </p>
            <h1 className="font-display text-[clamp(2.25rem,1.4rem+3.2vw,4rem)] font-bold leading-[1.02] tracking-[-0.025em] text-foreground">
              About {site.author.name}
            </h1>
          </div>
          {/* Cena "Contemplação": a página do autor (docs/design-system.md → Arte). */}
          <Scene id={PAGE_ART.about} className="hidden w-64 shrink-0 md:block lg:w-80" />
        </div>

        <div className="rich-text mt-10 max-w-[68ch]">
          <p>
            <strong>{site.name}</strong> is a public technical SEO laboratory for Next.js, built
            and run by {site.author.name} — a web developer working in PHP, Next.js and Python
            who does technical SEO the way a developer does it: in the codebase, with tests, and
            with measurement.
          </p>

          <h2>Why a live lab</h2>
          <p>
            Certifications prove theory. This site exists to prove execution. Instead of
            describing techniques, it implements each one on this domain and measures the result
            with Google Search Console, the Chrome UX Report and before/after experiments. The{' '}
            <a href={site.repository} target="_blank" rel="noopener noreferrer">
              source code is public
            </a>
            , and so are the results — the ones that worked and the ones that did not.
          </p>

          <h2>How the work is done</h2>
          <ul>
            <li>
              <strong>Hypothesis first.</strong> Every deliberate SEO change goes into the{' '}
              <a
                href={`${site.repository}/blob/main/docs/experiment-log.md`}
                target="_blank"
                rel="noopener noreferrer"
              >
                experiment log
              </a>{' '}
              with its prediction before the result exists, and is judged against Search Console
              data once its window closes.
            </li>
            <li>
              <strong>SEO as a merge gate.</strong> A Playwright suite checks every route for a
              single H1, title and description length, a self-referencing canonical, valid
              JSON-LD and reciprocal hreflang. Lighthouse CI enforces performance budgets. Any
              failure blocks the merge.
            </li>
            <li>
              <strong>Its own field data.</strong> Core Web Vitals are collected from real visits
              with the <code>web-vitals</code> library, sent through Google Tag Manager to GA4
              behind Consent Mode v2 — so there is field data before the Chrome UX Report has
              enough traffic to report any.
            </li>
          </ul>

          <h2>What is in English</h2>
          <p>
            This page, the{' '}
            <Link href="/en" title={`${site.name} — home`}>
              home page
            </Link>{' '}
            and the{' '}
            <Link
              href="/en/guide/technical-seo-nextjs"
              title="Technical SEO for Next.js: the App Router guide"
            >
              technical SEO guide for Next.js
            </Link>
            , plus the{' '}
            <Link href="/en/design" title="Site design: Swiss retro-futurism">
              design colophon
            </Link>
            , which explains the visual system and its measured contrast. The articles and the
            three free tools are in Portuguese; the guide links to them where they go deeper.
          </p>
        </div>

        <AvailabilityNote lang="en" />
      </section>
    </>
  )
}
