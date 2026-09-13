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
// Vive no root layout inglês — app/(en)/layout.tsx —, então o <html lang="en">,
// o header, o footer e o banner já estão em inglês. Até 2026-09 esta página
// morava no layout português e marcava só o <article> com `lang="en"`, porque o
// resto do documento era português; ver RootShell sobre a mudança.
// ─────────────────────────────────────────────────────────────────────────────

const CANONICAL_PATH = '/en/guide/technical-seo-nextjs'

export function generateMetadata(): Metadata {
  const { frontmatter } = getGuide('en')
  return buildMetadata({
    title: frontmatter.title,
    absoluteTitle: true,
    description: frontmatter.description,
    path: CANONICAL_PATH,
    lang: 'en',
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
      <ArticleJsonLd
        frontmatter={frontmatter}
        path={CANONICAL_PATH}
        imagePath="/en/opengraph-image"
      />
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', path: '/en' },
          { name: 'Technical SEO for Next.js', path: CANONICAL_PATH },
        ]}
      />

      <article className="container max-w-3xl py-12 lg:py-16">
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
