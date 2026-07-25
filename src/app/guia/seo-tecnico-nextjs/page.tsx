import type { Metadata } from 'next'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { getGuide } from '@/lib/content'
import { mdxOptions } from '@/lib/mdx'
import { mdxComponents } from '@/components/mdx/mdx-components'
import { ArticleJsonLd, BreadcrumbJsonLd } from '@/components/seo/JsonLd'
import { FaqSection } from '@/components/sections/FaqSection'
import { AuthorByline } from '@/components/ui/AuthorByline'
import { buildMetadata } from '@/lib/metadata'
import { site } from '@/lib/site'

const CANONICAL_PATH = '/guia/seo-tecnico-nextjs'

export function generateMetadata(): Metadata {
  const { frontmatter } = getGuide()
  return buildMetadata({
    title: frontmatter.title,
    absoluteTitle: true,
    description: frontmatter.description,
    path: CANONICAL_PATH,
    article: {
      publishedTime: frontmatter.datePublished,
      modifiedTime: frontmatter.dateModified,
    },
  })
}

export default function GuiaPage() {
  const { frontmatter, content } = getGuide()

  return (
    <>
      <ArticleJsonLd frontmatter={frontmatter} path={CANONICAL_PATH} />
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', path: '/' },
          { name: 'Guia de SEO técnico para Next.js', path: CANONICAL_PATH },
        ]}
      />

      <article className="container max-w-3xl py-12 lg:py-16">
        <header>
          <h1 className="font-bold text-foreground text-3xl leading-tight md:text-4xl">
            {frontmatter.title}
          </h1>
          <p className="mt-3 text-sm text-muted">
            <AuthorByline />
            {' · '}Atualizado em{' '}
            <time dateTime={frontmatter.dateModified}>
              {new Date(`${frontmatter.dateModified}T00:00:00`).toLocaleDateString('pt-BR')}
            </time>
          </p>
        </header>

        <div className="rich-text mt-8">
          <MDXRemote source={content} components={mdxComponents} options={mdxOptions} />
        </div>

        {/* id estável: alvo do trigger de element visibility do evento
            `article_read` no GTM (docs/measurement-plan.md). Sem ele, o guia
            — a página mais linkada do site — nunca disparava o evento. */}
        <footer id="article-end" className="mt-10 border-t border-gray pt-4">
          <p className="text-xs text-muted">
            © {frontmatter.dateModified.slice(0, 4)} {site.author.name}. Todos
            os direitos reservados. Citações curtas com atribuição e link para
            o guia original são bem-vindas.
          </p>
        </footer>
      </article>

      {frontmatter.faq && frontmatter.faq.length > 0 && (
        <FaqSection items={frontmatter.faq} />
      )}
    </>
  )
}
