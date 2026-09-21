'use client'

import { useState } from 'react'

/** "Copiar link" da margem do artigo — copia a URL canônica, não a da barra. */
export function CopyLinkButton({ url, lang }: { url: string; lang: 'pt-BR' | 'en' }) {
  const [copied, setCopied] = useState(false)
  const label = lang === 'en' ? 'Copy link' : 'Copiar link'
  const done = lang === 'en' ? 'Link copied' : 'Link copiado'

  return (
    <button
      type="button"
      onClick={() =>
        navigator.clipboard?.writeText(url).then(() => {
          setCopied(true)
          window.setTimeout(() => setCopied(false), 1600)
        })
      }
      className="text-left font-mono text-xs text-primary transition-colors hover:text-primary-hover"
    >
      <span aria-live="polite">{copied ? done : label}</span>
    </button>
  )
}
