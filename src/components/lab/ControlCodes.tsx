'use client'

import { useEffect, useState } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// Os dois códigos do controle positivo que passam por um Client Component
// (docs/detection-experiment.md §4.6). Estão no mesmo arquivo 'use client' de
// propósito, porque a diferença entre eles é o ponto do experimento:
//
// - RenderedByClientComponent renderiza o código DURANTE o render. Um
//   componente 'use client' também é renderizado no servidor, então o código
//   sai no HTML como qualquer outro texto. 'use client' não quer dizer
//   "invisível para quem não roda JS".
// - FetchedCode só obtém o código DEPOIS da montagem, num useEffect. Sem
//   JavaScript executado, o código não existe na página, e a requisição a
//   /lab/<slug>/c é registrada pelo proxy.
// ─────────────────────────────────────────────────────────────────────────────

export function RenderedByClientComponent({ code }: { code: string }) {
  return (
    <p>
      Código do componente cliente: <strong>{code}</strong>
    </p>
  )
}

export function FetchedCode({ endpoint }: { endpoint: string }) {
  const [code, setCode] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    fetch(endpoint, { cache: 'no-store' })
      .then((response) => (response.ok ? response.json() : Promise.reject(response.status)))
      .then((data: { code: string }) => setCode(data.code))
      .catch(() => setFailed(true))
  }, [endpoint])

  return (
    <p>
      Código carregado no navegador:{' '}
      <strong data-testid="fetched-code">{code ?? (failed ? 'indisponível' : 'carregando…')}</strong>
    </p>
  )
}
