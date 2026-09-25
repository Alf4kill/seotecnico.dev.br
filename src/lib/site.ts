// ─────────────────────────────────────────────────────────────────────────────
// Fonte única de verdade do site.
// Todos os metadados, schemas JSON-LD, header e footer consomem daqui.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extrai o ID do container GTM (GTM-XXXXXXX) do valor da env var, tolerando que
 * alguém cole o snippet inteiro do GTM por engano (foi o que aconteceu em
 * produção). Retorna '' quando não há ID — assim o <GoogleTagManager> não monta,
 * em vez de pedir um container malformado. Ver docs/gtm-container-setup.md.
 */
export function parseGtmId(raw: string | undefined): string {
  return (raw ?? '').match(/GTM-[A-Z0-9]+/i)?.[0] ?? ''
}

export const site = {
  // ── Identidade ──────────────────────────────────────────────────────────────
  name: 'SEO Técnico',
  url: process.env.NEXT_PUBLIC_DOMAIN ?? 'https://seotecnico.dev.br',
  description:
    'Laboratório vivo de SEO técnico para desenvolvedores Next.js: guias práticos, ferramentas gratuitas e experimentos medidos com dados reais.',
  locale: 'pt_BR',
  // O repositório é parte do portfólio (§14: público por design) — as páginas
  // em inglês apontam para ele como a prova verificável do que descrevem.
  repository: 'https://github.com/Alf4kill/seotecnico.dev.br',

  // ── Analytics / Tracking ────────────────────────────────────────────────────
  gtmId: parseGtmId(process.env.NEXT_PUBLIC_GTM_ID),

  // ── Autor (E-E-A-T) ─────────────────────────────────────────────────────────
  // Preencher URLs públicas quando disponíveis; campos vazios não são
  // renderizados nem incluídos no JSON-LD.
  author: {
    name: 'Henrique Lopes Souza',
    jobTitle: 'Technical SEO Engineer',
    github: 'https://github.com/Alf4kill',
    linkedin: 'https://www.linkedin.com/in/henriquelopessouza/',
    email: '',
    // Currículo em PDF hospedado FORA do repositório: o repo é público e o
    // histórico do git é permanente, e um CV carrega dados pessoais (§14).
    // Um por idioma: cada página "sobre" linka o do próprio idioma.
    cv: {
      'pt-BR': 'https://drive.google.com/file/d/1dEmpxE1v9fUTAPEWZCNfNi4iwM2i0KDR/view',
      en: 'https://drive.google.com/file/d/1gTKLUBiKruYidknaniAMY2w1FO7OBqKs/view',
    },
  },
} as const

// ─────────────────────────────────────────────────────────────────────────────
// Indexação / SEO — fonte única de verdade.
//
// `indexable` só é true quando SITE_INDEXABLE === 'true' (produção real). Em
// qualquer outro caso (dev, homologação na Vercel, variável ausente) o site
// envia noindex/nofollow nos metadados e robots.txt com "disallow: /".
// Fail-safe: o padrão é NÃO indexar. Consumido por app/layout.tsx e app/robots.ts.
// ─────────────────────────────────────────────────────────────────────────────
export const indexable = process.env.SITE_INDEXABLE === 'true'
