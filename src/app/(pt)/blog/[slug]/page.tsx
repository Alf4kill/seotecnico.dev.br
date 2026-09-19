import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { getAllPosts, getPostBySlug, getRelatedPosts } from '@/lib/content'
import { buildMetadata } from '@/lib/metadata'
import { mdxOptions } from '@/lib/mdx'
import { mdxComponents } from '@/components/mdx/mdx-components'
import { ArticleJsonLd, BreadcrumbJsonLd } from '@/components/seo/JsonLd'
import { FaqSection } from '@/components/sections/FaqSection'
import { ArticleLayout } from '@/components/article/ArticleLayout'
import { site } from '@/lib/site'

interface PageProps {
  params: Promise<{ slug: string }>
}

// Somente slugs existentes em /content/blog são gerados; o resto é 404.
export const dynamicParams = false

export function generateStaticParams() {
  return getAllPosts().map(({ frontmatter }) => ({ slug: frontmatter.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) return {}

  const { frontmatter } = post
  return buildMetadata({
    title: frontmatter.title,
    absoluteTitle: true,
    description: frontmatter.description,
    path: `/blog/${frontmatter.slug}`,
    article: {
      publishedTime: frontmatter.datePublished,
      modifiedTime: frontmatter.dateModified,
    },
    ogImage: {
      path: `/blog/${frontmatter.slug}/opengraph-image`,
      alt: frontmatter.title,
    },
  })
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) notFound()

  const { frontmatter, content } = post
  const path = `/blog/${frontmatter.slug}`

  return (
    <>
      <ArticleJsonLd
        frontmatter={frontmatter}
        imagePath={`/blog/${frontmatter.slug}/opengraph-image`}
      />
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', path: '/' },
          { name: 'Blog', path: '/blog' },
          { name: frontmatter.title, path: `/blog/${frontmatter.slug}` },
        ]}
      />

      <ArticleLayout
        post={post}
        lang="pt-BR"
        path={path}
        breadcrumbs={[
          { name: 'Início', href: '/' },
          { name: 'Blog', href: '/blog' },
        ]}
        related={getRelatedPosts(frontmatter.slug)}
        copyright={`© ${frontmatter.dateModified.slice(0, 4)} ${site.author.name}. Todos os direitos reservados. Citações curtas com atribuição e link para o artigo original são bem-vindas.`}
      >
        <MDXRemote source={content} components={mdxComponents} options={mdxOptions} />
      </ArticleLayout>

      {frontmatter.faq && frontmatter.faq.length > 0 && (
        <FaqSection items={frontmatter.faq} />
      )}
    </>
  )
}
