import Link from 'next/link'
import { getAllPosts } from '@/lib/content'
import { isExperiment } from '@/lib/categories'
import { buildMetadata } from '@/lib/metadata'
import { site } from '@/lib/site'
import { BreadcrumbJsonLd, WebPageJsonLd } from '@/components/seo/JsonLd'
import { CategoryChip, StatusLabel } from '@/components/ui/CategoryMark'

// ─────────────────────────────────────────────────────────────────────────────
// /laboratorio — os experimentos deste site num lugar só.
//
// Os experimentos continuam em /blog/<slug>: nenhuma URL publicada muda
// (CLAUDE.md §5.2), e uma seção própria com três ou quatro artigos seria a
// página fina que o §1 nomeia. Esta página é o índice que dá a eles função de
// laboratório: o método, o estado de cada um e os artigos que usam os dados.
//
// Tudo aqui é derivado de /content no build:
// - experimento = post com estado de medição (lib/categories.ts → isExperiment);
// - "artigos que usam estes dados" = posts cujo `basedOn` cita o experimento.
// Publicar um experimento ou um artigo derivado nunca exige editar este arquivo.
//
// Sem par hreflang: /en/case-studies tem outra função (portfólio, e inclui
// trabalho que não é experimento, como a correção de LCP e o gate de CI). O
// link para lá vai no fim da página, marcado como inglês.
// ─────────────────────────────────────────────────────────────────────────────

const PATH = '/laboratorio'
const TITLE = 'Laboratório: experimentos de SEO técnico'
const DESCRIPTION =
  'Os experimentos deste site, com hipótese registrada antes do dado e registro público, e os artigos que usam os resultados de cada um.'

const repo = (file: string) => `${site.repository}/blob/main/${file}`

export const metadata = buildMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: PATH,
  ogImage: { path: `${PATH}/opengraph-image`, alt: TITLE },
})

const METHOD = [
  {
    title: 'Hipótese antes do dado',
    body: 'Cada experimento entra no registro com a previsão e a janela de medição antes de existir qualquer resultado.',
  },
  {
    title: 'Poder antes do registro',
    body: 'Cada hipótese declara o menor efeito que a janela consegue detectar com o tráfego que o site tem. Quando o tráfego humano não basta, a unidade passa a ser requisição de agente, rodada de laboratório ou base pública.',
  },
  {
    title: 'Identidade pela URL, não pelo user agent',
    body: 'Nos testes com assistentes de IA, cada assistente recebe a própria URL secreta. Quem pediu cada página fica identificado pelo endereço, não pelo que a requisição declara.',
  },
  {
    title: 'Resultado nulo também sai',
    body: 'Hipóteses falsificadas, instrumentos com defeito e erros de leitura são publicados com o mesmo destaque do que deu certo.',
  },
]

const RECORDS = [
  { label: 'Registro de experimentos', file: 'docs/experiment-log.md', note: 'hipóteses, previsões e vereditos, em ordem de data' },
  { label: 'Rodadas com assistentes de IA', file: 'docs/lab-control-rounds.md', note: 'protocolo, respostas na íntegra e cada desvio' },
  { label: 'Desenho do experimento de detecção', file: 'docs/detection-experiment.md', note: 'instrumento, armadilhas e critérios' },
]

const LINK = 'text-primary underline underline-offset-[3px] hover:text-primary-hover'

export default function LaboratorioPage() {
  const posts = getAllPosts()
  const experiments = posts.filter((p) => isExperiment(p.frontmatter.status))
  const derivedFrom = (slug: string) => posts.filter((p) => p.frontmatter.basedOn?.includes(slug))
  // A página muda quando um experimento ou um artigo que usa os dados dele muda.
  const lastUpdate = experiments
    .flatMap((e) => [e, ...derivedFrom(e.frontmatter.slug)])
    .map((p) => p.frontmatter.dateModified)
    .sort()
    .at(-1) as string

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
          { name: 'Laboratório', path: PATH },
        ]}
      />

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="border-b border-gray py-12 lg:py-16">
        <div className="container-xl">
          <p className="eyebrow mb-5 flex items-center gap-3.5 text-primary">
            <span aria-hidden="true" className="h-[3px] w-10 bg-primary" />
            Laboratório · método público
          </p>
          <h1 className="max-w-[56rem] font-display text-[clamp(2.25rem,1.4rem+3.2vw,4rem)] font-bold leading-[1.02] tracking-[-0.025em] text-foreground">
            Experimentos de SEO técnico, com o registro aberto
          </h1>
          <p className="mt-6 max-w-[46rem] text-lg leading-relaxed text-muted">
            Este site é o próprio objeto de teste. Aqui estão os {experiments.length} experimentos
            publicados até agora, o estado de cada um e os artigos que usam os resultados. O
            protocolo, as respostas na íntegra e cada desvio ficam no repositório, onde qualquer
            número pode ser conferido.
          </p>
        </div>
      </section>

      {/* ── Método ────────────────────────────────────────────── */}
      <section className="container-xl py-12" aria-labelledby="method-title">
        <h2 id="method-title" className="font-display text-2xl font-bold tracking-[-0.01em] text-foreground">
          Como cada experimento é feito
        </h2>
        <ol className="mt-8 grid gap-6 md:grid-cols-2">
          {METHOD.map(({ title, body }, i) => (
            <li key={title} className="flex flex-col gap-2.5 border-t border-gray pt-5">
              <span className="font-display text-[0.9375rem] font-bold tracking-[0.1em] text-primary">
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3 className="font-display text-xl font-bold leading-tight text-foreground">{title}</h3>
              <p className="max-w-[38rem] text-base leading-relaxed text-muted">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ── Experimentos ──────────────────────────────────────── */}
      <section className="container-xl py-12" aria-labelledby="experiments-title">
        <h2 id="experiments-title" className="font-display text-2xl font-bold tracking-[-0.01em] text-foreground">
          Os experimentos
        </h2>
        <ol className="mt-6 border-b border-gray">
          {experiments.map(({ frontmatter }, i) => {
            const derived = derivedFrom(frontmatter.slug)
            return (
              <li
                key={frontmatter.slug}
                className="grid gap-x-6 gap-y-4 border-t border-gray py-9 md:grid-cols-[5rem_minmax(0,1fr)_12.5rem]"
              >
                <span className="font-display text-[0.9375rem] font-bold tracking-[0.1em] text-primary">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="flex min-w-0 flex-col gap-3">
                  <h3 className="font-display text-[1.375rem] font-bold leading-tight tracking-[-0.015em] md:text-[1.75rem]">
                    <Link href={`/blog/${frontmatter.slug}`} className="text-foreground transition-colors hover:text-primary">
                      {frontmatter.title}
                    </Link>
                  </h3>
                  <p className="max-w-[41rem] text-base leading-relaxed text-muted">
                    {frontmatter.tldr ?? frontmatter.description}
                  </p>
                  <p className="font-mono text-xs text-label">
                    publicado <time dateTime={frontmatter.datePublished}>{frontmatter.datePublished}</time>
                    {frontmatter.dateModified !== frontmatter.datePublished && (
                      <>
                        {' '}· atualizado <time dateTime={frontmatter.dateModified}>{frontmatter.dateModified}</time>
                      </>
                    )}
                  </p>
                  {derived.length > 0 && (
                    <div className="mt-2 flex flex-col gap-2 border-t border-gray pt-4">
                      <p className="eyebrow text-[0.625rem]">Artigos que usam estes dados</p>
                      <ul className="flex flex-col gap-1.5">
                        {derived.map((d) => (
                          <li key={d.frontmatter.slug}>
                            <Link href={`/blog/${d.frontmatter.slug}`} className={`text-[0.9375rem] ${LINK}`}>
                              {d.frontmatter.title}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3 md:flex-col md:items-start">
                  {frontmatter.category && <CategoryChip category={frontmatter.category} />}
                  {frontmatter.status && <StatusLabel status={frontmatter.status} />}
                </div>
              </li>
            )
          })}
        </ol>
      </section>

      {/* ── Registro público ──────────────────────────────────── */}
      <section className="container-xl py-12" aria-labelledby="records-title">
        <h2 id="records-title" className="font-display text-2xl font-bold tracking-[-0.01em] text-foreground">
          O registro, no repositório
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
        <p className="mt-8 max-w-[68ch] text-base leading-relaxed text-muted">
          Os demais artigos do{' '}
          <Link href="/blog" className={LINK}>
            blog
          </Link>{' '}
          são guias: explicam uma técnica com o código que roda neste site. Os que usam números
          de um experimento trazem no topo a caixa &ldquo;Dados do laboratório&rdquo;, com o link
          para ele. Em inglês, os mesmos resultados aparecem resumidos nos{' '}
          <Link href="/en/case-studies" hrefLang="en" prefetch={false} className={LINK}>
            case studies
          </Link>
          .
        </p>
      </section>
    </>
  )
}
