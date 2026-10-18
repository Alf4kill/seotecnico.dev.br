import Link from 'next/link'
import { buildMetadata } from '@/lib/metadata'
import { BreadcrumbJsonLd } from '@/components/seo/JsonLd'
import { Emblem } from '@/components/art/Art'
import { CentralMark } from '@/components/art/Marks'
import { TOOL_EMBLEMS } from '@/lib/art'

// /en/tools — par de /ferramentas (lib/hreflang.ts): o mesmo índice, com as
// três ferramentas na versão inglesa.

export const metadata = buildMetadata({
  title: 'Free technical SEO tools',
  description:
    'Free SEO tools for developers: a JSON-LD generator, a meta tag validator and a Core Web Vitals checker. No login.',
  path: '/en/tools',
  lang: 'en',
})

const tools = [
  {
    mark: 'h-12 w-12 rounded-full bg-primary',
    name: 'JSON-LD generator',
    description:
      'Build valid schema.org structured data (Article, FAQ, Organization and more) from a simple form.',
    href: '/en/tools/json-ld-generator',
    emblem: TOOL_EMBLEMS['gerador-json-ld'],
  },
  {
    mark: 'h-12 w-12 bg-accent',
    name: 'Meta tag validator',
    description:
      'Paste a URL and see the title, description, canonical and Open Graph as Google reads them, with warnings about problems.',
    href: '/en/tools/meta-tag-validator',
    emblem: TOOL_EMBLEMS['validador-meta-tags'],
  },
  {
    mark: 'h-0 w-0 border-x-[27px] border-b-[48px] border-x-transparent border-b-shape-danger',
    name: 'Core Web Vitals checker',
    description:
      "Look up any domain's real LCP, INP and CLS using the public data of the Chrome UX Report (CrUX).",
    href: '/en/tools/cwv-checker',
    emblem: TOOL_EMBLEMS['checador-cwv'],
  },
]

// Cada ferramenta tem uma forma primária — as mesmas três peças que marcam as
// categorias do blog. O sistema não usa ícone ilustrativo (docs/design-system.md).

export default function EnglishToolsPage() {
  return (
    <section className="container-xl relative overflow-hidden py-12 lg:py-16">
      {/* Marca central A2 (volume axonométrico) — a da prancha para ferramentas. */}
      <CentralMark variant="axonometric" className="-right-24 -top-24 w-[30rem] lg:right-[12%] lg:w-[36rem]" />
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', path: '/en' },
          { name: 'Tools', path: '/en/tools' },
        ]}
      />

      <div className="relative flex items-start justify-between gap-8">
        <div className="min-w-0">
          <p className="eyebrow mb-5 flex items-center gap-3.5 text-primary">
            <span aria-hidden="true" className="h-[3px] w-10 bg-primary" />
            Tools · no login, no stored data
          </p>
          <h1 className="font-display text-[clamp(2.25rem,1.4rem+3.2vw,4rem)] font-bold leading-[1.02] tracking-[-0.025em] text-foreground">
            Free technical SEO tools
          </h1>
          <p className="mt-5 max-w-[46rem] text-lg leading-relaxed text-muted">
            Free technical SEO tools built for developers: no login, no stored
            data and open source on GitHub. The JSON-LD generator, the meta tag
            validator and the Core Web Vitals checker are live.
          </p>
        </div>
        <Emblem id={TOOL_EMBLEMS.index} className="hidden w-24 shrink-0 md:block lg:w-28" />
      </div>

      <ul className="relative mt-12 grid gap-6 md:grid-cols-3">
        {tools.map(({ mark, name, description, href, emblem }) => (
          <li key={name}>
            <Link
              href={href}
              title={name}
              className="group flex h-full flex-col gap-4 border border-gray bg-surface p-7 transition-colors hover:border-primary"
            >
              <span className="flex items-start justify-between">
                <span aria-hidden="true" className={mark} />
                <Emblem id={emblem} className="h-12 w-12" />
              </span>
              <h2 className="pt-4 font-display text-2xl font-bold leading-tight text-foreground group-hover:text-primary">
                {name}
              </h2>
              <p className="flex-1 text-[0.9375rem] leading-relaxed text-muted">{description}</p>
              <span className="border-t border-gray pt-4 font-mono text-xs uppercase tracking-[0.08em] text-accent">
                Use the tool <span aria-hidden="true">→</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
