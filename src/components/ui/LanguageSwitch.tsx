import Link from 'next/link'
import { counterpartPath, type Lang } from '@/lib/hreflang'

// ─────────────────────────────────────────────────────────────────────────────
// Seletor de idioma de uma página traduzida.
//
// Deriva do MESMO mapa que gera as tags hreflang (lib/hreflang.ts), então o
// link visível e a declaração para o Google nunca podem divergir — o caso
// clássico é o hreflang certo com o link do menu apontando para a home do outro
// idioma, que manda o leitor para lugar nenhum.
//
// O rótulo é escrito no idioma de DESTINO ("English" na página em português,
// "Português" na página em inglês): quem procura a outra versão lê o idioma que
// procura, não o que está vendo. Pelo mesmo motivo o link carrega `hreflang` e
// `lang` — sem `lang`, um leitor de tela anuncia "Português" com fonemas
// ingleses.
//
// `prefetch={false}` em todo link que cruza idioma. Cada idioma tem o seu root
// layout (ver RootShell), e o Next.js recarrega a página inteira ao navegar
// entre root layouts — o payload RSC que o <Link> pré-carrega quando entra no
// viewport nunca é usado. Medido no build de 2026-09-12: sem isso, /en disparava
// prefetch de /, /blog, /ferramentas e /politica-de-privacidade. A mesma regra
// vale para Header, Footer, ConsentBanner e o 404 bilíngue.
// ─────────────────────────────────────────────────────────────────────────────

const LABEL: Record<Lang, { label: string; title: string }> = {
  'pt-BR': { label: 'Português', title: 'Ler este guia em português' },
  en: { label: 'English', title: 'Read this guide in English' },
}

export function LanguageSwitch({ path }: { path: string }) {
  const counterpart = counterpartPath(path)
  if (!counterpart) return null

  const { label, title } = LABEL[counterpart.lang]

  return (
    <Link
      href={counterpart.path}
      hrefLang={counterpart.lang}
      prefetch={false}
      lang={counterpart.lang}
      title={title}
      className="inline-flex min-h-9 items-center gap-2 self-start border border-gray-control px-3 font-mono text-xs uppercase tracking-[0.1em] text-primary transition-colors hover:border-primary"
    >
      {label}
    </Link>
  )
}
