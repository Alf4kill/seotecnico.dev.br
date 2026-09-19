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
import type { Lang } from '@/lib/hreflang'

// No SSR o banner É renderizado (snapshot null = "sem escolha salva"): assim
// ele entra no HTML estático e pinta junto com o FCP. Montá-lo só após a
// hidratação fazia dele o elemento LCP (~1.2s mais tarde) em páginas com pouco
// conteúdo — medido pelo Lighthouse CI em /blog. Para visitantes que já
// escolheram, a hidratação o remove logo em seguida (flash breve, overlay
// `fixed`, sem CLS).
const getServerSnapshot = (): ConsentChoice | null => null

// A política de privacidade só existe em português; na moldura inglesa o link
// avisa isso e carrega hrefLang/lang do destino (mesma regra do Footer).
const COPY: Record<Lang, {
  dialog: string
  body: string
  policy: string
  policyLang?: Lang
  decline: string
  accept: string
}> = {
  'pt-BR': {
    dialog: 'Consentimento de cookies',
    body: 'Usamos cookies somente para medir a audiência do site (Google Analytics) — e só depois do seu consentimento. Recusar não muda nada no funcionamento.',
    policy: 'Política de privacidade',
    decline: 'Recusar',
    accept: 'Aceitar',
  },
  en: {
    dialog: 'Cookie consent',
    body: 'We use cookies only to measure site traffic (Google Analytics) — and only after you consent. Declining changes nothing about how the site works.',
    policy: 'Privacy policy (in Portuguese)',
    policyLang: 'pt-BR',
    decline: 'Decline',
    accept: 'Accept',
  },
}

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
export function ConsentBanner({ lang }: { lang: Lang }) {
  const copy = COPY[lang]
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
      aria-label={copy.dialog}
      className="fixed inset-x-0 bottom-0 z-10 border-t-2 border-accent bg-surface"
    >
      <div className="container-xl flex flex-col gap-4 py-4 md:flex-row md:items-center md:justify-between">
        <p className="text-sm leading-6 text-body">
          {copy.body}{' '}
          <Link
            href="/politica-de-privacidade"
            hrefLang={copy.policyLang}
            // Na moldura inglesa a política é outro root layout (ver LanguageSwitch).
            prefetch={copy.policyLang ? false : undefined}
            title={copy.policy}
            className="text-primary underline underline-offset-[3px] transition-colors hover:text-primary-hover"
          >
            {copy.policy}
          </Link>
        </p>

        {/* Recusar e aceitar com o mesmo peso visual (LGPD, §7.1) — nos dois idiomas:
            mesmo tamanho, mesma caixa, nenhum dos dois cheio de cor. */}
        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            onClick={() => choose('denied')}
            className="min-h-11 border border-gray-control px-5 font-mono text-xs font-semibold uppercase tracking-[0.08em] text-foreground transition-colors hover:border-primary hover:text-primary"
          >
            {copy.decline}
          </button>
          <button
            type="button"
            onClick={() => choose('granted')}
            className="min-h-11 border border-gray-control px-5 font-mono text-xs font-semibold uppercase tracking-[0.08em] text-foreground transition-colors hover:border-primary hover:text-primary"
          >
            {copy.accept}
          </button>
        </div>
      </div>
    </div>
  )
}
