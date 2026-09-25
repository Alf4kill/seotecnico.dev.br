import type { ReactNode } from 'react'

// Root layout próprio do controle positivo (docs/detection-experiment.md §4.6).
// Sem o RootShell do site, de propósito: sem GTM, sem banner de consentimento,
// sem header nem footer. A página mede o que um agente lê, e cada script a mais
// seria uma variável a mais. O único link interno é a política de
// privacidade, que a página cita ao dizer o que registra.

export default function LabProbeLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body style={{ fontFamily: 'system-ui, sans-serif', maxWidth: '42rem', margin: '0 auto', padding: '3rem 1.5rem', lineHeight: 1.6 }}>
        {children}
      </body>
    </html>
  )
}
