'use client'

import { useSyncExternalStore } from 'react'
import { Moon, Sun } from 'lucide-react'
import { THEME_STORAGE_KEY } from './ThemeScript'

type Theme = 'light' | 'dark'

/** Evento próprio: o toggle avisa a si mesmo que o tema mudou. */
const THEME_EVENT = 'seotecnico:themechange'

const systemDark = () => window.matchMedia('(prefers-color-scheme: dark)')

/** Tema efetivo agora: escolha salva, senão a preferência do sistema. */
function currentTheme(): Theme {
  const chosen = document.documentElement.dataset.theme
  if (chosen === 'light' || chosen === 'dark') return chosen
  return systemDark().matches ? 'dark' : 'light'
}

// O tema vive fora do React (atributo no <html> + localStorage), então quem lê
// é useSyncExternalStore, não useState num efeito. Duas fontes de mudança: a
// preferência do sistema — que ainda vale enquanto o usuário não escolheu — e o
// próprio clique no botão.
function subscribe(onChange: () => void) {
  const media = systemDark()
  media.addEventListener('change', onChange)
  window.addEventListener(THEME_EVENT, onChange)
  return () => {
    media.removeEventListener('change', onChange)
    window.removeEventListener(THEME_EVENT, onChange)
  }
}

export function ThemeToggle() {
  // No servidor o tema do visitante é desconhecido, e chutar divergiria da
  // hidratação — daí o undefined. Ele só afeta o rótulo acessível: os ícones
  // são resolvidos em CSS (ver o comentário no JSX).
  const theme = useSyncExternalStore<Theme | undefined>(
    subscribe,
    currentTheme,
    () => undefined,
  )

  function toggle() {
    const next: Theme = currentTheme() === 'dark' ? 'light' : 'dark'
    document.documentElement.dataset.theme = next
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next)
    } catch {
      // Storage bloqueado: o tema vale para esta navegação e não persiste.
    }
    window.dispatchEvent(new Event(THEME_EVENT))
  }

  const label =
    theme === undefined
      ? 'Alternar entre tema claro e escuro'
      : theme === 'dark'
        ? 'Mudar para o tema claro'
        : 'Mudar para o tema escuro'

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border-[1.5px] border-gray text-foreground transition-colors hover:border-primary hover:text-primary"
    >
      {/* Os dois ícones ficam no DOM e a visibilidade é decidida por CSS, a
          partir do mesmo data-theme que o script inline aplica. Assim o ícone
          certo já vem pintado no primeiro frame, sem esperar hidratação. */}
      <Sun className="h-4.5 w-4.5 theme-icon-light" strokeWidth={1.75} aria-hidden="true" />
      <Moon className="h-4.5 w-4.5 theme-icon-dark" strokeWidth={1.75} aria-hidden="true" />
    </button>
  )
}
