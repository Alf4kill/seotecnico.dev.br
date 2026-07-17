import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { getAllPosts, getPostBySlug } from '@/lib/content'
import { buildMetadata } from '@/lib/metadata'
import { mdxOptions } from '@/lib/mdx'
import { mdxComponents } from '@/components/mdx/mdx-components'
import { ArticleJsonLd, BreadcrumbJsonLd } from '@/components/seo/JsonLd'
import { FaqSection } from '@/components/sections/FaqSection'
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
    fileOgImage: true,
  })
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) notFound()

  const { frontmatter, content } = post

  return (
    <>
      <ArticleJsonLd frontmatter={frontmatter} />
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', path: '/' },
          { name: 'Blog', path: '/blog' },
          { name: frontmatter.title, path: `/blog/${frontmatter.slug}` },
        ]}
      />

      <article className="container max-w-3xl py-12 lg:py-16">
        <header>
          <h1 className="font-bold text-foreground text-3xl leading-tight md:text-4xl">
            {frontmatter.title}
          </h1>
          <p className="mt-3 text-sm text-muted">
            Publicado em{' '}
            <time dateTime={frontmatter.datePublished}>
              {new Date(`${frontmatter.datePublished}T00:00:00`).toLocaleDateString('pt-BR')}
            </time>
            {frontmatter.dateModified !== frontmatter.datePublished && (
              <>
                {' · '}atualizado em{' '}
                <time dateTime={frontmatter.dateModified}>
                  {new Date(`${frontmatter.dateModified}T00:00:00`).toLocaleDateString('pt-BR')}
                </time>
              </>
            )}
          </p>
        </header>

        <div className="rich-text mt-8">
          <MDXRemote source={content} components={mdxComponents} options={mdxOptions} />
        </div>

        {/* id estável: alvo do trigger de element visibility do evento
            `article_read` no GTM (docs/measurement-plan.md). */}
        <footer id="article-end" className="mt-10 border-t border-gray pt-4">
          <p className="text-xs text-muted">
            © {frontmatter.dateModified.slice(0, 4)} {site.author.name}. Todos
            os direitos reservados. Citações curtas com atribuição e link para
            o artigo original são bem-vindas.
          </p>
        </footer>
      </article>

      {frontmatter.faq && frontmatter.faq.length > 0 && (
        <FaqSection items={frontmatter.faq} />
      )}
    </>
  )
}
