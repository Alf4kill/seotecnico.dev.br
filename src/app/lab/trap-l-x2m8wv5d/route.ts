import { trapHandler } from '../trap-response'

// Trap B — descoberta só via llms.txt (docs/detection-experiment.md §4).
// O diretório desta rota DEVE ser igual a TRAP_LLMS_PATH em
// src/lib/lab-traps.ts; tests/seo/traps.spec.ts falha se divergirem.
// Sem atraso: aqui o que se mede é adoção do canal, não implementação.
export const GET = trapHandler('llms', { delayed: false })
