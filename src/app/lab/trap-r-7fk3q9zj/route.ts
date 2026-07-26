import { trapHandler } from '../trap-response'

// Trap A — descoberta só via robots.txt (docs/detection-experiment.md §4).
// O diretório desta rota DEVE ser igual a TRAP_ROBOTS_PATH em
// src/lib/lab-traps.ts; tests/seo/traps.spec.ts falha se divergirem.
// É o único trap com o atraso configurável (§4.3): latência revela
// implementação do cliente (timeout, retry, backoff), não política.
export const GET = trapHandler('robots', { delayed: true })
