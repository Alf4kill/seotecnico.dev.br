import type { MDXRemoteProps } from 'next-mdx-remote/rsc'
import remarkGfm from 'remark-gfm'
import rehypeSlug from 'rehype-slug'
import rehypePrettyCode, { type Options as PrettyCodeOptions } from 'rehype-pretty-code'

// ─────────────────────────────────────────────────────────────────────────────
// Pipeline MDX compartilhado entre artigos (/blog/[slug]) e o guia.
//
// - remark-gfm: tabelas, autolinks e demais extensões GFM.
// - rehype-slug: ids nos headings — âncoras internas (#secao) dos artigos
//   dependem disso.
// - rehype-pretty-code (Shiki): syntax highlighting resolvido no build;
//   zero JavaScript de apresentação no cliente (budget de performance §6).
// ─────────────────────────────────────────────────────────────────────────────

const prettyCodeOptions: PrettyCodeOptions = {
  theme: 'github-dark-dimmed',
}

export const mdxOptions: MDXRemoteProps['options'] = {
  mdxOptions: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [rehypeSlug, [rehypePrettyCode, prettyCodeOptions]],
  },
}
