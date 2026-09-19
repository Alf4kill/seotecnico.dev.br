import Link from 'next/link'
import type { ReactNode } from 'react'
import type { Post } from '@/lib/content'
import { getCategory } from '@/lib/categories'
import type { Lang } from '@/lib/hreflang'
import { absoluteUrl } from '@/lib/metadata'
import { site } from '@/lib/site'
import { CategoryChip, CategoryMark, StatusLabel } from '@/components/ui/CategoryMark'
import { InstrumentFrame } from '@/components/ui/InstrumentFrame'
import { CodeCopy } from '@/components/article/CodeCopy'
import { CopyLinkButton } from '@/components/article/CopyLinkButton'

// ─────────────────────────────────────────────────────────────────────────────
// Layout de leitura — artigos do blog e as duas versões da pilar.
//
// Grade de 12 colunas (docs/design-system.md → Artigo · leitura):
//   3 · índice do artigo (h2 extraídos no build, sticky no desktop)
//   7 · corpo, com a medida presa em ~68 caracteres
//   2 · margem: compartilhar, ferramenta citada, datas
// No celular vira uma coluna, na ordem índice → corpo → margem.
//
// O `<footer id="article-end">` é contrato com o GTM: é o alvo de element
// visibility do evento `article_read` (docs/measurement-plan.md). Não renomear.
// ─────────────────────────────────────────────────────────────────────────────

const COPY = {
  'pt-BR': {
    breadcrumb: 'Trilha de navegação',
    toc: 'Neste artigo',
    published: 'Publicado',
    updated: 'Atualizado',
    minutes: 'min',
    tldr: 'Resposta curta',
    status: 'Estado',
    statusNote: 'Este artigo volta com dado novo a cada coleta.',
    share: 'Compartilhar',
    tool: 'Ferramenta citada',
    history: 'Histórico',
    related: 'Continue pelo mesmo eixo',
    authorBio:
      'Publica aqui os testes que roda no próprio site, com o código aberto e a medição junto.',
    about: '/sobre',
  },
  en: {
    breadcrumb: 'Breadcrumb',
    toc: 'In this article',
    published: 'Published',
    updated: 'Updated',
    minutes: 'min',
    tldr: 'Short answer',
    status: 'Status',
    statusNote: 'This article returns with new data after each collection.',
    share: 'Share',
    tool: 'Tool used',
    history: 'History',
    related: 'Continue on the same axis',
    authorBio:
      'Publishes here the tests run on this very site, with the code open and the measurement alongside.',
    about: '/en/about',
  },
} as const

/** Iniciais do autor para o monograma quadrado ("Henrique Lopes Souza" → HL). */
function monogram(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

export interface ArticleLayoutProps {
  post: Post
  lang: Lang
  /** Caminho canônico — alvo do "Copiar link". */
  path: string
  /** Trilha visível, a mesma do BreadcrumbList (sem o item atual). */
  breadcrumbs: { name: string; href: string }[]
  /** Linha de copyright do rodapé do artigo (§14). */
  copyright: string
  /** Acima do título — ex.: seletor de idioma da pilar. */
  beforeTitle?: ReactNode
  /** "Continue pelo mesmo eixo". Vazio na pilar. */
  related?: Post[]
  /** Corpo MDX já renderizado. */
  children: ReactNode
}

export function ArticleLayout({
  post,
  lang,
  path,
  breadcrumbs,
  copyright,
  beforeTitle,
  related = [],
  children,
}: ArticleLayoutProps) {
  const { frontmatter, derived } = post
  const copy = COPY[lang]
  const category = frontmatter.category ? getCategory(frontmatter.category) : undefined
  const updated = frontmatter.dateModified !== frontmatter.datePublished

  return (
    <>
      <div className="reading-progress" aria-hidden="true" />
      <CodeCopy lang={lang} />

      <article>
        {/* ── Cabeçalho ─────────────────────────────────────────── */}
        <header className="border-b border-gray py-10 lg:py-14">
          <div className="container-xl grid gap-8 lg:grid-cols-12 lg:gap-6">
            <div className="flex flex-col gap-5 lg:col-span-9">
              <nav aria-label={copy.breadcrumb}>
                <ol className="eyebrow flex flex-wrap items-center gap-x-3 gap-y-1">
                  {breadcrumbs.map(({ name, href }) => (
                    <li key={href} className="flex items-center gap-3">
                      <Link href={href} className="text-label transition-colors hover:text-primary">
                        {name}
                      </Link>
                      <span aria-hidden="true">/</span>
                    </li>
                  ))}
                  {category && <li className="text-primary">{category.label[lang]}</li>}
                </ol>
              </nav>
              {beforeTitle}
              <h1 className="font-display text-[clamp(2.25rem,1.35rem+3.6vw,4.25rem)] font-bold leading-[1.02] tracking-[-0.025em] text-foreground">
                {frontmatter.title}
              </h1>
              <p className="max-w-[48rem] text-lg leading-relaxed text-muted lg:text-[1.3125rem]">
                {frontmatter.description}
              </p>
            </div>

            {frontmatter.status && (
              <div className="flex flex-col justify-end lg:col-span-3">
                <InstrumentFrame label={copy.status} tone="accent" corners="two" className="!bg-transparent p-4.5">
                  <p className="font-display text-xl font-medium text-foreground">
                    <StatusLabel status={frontmatter.status} lang={lang} />
                  </p>
                  <p className="pt-1.5 text-[0.8125rem] leading-normal text-muted">{copy.statusNote}</p>
                </InstrumentFrame>
              </div>
            )}
          </div>

          {/* Faixa de metadados: autor, datas, tempo, eixo. */}
          <div className="container-xl mt-8 flex flex-wrap items-center gap-x-7 gap-y-3 border-t border-gray pt-5 font-mono text-xs uppercase tracking-[0.06em] text-label">
            <span className="flex items-center gap-3 normal-case tracking-normal">
              <span
                aria-hidden="true"
                className="flex h-8.5 w-8.5 items-center justify-center bg-primary font-display text-sm font-bold text-on-primary"
              >
                {monogram(site.author.name)}
              </span>
              <Link href={copy.about} rel="author" className="text-[0.8125rem] text-foreground hover:text-primary">
                {site.author.name}
              </Link>
            </span>
            <span>
              {copy.published} <time dateTime={frontmatter.datePublished}>{frontmatter.datePublished}</time>
            </span>
            {updated && (
              <span>
                {copy.updated} <time dateTime={frontmatter.dateModified}>{frontmatter.dateModified}</time>
              </span>
            )}
            <span>
              {derived.readingTime} {copy.minutes}
            </span>
            {category && frontmatter.category && (
              <span className="flex items-center gap-2 text-primary">
                <CategoryMark category={frontmatter.category} />
                {category.label[lang]}
              </span>
            )}
          </div>

          {frontmatter.tldr && (
            <div className="container-xl mt-8">
              <InstrumentFrame label={copy.tldr} className="lg:w-9/12">
                <p className="text-base leading-7 text-foreground lg:text-[1.0625rem]">{frontmatter.tldr}</p>
              </InstrumentFrame>
            </div>
          )}
        </header>

        {/* ── Corpo ─────────────────────────────────────────────── */}
        <div className="container-xl grid gap-10 py-12 lg:grid-cols-12 lg:gap-6 lg:py-14">
          {derived.headings.length > 0 && (
            <aside className="lg:col-span-3">
              <nav
                aria-labelledby="toc-title"
                className="flex flex-col gap-4 border-t-2 border-primary pt-4 lg:sticky lg:top-26 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto"
              >
                <p id="toc-title" className="eyebrow text-[0.625rem]">{copy.toc}</p>
                <ol className="flex flex-col gap-3">
                  {derived.headings.map(({ id, text }, i) => (
                    <li key={id}>
                      <a
                        href={`#${id}`}
                        className="flex gap-3 text-sm leading-snug text-muted transition-colors hover:text-foreground"
                      >
                        <span className="font-mono text-label">{String(i + 1).padStart(2, '0')}</span>
                        {text}
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>
            </aside>
          )}

          <div className="min-w-0 lg:col-span-7">
            <div className="rich-text max-w-[68ch]">{children}</div>

            {/* Assinatura (E-E-A-T): a contraparte legível do Person do schema. */}
            <div className="mt-12 grid max-w-[68ch] grid-cols-[4rem_minmax(0,1fr)] gap-5 border border-gray bg-surface p-6">
              <span
                aria-hidden="true"
                className="flex h-16 w-16 items-center justify-center bg-primary font-display text-[1.375rem] font-bold text-on-primary"
              >
                {monogram(site.author.name)}
              </span>
              <div className="flex flex-col gap-2">
                <Link href={copy.about} rel="author" className="font-display text-lg font-bold text-foreground hover:text-primary">
                  {site.author.name}
                </Link>
                <p className="text-[0.9375rem] leading-relaxed text-muted">
                  {site.author.jobTitle}. {copy.authorBio}
                </p>
                <p className="flex gap-5 pt-1 font-mono text-xs">
                  {site.author.github && (
                    <a href={site.author.github} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary-hover">
                      GitHub
                    </a>
                  )}
                  {site.author.linkedin && (
                    <a href={site.author.linkedin} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary-hover">
                      LinkedIn
                    </a>
                  )}
                </p>
              </div>
            </div>

            {/* id estável: alvo do trigger de element visibility do evento
                `article_read` no GTM (docs/measurement-plan.md). */}
            <footer id="article-end" className="mt-8 max-w-[68ch] border-t border-gray pt-4">
              <p className="font-mono text-xs leading-6 text-label">{copyright}</p>
            </footer>
          </div>

          {/* ── Margem ──────────────────────────────────────────── */}
          <aside className="flex flex-col gap-6 border-t border-gray pt-4 lg:col-span-2">
            <div className="flex flex-col gap-2">
              <p className="eyebrow text-[0.625rem]">{copy.share}</p>
              <CopyLinkButton url={absoluteUrl(path)} lang={lang} />
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(absoluteUrl(path))}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs text-primary hover:text-primary-hover"
              >
                LinkedIn
              </a>
            </div>
            {derived.citedTool && (
              <div className="flex flex-col gap-2 border-t border-gray pt-4">
                <p className="eyebrow text-[0.625rem]">{copy.tool}</p>
                <Link href={derived.citedTool.href} className="text-sm leading-normal text-foreground hover:text-primary">
                  {derived.citedTool.title} <span aria-hidden="true">→</span>
                </Link>
              </div>
            )}
            <div className="flex flex-col gap-2 border-t border-gray pt-4">
              <p className="eyebrow text-[0.625rem]">{copy.history}</p>
              <p className="font-mono text-xs leading-7 text-muted">
                {updated && (
                  <>
                    {copy.updated.toLowerCase()} · {frontmatter.dateModified}
                    <br />
                  </>
                )}
                {copy.published.toLowerCase()} · {frontmatter.datePublished}
              </p>
            </div>
          </aside>
        </div>
      </article>

      {/* ── Relacionados ──────────────────────────────────────── */}
      {related.length > 0 && (
        <section aria-labelledby="related-title" className="container-xl border-t-[3px] border-primary pt-8">
          <h2 id="related-title" className="pb-6 font-display text-2xl font-bold tracking-[-0.015em] text-foreground">
            {copy.related}
          </h2>
          <ul className="grid gap-6 md:grid-cols-3">
            {related.map(({ frontmatter: fm, derived: d }) => (
              <li key={fm.slug}>
                <Link
                  href={`/blog/${fm.slug}`}
                  className="flex h-full flex-col gap-3.5 border border-gray bg-surface p-6 transition-colors hover:border-primary"
                >
                  {fm.category && <CategoryChip category={fm.category} lang={lang} className="self-start" />}
                  <span className="font-display text-xl font-bold leading-tight text-foreground">{fm.title}</span>
                  <span className="mt-auto font-mono text-xs text-label">
                    {fm.datePublished} · {d.readingTime} {copy.minutes}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  )
}
