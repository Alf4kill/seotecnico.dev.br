import type { MDXRemoteProps } from 'next-mdx-remote/rsc'
import remarkGfm from 'remark-gfm'
import rehypeSlug from 'rehype-slug'
import rehypePrettyCode, { type Options as PrettyCodeOptions } from 'rehype-pretty-code'
import { shikiTheme } from '@/lib/shiki-theme'

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
  // Tema medido, não escolhido por gosto: o audit de contraste do Lighthouse
  // avalia os spans de código como texto. Até 2026-09 o site usava o
  // github-dark-high-contrast (pior token 9,23:1), escolhido medindo o token
  // de PIOR contraste de cada tema do catálogo:
  //   github-dark-high-contrast  11,12 / 9,23
  //   github-dark-default         6,15 / 6,15
  //   github-dark-dimmed          3,88 / 3,88
  //   github-dark                 3,05 / 3,05
  //   dracula / nord              3,03 / 2,43
  // Com o sistema visual novo o tema passou a ser construído com a paleta do
  // site (src/lib/shiki-theme.ts), pelo mesmo critério — pior token 5,12:1 —
  // e o critério virou teste (shiki-theme.test.ts). Ao mexer numa cor do tema,
  // o CI mede de novo.
  theme: shikiTheme,
}

export const mdxOptions: MDXRemoteProps['options'] = {
  mdxOptions: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [rehypeSlug, [rehypePrettyCode, prettyCodeOptions]],
  },
}
