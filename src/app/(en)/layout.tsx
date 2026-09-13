import { RootShell } from '@/components/layout/RootShell'
import { rootMetadata } from '@/lib/metadata'

// Root layout das rotas em inglês (/en/*). Existe para que o documento inteiro —
// <html lang>, header, footer e banner de consentimento — esteja no idioma que a
// página declara no hreflang, e não só o <article>. Ver RootShell.

export const metadata = rootMetadata('en')

export default function EnglishRootLayout({ children }: { children: React.ReactNode }) {
  return <RootShell lang="en">{children}</RootShell>
}
