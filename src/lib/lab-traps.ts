// ─────────────────────────────────────────────────────────────────────────────
// Honeypot routes do experimento de detecção (docs/detection-experiment.md §4).
//
// Fonte única dos caminhos: robots.ts, llms-txt.ts, proxy.ts e os testes leem
// DAQUI, para que nenhuma superfície possa divergir das outras — o trap
// aparecer no sitemap por acidente anularia o experimento sem sintoma visível.
//
// Os slugs são aleatórios de propósito: um hit não pode vir de scanner
// chutando URL, então o próprio slug atribui o canal de descoberta.
//   - trap-r-*: aparece SÓ como Disallow no /robots.txt → hit = desrespeito
//     deliberado da diretiva.
//   - trap-l-*: aparece SÓ no /llms.txt → hit = cliente que parseia llms.txt
//     e segue os links (adoção do canal; nenhum desrespeito envolvido).
// ─────────────────────────────────────────────────────────────────────────────

/** Descoberta possível apenas via robots.txt (linha Disallow). */
export const TRAP_ROBOTS_PATH = '/lab/trap-r-7fk3q9zj'

/** Descoberta possível apenas via llms.txt (link rotulado). */
export const TRAP_LLMS_PATH = '/lab/trap-l-x2m8wv5d'

export type TrapChannel = 'robots' | 'llms'

export function trapChannel(pathname: string): TrapChannel | null {
  if (pathname === TRAP_ROBOTS_PATH) return 'robots'
  if (pathname === TRAP_LLMS_PATH) return 'llms'
  return null
}
