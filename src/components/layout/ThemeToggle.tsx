'use client'

import { useSyncExternalStore } from 'react'
import type { Lang } from '@/lib/hreflang'
import { THEME_EVENT, THEME_STORAGE_KEY } from './ThemeScript'
import { chrome } from '@/lib/design-tokens'

// ─────────────────────────────────────────────────────────────────────────────
// Botão de tema. O tema vive fora do React (atributo no <html>, gravado pelo
// ThemeScript antes da pintura), então quem lê é useSyncExternalStore.
//
// Sem ícone ilustrativo (regra do sistema): o glifo é o círculo — uma das três
// formas — meio cheio. Qual metade está cheia é decidido em CSS pelo mesmo
// data-theme (globals.css → .theme-glyph), então o primeiro frame já vem certo,
// sem esperar hidratação. Só o rótulo acessível depende do JavaScript.
// ─────────────────────────────────────────────────────────────────────────────

type Theme = 'light' | 'dark'

const COPY: Record<Lang, { toggle: string; toLight: string; toDark: string; menuLight: string; menuDark: string }> = {
  'pt-BR': {
    toggle: 'Alternar entre tema claro e escuro',
    toLight: 'Mudar para o tema claro',
    toDark: 'Mudar para o tema escuro',
    menuLight: 'Tema claro',
    menuDark: 'Tema escuro',
  },
  en: {
    toggle: 'Switch between light and dark theme',
    toLight: 'Switch to the light theme',
    toDark: 'Switch to the dark theme',
    menuLight: 'Light theme',
    menuDark: 'Dark theme',
  },
}

function currentTheme(): Theme {
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'
}

function subscribe(onChange: () => void) {
  window.addEventListener(THEME_EVENT, onChange)
  return () => window.removeEventListener(THEME_EVENT, onChange)
}

/**
 * `bar` é o botão quadrado da barra (desktop). `menu` é a linha do menu mobile:
 * na barra do celular não cabe um quarto botão de 44px sem rolagem lateral a
 * 390px (tests/seo/design.spec.ts), então lá o tema mora no menu, com texto.
 */
export function ThemeToggle({ lang, variant = 'bar' }: { lang: Lang; variant?: 'bar' | 'menu' }) {
  const theme = useSyncExternalStore<Theme | undefined>(subscribe, currentTheme, () => undefined)
  const copy = COPY[lang]

  function toggle() {
    const next: Theme = currentTheme() === 'dark' ? 'light' : 'dark'
    document.documentElement.dataset.theme = next
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next)
    } catch {
      // Storage bloqueado: o tema vale para esta navegação e não persiste.
    }
    for (const meta of Array.from(document.querySelectorAll('meta[name="theme-color"]'))) {
      meta.setAttribute('content', chrome[next])
    }
    window.dispatchEvent(new Event(THEME_EVENT))
  }

  const label = theme === undefined ? copy.toggle : theme === 'dark' ? copy.toLight : copy.toDark
  const glyph = (
    <span aria-hidden="true" className="theme-glyph relative block h-4.5 w-4.5 shrink-0 overflow-hidden rounded-full border-2 border-current">
      <span className="theme-glyph-fill absolute inset-y-0 w-1/2 bg-current" />
    </span>
  )

  if (variant === 'menu') {
    return (
      <button
        type="button"
        onClick={toggle}
        aria-label={label}
        data-theme-toggle=""
        className="flex min-h-12 items-center gap-3 font-mono text-[0.8125rem] uppercase tracking-[0.12em] text-muted transition-colors hover:text-primary"
      >
        {glyph}
        {theme === 'light' ? copy.menuDark : copy.menuLight}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      data-theme-toggle=""
      className="group flex h-11 w-11 shrink-0 items-center justify-center text-foreground transition-colors hover:text-primary"
    >
      {glyph}
    </button>
  )
}
