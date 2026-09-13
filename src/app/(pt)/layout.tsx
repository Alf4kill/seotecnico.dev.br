import { RootShell } from '@/components/layout/RootShell'
import { rootMetadata } from '@/lib/metadata'

// Root layout das rotas em português — o site original (§10, português-primeiro).
// O documento em si vive em RootShell; ver o comentário lá sobre por que há um
// root layout por idioma.

export const metadata = rootMetadata('pt-BR')

export default function PortugueseRootLayout({ children }: { children: React.ReactNode }) {
  return <RootShell lang="pt-BR">{children}</RootShell>
}
