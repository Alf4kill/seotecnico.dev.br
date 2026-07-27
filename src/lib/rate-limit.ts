// ─────────────────────────────────────────────────────────────────────────────
// Limites de uso para as rotas de ferramenta — janela fixa por chamador e
// orçamento diário global.
//
// O estado é do PROCESSO, não compartilhado. Na Vercel cada instância tem o
// seu, então o teto real escala com o fan-out: isto barra o abuso trivial (um
// script em laço), não um atacante distribuído. Um limitador exato exigiria
// armazenamento compartilhado, que §13 do CLAUDE.md mantém fora do projeto.
//
// Ainda assim vale mais no checador de CWV do que no validador: lá o custo do
// abuso é largura de banda; aqui é a QUOTA da chave do CrUX, que é finita,
// compartilhada por todos os visitantes e, se esgotada, derruba a ferramenta
// para todo mundo até o dia seguinte. Daí o orçamento diário além da janela.
//
// Nada é logado e nada sobrevive à janela.
// ─────────────────────────────────────────────────────────────────────────────

interface Window {
  count: number
  resetAt: number
}

export interface FixedWindowLimiter {
  /** Registra uma chamada. `true` = estourou o limite. */
  hit(key: string): boolean
}

export function createFixedWindow(options: {
  windowMs: number
  max: number
  /** Acima disto, entradas expiradas são varridas antes de inserir. */
  maxKeys?: number
}): FixedWindowLimiter {
  const { windowMs, max, maxKeys = 5_000 } = options
  const windows = new Map<string, Window>()

  return {
    hit(key: string): boolean {
      const now = Date.now()
      const current = windows.get(key)

      if (!current || now >= current.resetAt) {
        // Varre só quando o Map cresce: uma instância de vida longa não deve
        // acumular chave de quem passou por aqui uma vez.
        if (windows.size >= maxKeys) {
          for (const [k, window] of windows) {
            if (now >= window.resetAt) windows.delete(k)
          }
        }
        windows.set(key, { count: 1, resetAt: now + windowMs })
        return false
      }

      current.count += 1
      return current.count > max
    },
  }
}

export interface DailyBudget {
  /** Consome uma unidade. `false` = orçamento do dia esgotado. */
  spend(): boolean
  remaining(): number
}

/**
 * Disjuntor diário: teto absoluto de chamadas externas por dia, para que uma
 * rajada não drene a quota da chave. Vira à meia-noite UTC.
 */
export function createDailyBudget(max: number): DailyBudget {
  let day = ''
  let used = 0

  const today = () => new Date().toISOString().slice(0, 10)

  return {
    spend(): boolean {
      const now = today()
      if (now !== day) {
        day = now
        used = 0
      }
      if (used >= max) return false
      used += 1
      return true
    },
    remaining(): number {
      return today() === day ? Math.max(0, max - used) : max
    },
  }
}

/**
 * Identidade do chamador para fins de limite. `x-forwarded-for` é o que a
 * Vercel preenche na borda; o primeiro hop é o cliente. Não é identificação —
 * o valor só existe em memória, dentro da janela, e nunca é logado.
 */
export function clientKey(request: { headers: { get(name: string): string | null } }): string {
  const forwarded = request.headers.get('x-forwarded-for') ?? ''
  return forwarded.split(',')[0].trim() || request.headers.get('x-real-ip') || 'unknown'
}
