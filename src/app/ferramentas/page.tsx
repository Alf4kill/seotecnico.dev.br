import { Braces, FileSearch, Gauge } from 'lucide-react'
import { buildMetadata } from '@/lib/metadata'

export const metadata = buildMetadata({
  title: 'Ferramentas gratuitas de SEO técnico',
  description:
    'Ferramentas gratuitas de SEO para desenvolvedores: gerador de JSON-LD, validador de meta tags e checador de Core Web Vitals. Sem login.',
  path: '/ferramentas',
})

const ferramentas = [
  {
    icon: Braces,
    nome: 'Gerador de JSON-LD',
    descricao:
      'Monte dados estruturados schema.org válidos (Article, FAQ, Organization e mais) a partir de um formulário simples.',
  },
  {
    icon: FileSearch,
    nome: 'Validador de meta tags',
    descricao:
      'Cole uma URL e veja title, description, canonical e Open Graph como o Google enxerga — com alertas de problemas.',
  },
  {
    icon: Gauge,
    nome: 'Checador de Core Web Vitals',
    descricao:
      'Consulte LCP, CLS e INP reais de qualquer domínio usando os dados públicos do Chrome UX Report (CrUX).',
  },
]

export default function FerramentasPage() {
  return (
    <section className="container py-12 lg:py-16">
      <h1 className="font-bold text-foreground text-3xl md:text-4xl">
        Ferramentas gratuitas de SEO técnico
      </h1>
      <p className="mt-4 max-w-2xl text-muted text-base leading-7">
        Ferramentas de SEO técnico gratuitas, feitas para desenvolvedores:
        sem login, sem armazenar dados e com o código aberto no GitHub. As
        três primeiras estão em desenvolvimento e serão lançadas em breve.
      </p>

      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {ferramentas.map(({ icon: Icon, nome, descricao }) => (
          <article
            key={nome}
            className="flex flex-col rounded-2xl border border-gray bg-white p-6"
          >
            <div className="flex items-start justify-between">
              <Icon className="h-8 w-8 text-primary" strokeWidth={1.75} aria-hidden="true" />
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                Em breve
              </span>
            </div>
            <h2 className="mt-4 font-bold text-foreground text-lg">{nome}</h2>
            <p className="mt-2 text-sm leading-6 text-muted">{descricao}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
