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
// Entradas inglesas do projeto, /en/project/<slug>: tradução de cada entrada de
// /projeto, com o slug em inglês e o par em lib/hreflang.ts. Mesmo formato da
// versão portuguesa (ArticleLayout sem eixo e sem relacionados).
// ─────────────────────────────────────────────────────────────────────────────

interface PageProps {
  params: Promise<{ slug: string }>
}

export const dynamicParams = false

export function generateStaticParams() {
  return getProjectEntries('en').map(({ frontmatter }) => ({ slug: frontmatter.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const entry = getProjectEntry(slug, 'en')
  if (!entry) return {}

  const { frontmatter } = entry
  const path = `/en/project/${frontmatter.slug}`
  return buildMetadata({
    title: frontmatter.title,
    absoluteTitle: true,
    description: frontmatter.description,
    path,
    lang: 'en',
    article: {
      publishedTime: frontmatter.datePublished,
      modifiedTime: frontmatter.dateModified,
    },
    ogImage: { path: `${path}/opengraph-image`, alt: frontmatter.title },
  })
}

export default async function EnglishProjectEntryPage({ params }: PageProps) {
  const { slug } = await params
  const entry = getProjectEntry(slug, 'en')
  if (!entry) notFound()

  const { frontmatter, content } = entry
  const path = `/en/project/${frontmatter.slug}`

  return (
    <>
      <ArticleJsonLd frontmatter={frontmatter} path={path} imagePath={`${path}/opengraph-image`} />
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', path: '/en' },
          { name: 'Project', path: '/en/project' },
          { name: frontmatter.title, path },
        ]}
      />

      <ArticleLayout
        post={entry}
        lang="en"
        path={path}
        breadcrumbs={[
          { name: 'Home', href: '/en' },
          { name: 'Project', href: '/en/project' },
        ]}
        copyright={`© ${frontmatter.dateModified.slice(0, 4)} ${site.author.name}. All rights reserved. Short quotes with attribution and a link to this page are welcome.`}
      >
        <MDXRemote source={content} components={mdxComponents} options={mdxOptions} />
      </ArticleLayout>
    </>
  )
}
