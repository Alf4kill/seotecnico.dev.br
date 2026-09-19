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
  const guide = getGuide()
  const { frontmatter, content } = guide

  return (
    <>
      <ArticleJsonLd frontmatter={frontmatter} path={CANONICAL_PATH} />
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', path: '/' },
          { name: 'Guia de SEO técnico para Next.js', path: CANONICAL_PATH },
        ]}
      />

      <ArticleLayout
        post={guide}
        lang="pt-BR"
        path={CANONICAL_PATH}
        breadcrumbs={[{ name: 'Início', href: '/' }]}
        beforeTitle={<LanguageSwitch path={CANONICAL_PATH} />}
        copyright={`© ${frontmatter.dateModified.slice(0, 4)} ${site.author.name}. Todos os direitos reservados. Citações curtas com atribuição e link para o guia original são bem-vindas.`}
      >
        <MDXRemote source={content} components={mdxComponents} options={mdxOptions} />
      </ArticleLayout>

      {frontmatter.faq && frontmatter.faq.length > 0 && (
        <FaqSection items={frontmatter.faq} />
      )}
    </>
  )
}
