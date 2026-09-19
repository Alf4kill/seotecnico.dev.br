import type { Metadata } from 'next'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { getGuide } from '@/lib/content'
import { mdxOptions } from '@/lib/mdx'
import { mdxComponents } from '@/components/mdx/mdx-components'
import { ArticleJsonLd, BreadcrumbJsonLd } from '@/components/seo/JsonLd'
import { FaqSection } from '@/components/sections/FaqSection'
import { ArticleLayout } from '@/components/article/ArticleLayout'
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
  const guide = getGuide('en')
  const { frontmatter, content } = guide

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

      <ArticleLayout
        post={guide}
        lang="en"
        path={CANONICAL_PATH}
        breadcrumbs={[{ name: 'Home', href: '/en' }]}
        beforeTitle={<LanguageSwitch path={CANONICAL_PATH} />}
        copyright={`© ${frontmatter.dateModified.slice(0, 4)} ${site.author.name}. All rights reserved. Short quotes with attribution and a link to the original guide are welcome.`}
      >
        <MDXRemote source={content} components={mdxComponents} options={mdxOptions} />
      </ArticleLayout>

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
