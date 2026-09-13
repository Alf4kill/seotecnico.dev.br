import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { getAllPosts } from '@/lib/content'
import { buildMetadata } from '@/lib/metadata'
import { BreadcrumbJsonLd } from '@/components/seo/JsonLd'

export const metadata = buildMetadata({
  title: 'Blog de SEO técnico para Next.js',
  description:
    'Artigos práticos de SEO técnico para desenvolvedores Next.js: Metadata API, JSON-LD, sitemaps, Core Web Vitals e experimentos medidos.',
  path: '/blog',
})

export default function BlogPage() {
  const posts = getAllPosts()

  return (
    <section className="container py-12 lg:py-16">
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', path: '/' },
          { name: 'Blog', path: '/blog' },
        ]}
      />

      <h1 className="font-bold text-foreground text-3xl md:text-4xl">
        Blog de SEO técnico
      </h1>
      <p className="mt-4 max-w-2xl text-muted text-base leading-7">
        Artigos práticos de SEO técnico para Next.js — cada um responde uma
        pergunta específica, com código real e medições feitas neste site.
      </p>

      {posts.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-gray bg-surface p-8">
          <p className="text-foreground font-semibold">
            Os primeiros artigos estão em produção.
          </p>
          <p className="mt-2 text-sm text-muted leading-6">
            Enquanto isso, o mapa completo do conteúdo já está publicado no{' '}
            <Link
              href="/guia/seo-tecnico-nextjs"
              title="Guia de SEO técnico para Next.js"
              className="font-semibold text-primary hover:text-primary-dark transition-colors"
            >
              guia de SEO técnico para Next.js
            </Link>
            .
          </p>
        </div>
      ) : (
        <ul className="mt-10 grid gap-6 md:grid-cols-2">
          {posts.map(({ frontmatter }) => (
            <li key={frontmatter.slug}>
              <article className="flex h-full flex-col rounded-2xl border border-gray bg-surface p-6 transition-shadow hover:shadow-md">
                <h2 className="font-bold text-foreground text-lg">
                  <Link
                    href={`/blog/${frontmatter.slug}`}
                    title={frontmatter.title}
                    className="hover:text-primary transition-colors"
                  >
                    {frontmatter.title}
                  </Link>
                </h2>
                <p className="mt-2 flex-1 text-sm leading-6 text-muted">
                  {frontmatter.description}
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <time
                    dateTime={frontmatter.datePublished}
                    className="text-xs text-muted"
                  >
                    {new Date(`${frontmatter.datePublished}T00:00:00`).toLocaleDateString('pt-BR')}
                  </time>
                  <Link
                    href={`/blog/${frontmatter.slug}`}
                    title={frontmatter.title}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-dark transition-colors"
                  >
                    Ler artigo
                    <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
                  </Link>
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
