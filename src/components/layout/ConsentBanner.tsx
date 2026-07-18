'use client'

import { useEffect, useSyncExternalStore } from 'react'
import Link from 'next/link'
import {
  applyConsent,
  getSavedConsent,
  saveConsent,
  subscribeConsent,
  type ConsentChoice,
} from '@/lib/analytics'

// No SSR o banner É renderizado (snapshot null = "sem escolha salva"): assim
// ele entra no HTML estático e pinta junto com o FCP. Montá-lo só após a
// hidratação fazia dele o elemento LCP (~1.2s mais tarde) em páginas com pouco
// conteúdo — medido pelo Lighthouse CI em /blog. Para visitantes que já
// escolheram, a hidratação o remove logo em seguida (flash breve, overlay
// `fixed`, sem CLS).
const getServerSnapshot = (): ConsentChoice | null => null

function choose(choice: ConsentChoice) {
  applyConsent(choice)
  saveConsent(choice) // notifica o store → banner some
}

/**
 * Banner de consentimento LGPD + Consent Mode v2.
 *
 * O default é "denied" (definido inline no layout, antes do GTM). Este banner
 * apenas atualiza o consentimento. Recusar é tão fácil quanto aceitar:
 * botões com o mesmo peso visual, sem dark patterns.
 * A escolha fica salva em localStorage e é reaplicada nas próximas visitas.
 */
export function ConsentBanner() {
  const saved = useSyncExternalStore(subscribeConsent, getSavedConsent, getServerSnapshot)

  // Reaplica a escolha salva de visitas anteriores (efeito externo puro).
  useEffect(() => {
    const choice = getSavedConsent()
    if (choice) applyConsent(choice)
  }, [])

  if (saved !== null) return null

  return (
    <div
      role="dialog"
      aria-label="Consentimento de cookies"
      className="fixed inset-x-0 bottom-0 z-10 border-t border-gray bg-white shadow-[0_-4px_16px_rgba(0,0,0,0.08)]"
    >
      <div className="container-xl flex flex-col gap-4 py-4 md:flex-row md:items-center md:justify-between">
        <p className="text-sm leading-6 text-foreground">
          Usamos cookies somente para medir a audiência do site (Google
          Analytics) — e só depois do seu consentimento. Recusar não muda nada
          no funcionamento.{' '}
          <Link
            href="/politica-de-privacidade"
            title="Política de privacidade"
            className="font-semibold text-primary hover:text-primary-dark transition-colors"
          >
            Política de privacidade
          </Link>
        </p>

        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            onClick={() => choose('denied')}
            className="rounded-full border-[1.5px] border-gray px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"
          >
            Recusar
          </button>
          <button
            type="button"
            onClick={() => choose('granted')}
            className="rounded-full border-[1.5px] border-primary bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
          >
            Aceitar
          </button>
        </div>
      </div>
    </div>
  )
}
