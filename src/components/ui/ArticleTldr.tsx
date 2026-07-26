// ─────────────────────────────────────────────────────────────────────────────
// Resposta curta no topo do artigo — a contraparte visível de `Article.abstract`.
//
// A regra do primeiro parágrafo (CLAUDE.md §10) já obriga o texto a responder o
// `primaryQuery` de cara, mas em prosa: nada ali é extraível por máquina, e a
// resposta fica diluída na introdução. Este bloco vem do campo `tldr` do
// frontmatter — a MESMA string que sai em `abstract` no JSON-LD —, então a
// leitura humana e a leitura de máquina não podem divergir.
//
// Não substitui a introdução: complementa. O parágrafo seguinte continua
// respondendo a pergunta por extenso.
// ─────────────────────────────────────────────────────────────────────────────

export function ArticleTldr({
  children,
  lang = 'pt-BR',
}: {
  children: string
  lang?: 'pt-BR' | 'en'
}) {
  return (
    <p className="mt-6 border-l-4 border-primary bg-surface-2 px-5 py-4 text-base leading-7 text-foreground">
      <strong className="font-semibold">
        {lang === 'en' ? 'Short answer:' : 'Resposta curta:'}
      </strong>{' '}
      {children}
    </p>
  )
}
