import Link from 'next/link'
import { buildMetadata } from '@/lib/metadata'
import { BreadcrumbJsonLd } from '@/components/seo/JsonLd'
import { Emblem } from '@/components/art/Art'
import { CentralMark } from '@/components/art/Marks'
import { TOOL_EMBLEMS } from '@/lib/art'

export const metadata = buildMetadata({
  title: 'Ferramentas gratuitas de SEO técnico',
  description:
    'Ferramentas gratuitas de SEO para desenvolvedores: gerador de JSON-LD, validador de meta tags e checador de Core Web Vitals. Sem login.',
  path: '/ferramentas',
})

const ferramentas = [
  {
    mark: 'h-12 w-12 rounded-full bg-primary',
    nome: 'Gerador de JSON-LD',
    descricao:
      'Monte dados estruturados schema.org válidos (Article, FAQ, Organization e mais) a partir de um formulário simples.',
    href: '/ferramentas/gerador-json-ld',
    emblem: TOOL_EMBLEMS['gerador-json-ld'],
  },
  {
    mark: 'h-12 w-12 bg-accent',
    nome: 'Validador de meta tags',
    descricao:
      'Cole uma URL e veja title, description, canonical e Open Graph como o Google enxerga — com alertas de problemas.',
    href: '/ferramentas/validador-meta-tags',
    emblem: TOOL_EMBLEMS['validador-meta-tags'],
  },
  {
    mark: 'h-0 w-0 border-x-[27px] border-b-[48px] border-x-transparent border-b-shape-danger',
    nome: 'Checador de Core Web Vitals',
    descricao:
      'Consulte LCP, INP e CLS reais de qualquer domínio usando os dados públicos do Chrome UX Report (CrUX).',
    href: '/ferramentas/checador-cwv',
    emblem: TOOL_EMBLEMS['checador-cwv'],
  },
]

// Cada ferramenta tem uma forma primária — as mesmas três peças que marcam as
// categorias do blog. O sistema não usa ícone ilustrativo (docs/design-system.md).

export default function FerramentasPage() {
  return (
    <section className="container-xl relative overflow-hidden py-12 lg:py-16">
      {/* Marca central A2 (volume axonométrico) — a da prancha para ferramentas. */}
      <CentralMark variant="axonometric" className="-right-24 -top-24 w-[30rem] lg:right-[12%] lg:w-[36rem]" />
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', path: '/' },
          { name: 'Ferramentas', path: '/ferramentas' },
        ]}
      />

      <div className="relative flex items-start justify-between gap-8">
        <div className="min-w-0">
          <p className="eyebrow mb-5 flex items-center gap-3.5 text-primary">
            <span aria-hidden="true" className="h-[3px] w-10 bg-primary" />
            Ferramentas · sem login, sem armazenar dados
          </p>
          <h1 className="font-display text-[clamp(2.25rem,1.4rem+3.2vw,4rem)] font-bold leading-[1.02] tracking-[-0.025em] text-foreground">
            Ferramentas gratuitas de SEO técnico
          </h1>
          <p className="mt-5 max-w-[46rem] text-lg leading-relaxed text-muted">
            Ferramentas de SEO técnico gratuitas, feitas para desenvolvedores:
            sem login, sem armazenar dados e com o código aberto no GitHub. O
            gerador de JSON-LD, o validador de meta tags e o checador de Core Web
            Vitals estão no ar.
          </p>
        </div>
        <Emblem id={TOOL_EMBLEMS.index} className="hidden w-24 shrink-0 md:block lg:w-28" />
      </div>

      <ul className="relative mt-12 grid gap-6 md:grid-cols-3">
        {ferramentas.map(({ mark, nome, descricao, href, emblem }) => (
          <li key={nome}>
            <Link
              href={href}
              title={nome}
              className="group flex h-full flex-col gap-4 border border-gray bg-surface p-7 transition-colors hover:border-primary"
            >
              <span className="flex items-start justify-between">
                <span aria-hidden="true" className={mark} />
                <Emblem id={emblem} className="h-12 w-12" />
              </span>
              <h2 className="pt-4 font-display text-2xl font-bold leading-tight text-foreground group-hover:text-primary">
                {nome}
              </h2>
              <p className="flex-1 text-[0.9375rem] leading-relaxed text-muted">{descricao}</p>
              <span className="border-t border-gray pt-4 font-mono text-xs uppercase tracking-[0.08em] text-accent">
                Usar a ferramenta <span aria-hidden="true">→</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
