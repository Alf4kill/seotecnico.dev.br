import Link from 'next/link'
import { Emblem } from '@/components/art/Art'
import { TOOL_EMBLEMS } from '@/lib/art'
import type { Lang } from '@/lib/hreflang'

// ─────────────────────────────────────────────────────────────────────────────
// "Do artigo para a prática" — a faixa que liga conteúdo às três ferramentas
// (§6: todo artigo leva a ≥1 ferramenta; aqui a listagem também leva). Cada
// ferramenta ganha uma forma primária, como as categorias, e o seu emblema
// (src/lib/art.ts) — a mesma arte do cabeçalho da ferramenta.
//
// Em inglês, as ferramentas continuam em português (não há versão inglesa
// delas): os nomes vêm em inglês, a faixa avisa que a interface é portuguesa,
// e os links levam hrefLang, sem prefetch, por cruzarem de root layout.
// ─────────────────────────────────────────────────────────────────────────────

const TOOLS = [
  {
    href: '/ferramentas/gerador-json-ld',
    title: 'Gerador de JSON-LD',
    titleEn: 'JSON-LD generator',
    emblem: TOOL_EMBLEMS['gerador-json-ld'],
    note: 'Sem login, sem limite.',
    noteEn: 'No login, no limit.',
    mark: <span aria-hidden="true" className="h-4.5 w-4.5 rounded-full bg-primary" />,
  },
  {
    href: '/ferramentas/validador-meta-tags',
    title: 'Validador de meta tags',
    titleEn: 'Meta tag validator',
    emblem: TOOL_EMBLEMS['validador-meta-tags'],
    note: 'Cola a URL e compara.',
    noteEn: 'Paste the URL and compare.',
    mark: <span aria-hidden="true" className="h-4.5 w-4.5 bg-accent" />,
  },
  {
    href: '/ferramentas/checador-cwv',
    title: 'Checador de Core Web Vitals',
    titleEn: 'Core Web Vitals checker',
    emblem: TOOL_EMBLEMS['checador-cwv'],
    note: 'Dados de campo do CrUX, sem instalar nada.',
    noteEn: 'CrUX field data, nothing to install.',
    mark: (
      <span
        aria-hidden="true"
        className="h-0 w-0 border-x-[10px] border-b-[18px] border-x-transparent border-b-shape-danger"
      />
    ),
  },
]

const COPY = {
  'pt-BR': {
    eyebrow: 'Do artigo para a prática',
    heading: 'Toda técnica aqui tem uma ferramenta gratuita do lado.',
    interfaceNote: undefined,
  },
  en: {
    eyebrow: 'From article to practice',
    heading: 'Every technique here has a free tool next to it.',
    interfaceNote: 'The tools have a Portuguese interface; the results read the same in any language.',
  },
} as const

export function ToolsStrip({
  headingLevel = 'h2',
  lang = 'pt-BR',
}: {
  headingLevel?: 'h2' | 'h3'
  lang?: Lang
}) {
  const Heading = headingLevel
  const copy = COPY[lang]
  const en = lang === 'en'
  return (
    <section className="container-xl">
      <div className="grid gap-8 border border-gray bg-surface p-6 md:p-10 lg:grid-cols-12 lg:gap-6">
        <div className="flex flex-col gap-3.5 lg:col-span-5">
          <p className="eyebrow text-accent">{copy.eyebrow}</p>
          <Heading className="font-display text-[1.75rem] font-bold leading-tight tracking-[-0.02em] text-foreground md:text-[2.125rem]">
            {copy.heading}
          </Heading>
          {copy.interfaceNote && <p className="text-[0.9375rem] leading-relaxed text-muted">{copy.interfaceNote}</p>}
        </div>
        <ul className="grid gap-4 sm:grid-cols-3 lg:col-span-7 lg:gap-6">
          {TOOLS.map(({ href, title, titleEn, note, noteEn, mark, emblem }) => (
            <li key={href}>
              <Link
                href={href}
                hrefLang={en ? 'pt-BR' : undefined}
                prefetch={en ? false : undefined}
                className="flex h-full flex-col gap-2.5 border border-gray bg-surface-2 p-5 transition-colors hover:border-primary"
              >
                <span className="flex items-start justify-between">
                  {mark}
                  <Emblem id={emblem} className="h-10 w-10" />
                </span>
                <span className="font-display text-[1.0625rem] font-medium text-foreground">{en ? titleEn : title}</span>
                <span className="text-[0.8125rem] leading-normal text-muted">{en ? noteEn : note}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
