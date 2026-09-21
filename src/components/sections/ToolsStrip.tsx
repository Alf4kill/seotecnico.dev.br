import Link from 'next/link'

// ─────────────────────────────────────────────────────────────────────────────
// "Do artigo para a prática" — a faixa que liga conteúdo às três ferramentas
// (§6: todo artigo leva a ≥1 ferramenta; aqui a listagem também leva). Cada
// ferramenta ganha uma forma primária, como as categorias; nenhum ícone.
// ─────────────────────────────────────────────────────────────────────────────

const TOOLS = [
  {
    href: '/ferramentas/gerador-json-ld',
    title: 'Gerador de JSON-LD',
    note: 'Sem login, sem limite.',
    mark: <span aria-hidden="true" className="h-4.5 w-4.5 rounded-full bg-primary" />,
  },
  {
    href: '/ferramentas/validador-meta-tags',
    title: 'Validador de meta tags',
    note: 'Cola a URL e compara.',
    mark: <span aria-hidden="true" className="h-4.5 w-4.5 bg-accent" />,
  },
  {
    href: '/ferramentas/checador-cwv',
    title: 'Checador de Core Web Vitals',
    note: 'Dados de campo do CrUX, sem instalar nada.',
    mark: (
      <span
        aria-hidden="true"
        className="h-0 w-0 border-x-[10px] border-b-[18px] border-x-transparent border-b-shape-danger"
      />
    ),
  },
]

export function ToolsStrip({ headingLevel = 'h2' }: { headingLevel?: 'h2' | 'h3' }) {
  const Heading = headingLevel
  return (
    <section className="container-xl">
      <div className="grid gap-8 border border-gray bg-surface p-6 md:p-10 lg:grid-cols-12 lg:gap-6">
        <div className="flex flex-col gap-3.5 lg:col-span-5">
          <p className="eyebrow text-accent">Do artigo para a prática</p>
          <Heading className="font-display text-[1.75rem] font-bold leading-tight tracking-[-0.02em] text-foreground md:text-[2.125rem]">
            Toda técnica aqui tem uma ferramenta gratuita do lado.
          </Heading>
        </div>
        <ul className="grid gap-4 sm:grid-cols-3 lg:col-span-7 lg:gap-6">
          {TOOLS.map(({ href, title, note, mark }) => (
            <li key={href}>
              <Link
                href={href}
                className="flex h-full flex-col gap-2.5 border border-gray bg-surface-2 p-5 transition-colors hover:border-primary"
              >
                {mark}
                <span className="font-display text-[1.0625rem] font-medium text-foreground">{title}</span>
                <span className="text-[0.8125rem] leading-normal text-muted">{note}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
