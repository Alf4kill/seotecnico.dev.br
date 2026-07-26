// ─────────────────────────────────────────────────────────────────────────────
// Pares de tradução — fonte única de verdade do hreflang (CLAUDE.md §6).
//
// Por que uma lista aqui, e não `translationOf` lido do frontmatter: o
// frontmatter conhece o *slug* do par, mas hreflang precisa da *URL*, e as duas
// não coincidem — a versão PT vive em /guia/seo-tecnico-nextjs e a EN em
// /en/guide/technical-seo-nextjs, com slug em inglês porque a URL de uma página
// em inglês carrega a query em inglês. Manter o mapa num só lugar é o que
// garante a reciprocidade: os dois lados de um par são gerados do MESMO objeto,
// então não existe estado em que A aponte para B sem B apontar de volta. O teste
// de unidade confere que o frontmatter concorda com este mapa; a suíte Playwright
// confere que o HTML servido concorda com os dois.
//
// Regra do Google que este módulo materializa: hreflang é recíproco ou é
// ignorado. Uma página que se anuncia como alternativa de outra sem receber a
// declaração de volta não entra no cluster de idiomas — falha silenciosa, sem
// erro em lugar nenhum.
// ─────────────────────────────────────────────────────────────────────────────

export type Lang = 'pt-BR' | 'en'

export const LANGS: readonly Lang[] = ['pt-BR', 'en'] as const

/**
 * `x-default` aponta para o lado pt-BR: este é um site português-primeiro
 * (§10), então o fallback para quem não casa com nenhum idioma declarado é o
 * conteúdo original, não a tradução.
 */
export const X_DEFAULT_LANG: Lang = 'pt-BR'

export interface TranslationPair {
  /** Valor de `translationOf` no frontmatter — o identificador comum ao par. */
  id: string
  paths: Record<Lang, string>
}

export const TRANSLATION_PAIRS: readonly TranslationPair[] = [
  {
    id: 'seo-tecnico-nextjs',
    paths: {
      'pt-BR': '/guia/seo-tecnico-nextjs',
      en: '/en/guide/technical-seo-nextjs',
    },
  },
] as const

/** O par a que uma rota pertence, ou undefined se ela não tem tradução. */
export function pairForPath(path: string): TranslationPair | undefined {
  return TRANSLATION_PAIRS.find((pair) =>
    LANGS.some((lang) => pair.paths[lang] === path)
  )
}

/** O idioma em que uma rota está, deduzido do par; undefined se não é par. */
export function langOfPath(path: string): Lang | undefined {
  const pair = pairForPath(path)
  return pair && LANGS.find((lang) => pair.paths[lang] === path)
}

/**
 * O caminho da versão no outro idioma — o que o seletor de idioma usa.
 */
export function counterpartPath(path: string): { lang: Lang; path: string } | undefined {
  const pair = pairForPath(path)
  const current = langOfPath(path)
  if (!pair || !current) return undefined
  const other = LANGS.find((lang) => lang !== current)
  return other ? { lang: other, path: pair.paths[other] } : undefined
}

/**
 * Mapa `hreflang → caminho` de uma rota, incluindo a auto-referência (o Google
 * exige que a página se liste entre as alternativas) e `x-default`. Devolve
 * undefined para rotas sem tradução: emitir hreflang de um par de um item só
 * seria declarar um cluster que não existe.
 *
 * Caminhos relativos, não URLs absolutas — quem absolutiza é `buildMetadata`,
 * que já tem `absoluteUrl` e o `metadataBase`. Manter este módulo livre de
 * `site` evita o import circular com metadata.ts.
 */
export function languageAlternatePaths(path: string): Record<string, string> | undefined {
  const pair = pairForPath(path)
  if (!pair) return undefined

  const alternates: Record<string, string> = {}
  for (const lang of LANGS) alternates[lang] = pair.paths[lang]
  alternates['x-default'] = pair.paths[X_DEFAULT_LANG]
  return alternates
}
