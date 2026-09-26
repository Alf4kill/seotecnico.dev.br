import type { Metadata } from 'next'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { getEnglishCaseStudy } from '@/lib/content'
import { mdxOptions } from '@/lib/mdx'
import { mdxComponents } from '@/components/mdx/mdx-components'
import { ArticleJsonLd, BreadcrumbJsonLd } from '@/components/seo/JsonLd'
import { FaqSection } from '@/components/sections/FaqSection'
import { ArticleLayout } from '@/components/article/ArticleLayout'
import { buildMetadata } from '@/lib/metadata'
import { site } from '@/lib/site'

// ─────────────────────────────────────────────────────────────────────────────
// Case study em inglês: o piloto de detecção de crawlers + o controle positivo
// (H15), para o leitor de portfólio e para distribuição fora do Brasil.
//
// Não é tradução: os dois artigos portugueses que ele resume
// (/blog/detectar-crawlers-ia e /blog/chatgpt-le-javascript) têm outro recorte,
// então não há par de hreflang. Mesmo formato do guia em inglês — um MDX, uma
// rota, o ArticleLayout — e o cartão 3 de /en/case-studies aponta para cá.
// ─────────────────────────────────────────────────────────────────────────────

const SLUG = 'ai-crawler-detection'
const PATH = `/en/case-studies/${SLUG}`

export function generateMetadata(): Metadata {
  const { frontmatter } = getEnglishCaseStudy(SLUG)
  return buildMetadata({
    title: frontmatter.title,
    absoluteTitle: true,
    description: frontmatter.description,
    path: PATH,
    lang: 'en',
    article: {
      publishedTime: frontmatter.datePublished,
      modifiedTime: frontmatter.dateModified,
    },
    ogImage: { path: `${PATH}/opengraph-image`, alt: frontmatter.title },
  })
}

export default function AiCrawlerCaseStudyPage() {
  const post = getEnglishCaseStudy(SLUG)
  const { frontmatter, content } = post

  return (
    <>
      <ArticleJsonLd frontmatter={frontmatter} path={PATH} imagePath={`${PATH}/opengraph-image`} />
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', path: '/en' },
          { name: 'Case studies', path: '/en/case-studies' },
          { name: 'AI crawler detection', path: PATH },
        ]}
      />

      <ArticleLayout
        post={post}
        lang="en"
        path={PATH}
        breadcrumbs={[
          { name: 'Home', href: '/en' },
          { name: 'Case studies', href: '/en/case-studies' },
        ]}
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
