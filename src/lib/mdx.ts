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
  // Tema medido, não escolhido por gosto: o audit de contraste do Lighthouse
  // avalia os spans de código como texto. Medindo o token de PIOR contraste de
  // cada tema sobre o próprio fundo (script em /tmp, comentário + pior token):
  //   github-dark-high-contrast  11,12 / 9,23  ← escolhido
  //   github-dark-default         6,15 / 6,15
  //   github-dark-dimmed          3,88 / 3,88  ← anterior, reprovava
  //   github-dark                 3,05 / 3,05
  //   dracula / nord              3,03 / 2,43
  // Só o escolhido passa AA (4,5:1) com folga em todos os tokens, não apenas
  // nos comentários. Ao trocar de tema, meça de novo antes de trocar.
  theme: 'github-dark-high-contrast',
}

export const mdxOptions: MDXRemoteProps['options'] = {
  mdxOptions: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [rehypeSlug, [rehypePrettyCode, prettyCodeOptions]],
  },
}
