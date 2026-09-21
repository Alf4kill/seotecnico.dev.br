import Link from 'next/link'
import type { Post } from '@/lib/content'
import { CategoryChip, StatusLabel } from '@/components/ui/CategoryMark'

// ─────────────────────────────────────────────────────────────────────────────
// Linha do índice cronológico: número grande à esquerda (hierarquia por
// escala, escola suíça), título e resumo no meio, eixo e estado à direita.
//
// `data-category` é o gancho do filtro sem JavaScript da /blog (globals.css →
// .category-filter). A linha é `grid` porque é esse o display que o filtro
// devolve quando a categoria dela está selecionada.
// ─────────────────────────────────────────────────────────────────────────────

export function PostRow({
  post,
  index,
  headingLevel = 'h3',
}: {
  post: Post
  index: number
  headingLevel?: 'h2' | 'h3'
}) {
  const { frontmatter, derived } = post
  const Heading = headingLevel
  return (
    <li
      data-category={frontmatter.category}
      className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-x-4 gap-y-3 border-t border-gray py-7 md:grid-cols-[5rem_minmax(0,1fr)_12.5rem] md:gap-x-6"
    >
      <span className="pt-1 font-display text-[0.9375rem] font-bold tracking-[0.1em] text-primary">
        {String(index).padStart(2, '0')}
      </span>
      <div className="flex flex-col gap-3">
        <Heading className="font-display text-[1.375rem] font-bold leading-tight tracking-[-0.015em] md:text-[1.75rem]">
          <Link href={`/blog/${frontmatter.slug}`} className="text-foreground transition-colors hover:text-primary">
            {frontmatter.title}
          </Link>
        </Heading>
        <p className="max-w-[41rem] text-base leading-relaxed text-muted">{frontmatter.description}</p>
        <p className="font-mono text-xs text-label">
          <time dateTime={frontmatter.datePublished}>{frontmatter.datePublished}</time> · {derived.readingTime} min
        </p>
      </div>
      <div className="col-start-2 flex flex-wrap items-center gap-3 md:col-start-3 md:flex-col md:items-start">
        {frontmatter.category && <CategoryChip category={frontmatter.category} />}
        {frontmatter.status && <StatusLabel status={frontmatter.status} />}
      </div>
    </li>
  )
}
