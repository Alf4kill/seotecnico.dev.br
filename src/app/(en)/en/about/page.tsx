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
// Mesmas seções de /sobre, na mesma ordem. Todo fato desta página precisa ser
// verificável no repositório. Nada de afirmação que o código não sustente.
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
            <strong>{site.name}</strong> is a public technical SEO laboratory for modern
            websites, with Next.js as the reference implementation, built by{' '}
            {site.author.name} — {site.author.jobTitle} and web developer. The premise is
            simple: instead of repeating theory, every technique documented here is implemented
            on this very domain and measured with real data from Google Search Console, the
            Chrome UX Report and before/after experiments.
          </p>

          <h2>Why a live lab?</h2>
          <p>
            Certifications prove theory; this site proves execution. The{' '}
            <a href={site.repository} target="_blank" rel="noopener noreferrer">
              code is public on GitHub
            </a>
            , SEO changes are logged as experiments with a hypothesis and a result, and the
            whole process — what worked and what did not — becomes content for the{' '}
            <Link href="/en/blog" title="Technical SEO blog in English">blog</Link> and the{' '}
            <Link
              href="/en/guide/technical-seo-nextjs"
              title="Technical SEO for Next.js: the App Router guide"
            >
              technical SEO guide for Next.js
            </Link>
            .
          </p>

          <h2>What you will find here</h2>
          <ul>
            <li>
              Technical SEO guides and articles, implemented in Next.js (App Router) with real
              code;
            </li>
            <li>
              <Link href="/en/tools" title="Free technical SEO tools">
                Free technical SEO tools
              </Link>
              , with no login and no stored data;
            </li>
            <li>
              SEO experiments documented with methodology and confidence levels, in the{' '}
              <Link href="/en/lab" title="Lab: technical SEO experiments">lab</Link>, and
              summarized in the{' '}
              <Link href="/en/case-studies" title="Case studies: technical SEO, measured">
                case studies
              </Link>
              .
            </li>
          </ul>

          <h2>Why the site looks like this</h2>
          <p>
            The visual design is a documented decision too: a dark background by default for
            long reads, a light theme with the same measured palette, square corners, three
            shapes instead of icons, and every color pair checked against the minimum
            contrast. The full explanation, with the design schools behind it, is in the{' '}
            <Link href="/en/design" title="Site design: Swiss retro-futurism">
              design colophon
            </Link>
            .
          </p>

          <h2>How the site is made</h2>
          <p>
            The process is public too: how AI is used in the work, how each page goes from
            research to merge, and which rules CI enforces. Each entry points to the file or
            commit that backs it up, in the{' '}
            <Link href="/en/project" title="Project: how this technical SEO site is built">
              Project
            </Link>{' '}
            section.
          </p>
        </div>

        <AvailabilityNote lang="en" />
      </section>
    </>
  )
}
