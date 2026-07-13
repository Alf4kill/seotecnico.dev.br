import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { MDXRemote } from 'next-mdx-remote/rsc'
import remarkGfm from 'remark-gfm'
import { getAllPosts, getPostBySlug } from '@/lib/content'
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
  return {
    title: { absolute: frontmatter.title },
    description: frontmatter.description,
    alternates: { canonical: `/blog/${frontmatter.slug}` },
    openGraph: {
      type: 'article',
      publishedTime: frontmatter.datePublished,
      modifiedTime: frontmatter.dateModified,
    },
  }
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
          <MDXRemote
            source={content}
            options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }}
          />
        </div>

        <footer className="mt-10 border-t border-gray pt-4">
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
