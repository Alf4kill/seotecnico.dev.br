import Link from 'next/link'
import { getProjectEntries } from '@/lib/content'
import { MANIFESTO_REVISED } from '@/components/design/manifesto-copy'
import { buildMetadata } from '@/lib/metadata'
import { site } from '@/lib/site'
import { BreadcrumbJsonLd, WebPageJsonLd } from '@/components/seo/JsonLd'

// ─────────────────────────────────────────────────────────────────────────────
// /projeto — como este site é construído e mantido (CLAUDE.md §5.4).
//
// As entradas vêm de /content/projeto (lib/content.ts → getProjectEntries):
// publicar uma entrada nunca exige editar este arquivo. A única entrada escrita
// à mão é o colofão /design, que já documentava uma decisão do site antes de a
// seção existir e continua na URL dele.
//
// Fora do /blog, dos relacionados e do RSS de propósito: o cluster temático do
// blog fica limpo (§5.4). Par hreflang: /en/project (lib/hreflang.ts).
// ─────────────────────────────────────────────────────────────────────────────

const PATH = '/projeto'
const TITLE = 'Projeto: como este site de SEO técnico é feito'
const DESCRIPTION =
  'Como o SEO Técnico é construído e mantido: o uso de IA, o processo de cada página e as decisões de design, cada uma com o arquivo ou commit que a comprova.'

const repo = (file: string) => `${site.repository}/blob/main/${file}`

export const metadata = buildMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: PATH,
  ogImage: { path: `${PATH}/opengraph-image`, alt: TITLE },
})

// O colofão do design: entrada da seção em tudo menos no endereço.
const DESIGN_ENTRY = {
  href: '/design',
  title: 'Design do site: retrofuturismo suíço',
  summary:
    'Por que o site é escuro por padrão, tem tema claro, não tem canto arredondado e usa formas no lugar de ícones, com a paleta medida e as regras que o CI cobra.',
  date: MANIFESTO_REVISED,
}

const PAGES = [
  { href: '/sobre', label: 'Sobre', answers: 'quem mantém o site e o que ele é' },
  { href: '/laboratorio', label: 'Laboratório', answers: 'o que foi medido e o método de cada experimento' },
  { href: PATH, label: 'Projeto', answers: 'como o site é construído e mantido' },
]

const RECORDS = [
  { label: 'CLAUDE.md', file: 'CLAUDE.md', note: 'o contrato do projeto: objetivos, regras e escopo' },
  { label: 'Uso de IA', file: 'docs/ai-workflow.md', note: 'a fonte da entrada sobre IA, com cada número e o comando que o reproduz' },
  { label: 'Como uma página é feita', file: 'docs/content-pipeline.md', note: 'da nota de pesquisa ao merge' },
  { label: 'Registro de experimentos', file: 'docs/experiment-log.md', note: 'cada mudança deliberada, com hipótese e data' },
]

const LINK = 'text-primary underline underline-offset-[3px] hover:text-primary-hover'

export default function ProjetoPage() {
  const entries = getProjectEntries()
  const items = [
    ...entries.map(({ frontmatter }) => ({
      href: `${PATH}/${frontmatter.slug}`,
      title: frontmatter.title,
      summary: frontmatter.tldr ?? frontmatter.description,
      date: frontmatter.dateModified,
    })),
    DESIGN_ENTRY,
  ]
  const lastUpdate = items.map((item) => item.date).sort().at(-1) as string

  return (
    <>
      <WebPageJsonLd
        path={PATH}
        name={TITLE}
        description={DESCRIPTION}
        lang="pt-BR"
        dateModified={lastUpdate}
        imagePath={`${PATH}/opengraph-image`}
      />
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', path: '/' },
          { name: 'Projeto', path: PATH },
        ]}
      />

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="border-b border-gray py-12 lg:py-16">
        <div className="container-xl">
          <p className="eyebrow mb-5 flex items-center gap-3.5 text-primary">
            <span aria-hidden="true" className="h-[3px] w-10 bg-primary" />
            Projeto · como o site é feito
          </p>
          <h1 className="max-w-[56rem] font-display text-[clamp(2.25rem,1.4rem+3.2vw,4rem)] font-bold leading-[1.02] tracking-[-0.025em] text-foreground">
            Como este site é construído e mantido
          </h1>
          <p className="mt-6 max-w-[46rem] text-lg leading-relaxed text-muted">
            O blog explica técnicas de SEO técnico; esta seção explica o próprio site: as
            ferramentas, o processo e as decisões por trás de cada página. Cada entrada aponta o
            arquivo, o commit ou o pull request que comprova o que diz, e todo número sobre o
            histórico vem com o comando que o reproduz.
          </p>
        </div>
      </section>

      {/* ── Entradas ──────────────────────────────────────────── */}
      <section className="container-xl py-12" aria-labelledby="entries-title">
        <h2 id="entries-title" className="font-display text-2xl font-bold tracking-[-0.01em] text-foreground">
          As entradas
        </h2>
        <ol className="mt-6 border-b border-gray">
          {items.map(({ href, title, summary, date }, i) => (
            <li
              key={href}
              className="grid gap-x-6 gap-y-4 border-t border-gray py-9 md:grid-cols-[5rem_minmax(0,1fr)]"
            >
              <span className="font-display text-[0.9375rem] font-bold tracking-[0.1em] text-primary">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div className="flex min-w-0 flex-col gap-3">
                <h3 className="font-display text-[1.375rem] font-bold leading-tight tracking-[-0.015em] md:text-[1.75rem]">
                  <Link href={href} className="text-foreground transition-colors hover:text-primary">
                    {title}
                  </Link>
                </h3>
                <p className="max-w-[41rem] text-base leading-relaxed text-muted">{summary}</p>
                <p className="font-mono text-xs text-label">
                  atualizado <time dateTime={date}>{date}</time>
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* ── O que cada página responde ────────────────────────── */}
      <section className="container-xl py-12" aria-labelledby="pages-title">
        <h2 id="pages-title" className="font-display text-2xl font-bold tracking-[-0.01em] text-foreground">
          O que cada página sobre o site responde
        </h2>
        <ul className="rich-text mt-6 flex max-w-[68ch] flex-col gap-3">
          {PAGES.map(({ href, label, answers }) => (
            <li key={href}>
              {href === PATH ? (
                <strong className="text-foreground">{label}</strong>
              ) : (
                <Link href={href} className={LINK}>
                  {label}
                </Link>
              )}
              : {answers}.
            </li>
          ))}
        </ul>
        <p className="mt-6 max-w-[68ch] text-base leading-relaxed text-muted">
          Uma medição vira artigo no{' '}
          <Link href="/blog" className={LINK}>
            blog
          </Link>{' '}
          e entra no laboratório; o relato de como o site foi feito, ou de algo que deu errado nele,
          vem para cá.
        </p>
      </section>

      {/* ── Fonte, no repositório ─────────────────────────────── */}
      <section className="container-xl py-12" aria-labelledby="records-title">
        <h2 id="records-title" className="font-display text-2xl font-bold tracking-[-0.01em] text-foreground">
          A fonte, no repositório
        </h2>
        <ul className="rich-text mt-6 flex max-w-[68ch] flex-col gap-3">
          {RECORDS.map(({ label, file, note }) => (
            <li key={file}>
              <a href={repo(file)} target="_blank" rel="noopener noreferrer" className={LINK}>
                {label} <span aria-hidden="true">↗</span>
              </a>
              : {note}.
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}
