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
      lang={counterpart.lang}
      title={title}
      className="inline-flex items-center gap-1.5 rounded-lg border border-gray px-3 py-1.5 text-sm text-primary transition-colors hover:bg-surface"
    >
      {label}
    </Link>
  )
}
