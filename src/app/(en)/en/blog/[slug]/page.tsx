import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { getAllEnglishPosts, getEnglishPostBySlug } from '@/lib/content'
import { buildMetadata } from '@/lib/metadata'
import { mdxOptions } from '@/lib/mdx'
import { mdxComponents } from '@/components/mdx/mdx-components'
import { ArticleJsonLd, BreadcrumbJsonLd } from '@/components/seo/JsonLd'
import { FaqSection } from '@/components/sections/FaqSection'
import { ArticleLayout } from '@/components/article/ArticleLayout'
import { site } from '@/lib/site'

// ─────────────────────────────────────────────────────────────────────────────
// Artigos em inglês, /en/blog/<slug>: traduções dos artigos de laboratório
// para portfólio e divulgação fora do Brasil (CLAUDE.md §1; ranquear em inglês
// não é meta). Mesmo formato do blog português — um MDX por artigo, o
// ArticleLayout — com o slug em inglês, porque a URL de uma página inglesa
// carrega a query inglesa. O par de hreflang de cada tradução fica em
// lib/hreflang.ts.
//
// Sem índice /en/blog por enquanto: com um ou dois artigos, a trilha vai de
// /en direto ao artigo, e um índice quase vazio não ajuda o leitor. O índice
// entra quando houver artigos suficientes para ele ter função.
// ─────────────────────────────────────────────────────────────────────────────

interface PageProps {
  params: Promise<{ slug: string }>
}

export const dynamicParams = false

export function generateStaticParams() {
  return getAllEnglishPosts().map(({ frontmatter }) => ({ slug: frontmatter.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const post = getEnglishPostBySlug(slug)
  if (!post) return {}

  const { frontmatter } = post
  const path = `/en/blog/${frontmatter.slug}`
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

export default async function EnglishBlogPostPage({ params }: PageProps) {
  const { slug } = await params
  const post = getEnglishPostBySlug(slug)
  if (!post) notFound()

  const { frontmatter, content } = post
  const path = `/en/blog/${frontmatter.slug}`

  return (
    <>
      <ArticleJsonLd frontmatter={frontmatter} path={path} imagePath={`${path}/opengraph-image`} />
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', path: '/en' },
          { name: frontmatter.title, path },
        ]}
      />

      <ArticleLayout
        post={post}
        lang="en"
        path={path}
        breadcrumbs={[{ name: 'Home', href: '/en' }]}
        copyright={`© ${frontmatter.dateModified.slice(0, 4)} ${site.author.name}. All rights reserved. Short quotes with attribution and a link to this page are welcome.`}
      >
        <MDXRemote source={content} components={mdxComponents} options={mdxOptions} />
      </ArticleLayout>

      {frontmatter.faq && frontmatter.faq.length > 0 && (
        <FaqSection items={frontmatter.faq} titulo="Frequently asked questions" lang="en" />
      )}
    </>
  )
}
