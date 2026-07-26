import type { Metadata } from 'next'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { getGuide } from '@/lib/content'
import { mdxOptions } from '@/lib/mdx'
import { mdxComponents } from '@/components/mdx/mdx-components'
import { ArticleJsonLd, BreadcrumbJsonLd } from '@/components/seo/JsonLd'
import { FaqSection } from '@/components/sections/FaqSection'
import { AuthorByline } from '@/components/ui/AuthorByline'
import { ArticleTldr } from '@/components/ui/ArticleTldr'
import { LanguageSwitch } from '@/components/ui/LanguageSwitch'
import { buildMetadata } from '@/lib/metadata'
import { site } from '@/lib/site'

// ─────────────────────────────────────────────────────────────────────────────
// Versão em inglês da pilar (CLAUDE.md §5.1). Par de hreflang declarado em
// lib/hreflang.ts; `buildMetadata` emite as tags a partir de lá.
//
// Sobre o `lang="en"` no <article> em vez de no <html>: o <html> é do root
// layout e vale para o documento inteiro — que aqui inclui header, footer e
// banner de consentimento, todos em português. Trocar o documento para `en`
// rotularia errado essa moldura; marcar a subárvore que realmente está em
// inglês é a descrição correta. Para o Google não muda nada (ele ignora o
// atributo e detecta idioma pelo conteúdo), mas muda para tecnologia
// assistiva. Se /en crescer a ponto de ter moldura própria, o caminho é um
// segundo root layout via route group — ao custo de um page load inteiro na
// troca de idioma.
// ─────────────────────────────────────────────────────────────────────────────

const CANONICAL_PATH = '/en/guide/technical-seo-nextjs'

export function generateMetadata(): Metadata {
  const { frontmatter } = getGuide('en')
  return buildMetadata({
    title: frontmatter.title,
    absoluteTitle: true,
    description: frontmatter.description,
    path: CANONICAL_PATH,
    locale: 'en_US',
    article: {
      publishedTime: frontmatter.datePublished,
      modifiedTime: frontmatter.dateModified,
    },
  })
}

export default function GuideEnPage() {
  const { frontmatter, content } = getGuide('en')

  return (
    <>
      <ArticleJsonLd frontmatter={frontmatter} path={CANONICAL_PATH} />
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', path: '/' },
          { name: 'Technical SEO for Next.js', path: CANONICAL_PATH },
        ]}
      />

      <article lang="en" className="container max-w-3xl py-12 lg:py-16">
        <header>
          <div className="mb-6">
            <LanguageSwitch path={CANONICAL_PATH} />
          </div>
          <h1 className="font-bold text-foreground text-3xl leading-tight md:text-4xl">
            {frontmatter.title}
          </h1>
          <p className="mt-3 text-sm text-muted">
            <AuthorByline lang="en" />
            {' · '}Updated{' '}
            <time dateTime={frontmatter.dateModified}>
              {new Date(`${frontmatter.dateModified}T00:00:00`).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </time>
          </p>
          {frontmatter.tldr && <ArticleTldr lang="en">{frontmatter.tldr}</ArticleTldr>}
        </header>

        <div className="rich-text mt-8">
          <MDXRemote source={content} components={mdxComponents} options={mdxOptions} />
        </div>

        {/* Mesmo id estável da versão PT: alvo do trigger de element visibility
            do evento `article_read` (docs/measurement-plan.md). */}
        <footer id="article-end" className="mt-10 border-t border-gray pt-4">
          <p className="text-xs text-muted">
            © {frontmatter.dateModified.slice(0, 4)} {site.author.name}. All
            rights reserved. Short quotes with attribution and a link to the
            original guide are welcome.
          </p>
        </footer>
      </article>

      {frontmatter.faq && frontmatter.faq.length > 0 && (
        <FaqSection
          items={frontmatter.faq}
          titulo="Frequently asked questions"
          lang="en"
        />
      )}
    </>
  )
}
