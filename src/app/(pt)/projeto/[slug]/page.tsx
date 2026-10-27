import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { getProjectEntries, getProjectEntry } from '@/lib/content'
import { buildMetadata } from '@/lib/metadata'
import { mdxOptions } from '@/lib/mdx'
import { mdxComponents } from '@/components/mdx/mdx-components'
import { ArticleJsonLd, BreadcrumbJsonLd } from '@/components/seo/JsonLd'
import { ArticleLayout } from '@/components/article/ArticleLayout'
import { site } from '@/lib/site'

// ─────────────────────────────────────────────────────────────────────────────
// Entradas do projeto, /projeto/<slug> (CLAUDE.md §5.4). O mesmo ArticleLayout
// do blog, sem eixo (o cabeçalho leva a marca central) e sem relacionados: a
// seção fica fora do cluster do blog. A trilha passa pelo índice /projeto.
// ─────────────────────────────────────────────────────────────────────────────

interface PageProps {
  params: Promise<{ slug: string }>
}

export const dynamicParams = false

export function generateStaticParams() {
  return getProjectEntries().map(({ frontmatter }) => ({ slug: frontmatter.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const entry = getProjectEntry(slug)
  if (!entry) return {}

  const { frontmatter } = entry
  const path = `/projeto/${frontmatter.slug}`
  return buildMetadata({
    title: frontmatter.title,
    absoluteTitle: true,
    description: frontmatter.description,
    path,
    article: {
      publishedTime: frontmatter.datePublished,
      modifiedTime: frontmatter.dateModified,
    },
    ogImage: { path: `${path}/opengraph-image`, alt: frontmatter.title },
  })
}

export default async function ProjectEntryPage({ params }: PageProps) {
  const { slug } = await params
  const entry = getProjectEntry(slug)
  if (!entry) notFound()

  const { frontmatter, content } = entry
  const path = `/projeto/${frontmatter.slug}`

  return (
    <>
      <ArticleJsonLd frontmatter={frontmatter} path={path} imagePath={`${path}/opengraph-image`} />
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', path: '/' },
          { name: 'Projeto', path: '/projeto' },
          { name: frontmatter.title, path },
        ]}
      />

      <ArticleLayout
        post={entry}
        lang="pt-BR"
        path={path}
        breadcrumbs={[
          { name: 'Início', href: '/' },
          { name: 'Projeto', href: '/projeto' },
        ]}
        copyright={`© ${frontmatter.dateModified.slice(0, 4)} ${site.author.name}. Todos os direitos reservados. Citações curtas com atribuição e link para a página original são bem-vindas.`}
      >
        <MDXRemote source={content} components={mdxComponents} options={mdxOptions} />
      </ArticleLayout>
    </>
  )
}
