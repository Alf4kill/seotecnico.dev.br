'use client'

import { useEffect } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// Botão "Copiar" nos blocos de código de um artigo.
//
// Uma ilha por artigo, não um componente por bloco: os blocos continuam HTML
// estático do build (Shiki), sem hidratação. Depois de montar, esta ilha
// acrescenta um botão a cada <figure> do rehype-pretty-code e trata todos os
// cliques com UM listener delegado — o guia tem dezenas de blocos, e dezenas de
// ilhas hidratando custariam TBT/INP que a página não precisa pagar.
//
// Sem JavaScript o bloco continua legível e selecionável; o botão é só atalho.
// ─────────────────────────────────────────────────────────────────────────────

const FIGURE = 'figure[data-rehype-pretty-code-figure]'

export function CodeCopy({ lang }: { lang: 'pt-BR' | 'en' }) {
  useEffect(() => {
    const root = document.querySelector('.rich-text')
    if (!root) return

    const label = lang === 'en' ? 'Copy' : 'Copiar'
    const done = lang === 'en' ? 'Copied' : 'Copiado'

    const buttons: HTMLButtonElement[] = []
    root.querySelectorAll<HTMLElement>(FIGURE).forEach((figure) => {
      const button = document.createElement('button')
      button.type = 'button'
      button.className = 'code-copy'
      button.textContent = label
      figure.append(button)
      buttons.push(button)
    })

    function onClick(event: Event) {
      const button = (event.target as HTMLElement).closest('button.code-copy')
      if (!(button instanceof HTMLButtonElement)) return
      const code = button.closest(FIGURE)?.querySelector('pre')?.innerText ?? ''
      navigator.clipboard?.writeText(code).then(() => {
        button.textContent = done
        window.setTimeout(() => (button.textContent = label), 1600)
      })
    }

    root.addEventListener('click', onClick)
    return () => {
      root.removeEventListener('click', onClick)
      buttons.forEach((b) => b.remove())
    }
  }, [lang])

  return null
}
