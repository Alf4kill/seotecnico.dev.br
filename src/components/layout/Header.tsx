'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Search, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { site } from '@/lib/site'
import { counterpartPath, type Lang } from '@/lib/hreflang'
import { useSearchModal } from '@/components/search/SearchContext'
import { ThemeToggle } from '@/components/layout/ThemeToggle'

// ─────────────────────────────────────────────────────────────────────────────
// Header de um root layout. Recebe o idioma do layout (ver RootShell) e nunca
// o deduz da URL: a moldura é do documento, não da rota.
//
// A moldura inglesa tem só destinos em inglês. Linkar páginas em português a
// partir dela era exatamente o defeito que ela existe para corrigir — um
// recrutador que clica em qualquer coisa não pode ser despejado noutro idioma.
// ─────────────────────────────────────────────────────────────────────────────

interface Copy {
  home: string
  homeLabel: string
  nav: { label: string; href: string }[]
  navLabel: string
  mobileNavLabel: string
  openMenu: string
  closeMenu: string
}

const COPY: Record<Lang, Copy> = {
  'pt-BR': {
    home: '/',
    homeLabel: `${site.name} — página inicial`,
    nav: [
      { label: 'Guia',        href: '/guia/seo-tecnico-nextjs' },
      { label: 'Blog',        href: '/blog' },
      { label: 'Ferramentas', href: '/ferramentas' },
      { label: 'Sobre',       href: '/sobre' },
    ],
    navLabel: 'Navegação principal',
    mobileNavLabel: 'Navegação mobile',
    openMenu: 'Abrir menu',
    closeMenu: 'Fechar menu',
  },
  en: {
    home: '/en',
    homeLabel: `${site.name} — home`,
    nav: [
      { label: 'Guide', href: '/en/guide/technical-seo-nextjs' },
      { label: 'About', href: '/en/about' },
    ],
    navLabel: 'Main navigation',
    mobileNavLabel: 'Mobile navigation',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
  },
}

// Rótulo e título escritos no idioma de DESTINO, pelo mesmo motivo do
// LanguageSwitch: quem procura a outra versão lê o idioma que procura.
const SWITCH: Record<Lang, { label: string; page: string; site: string; home: string }> = {
  'pt-BR': {
    label: 'Português',
    page: 'Ler esta página em português',
    site: 'Versão do site em português',
    home: '/',
  },
  en: {
    label: 'English',
    page: 'Read this page in English',
    site: 'English version of the site',
    home: '/en',
  },
}

/**
 * Link para o outro idioma. Aponta para a tradução da página atual quando ela
 * existe — o mesmo mapa que gera o hreflang, então link visível e declaração
 * para o Google não divergem — e, quando não existe, para a home do outro
 * idioma. Nunca para lugar nenhum.
 */
function LanguageLink({ lang, className }: { lang: Lang; className: string }) {
  const pathname = usePathname()
  const target: Lang = lang === 'en' ? 'pt-BR' : 'en'
  const counterpart = counterpartPath(pathname)
  const copy = SWITCH[target]

  return (
    <Link
      href={counterpart?.path ?? copy.home}
      hrefLang={target}
      // Outro root layout ⇒ recarga completa; o prefetch seria descartado.
      // Ver LanguageSwitch.
      prefetch={false}
      lang={target}
      title={counterpart ? copy.page : copy.site}
      className={className}
    >
      {copy.label}
    </Link>
  )
}

/**
 * O botão de busca é um componente à parte porque `useSearchModal` exige o
 * SearchProvider, que só a moldura portuguesa monta. Um hook não pode ser
 * chamado condicionalmente; um componente pode ser renderizado condicionalmente.
 */
function SearchButton({ variant, onBeforeOpen }: { variant: 'desktop' | 'mobile'; onBeforeOpen?: () => void }) {
  const { openSearch } = useSearchModal()

  if (variant === 'mobile') {
    return (
      <button
        type="button"
        onClick={() => { onBeforeOpen?.(); openSearch() }}
        className="flex items-center justify-center gap-2 w-full p-2 text-sm font-medium text-foreground border border-foreground rounded-full hover:border-primary hover:text-primary transition-colors"
      >
        Buscar <Search className="w-4 h-4" />
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={openSearch}
      aria-label="Abrir busca"
      className="flex items-center gap-2 py-2 px-4 text-sm font-medium border border-gray rounded-full hover:border-primary text-primary transition-colors cursor-pointer"
    >
      Buscar
      <Search className="w-4 h-4" strokeWidth={2} />
    </button>
  )
}

export function Header({ lang }: { lang: Lang }) {
  const pathname        = usePathname()
  const [open, setOpen] = useState(false)
  const copy            = COPY[lang]
  const withSearch      = lang === 'pt-BR'

  return (
    <header className="w-full bg-surface border-b border-gray sticky top-0 z-9">
      <div className="container-xl flex items-center justify-between h-16">

        {/* ── Logo (texto) ──────────────────────────────────────── */}
        <Link
          href={copy.home}
          className="shrink-0 text-lg font-bold text-foreground"
          aria-label={copy.homeLabel}
          title={copy.homeLabel}
        >
          SEO <span className="text-primary">Técnico</span>
          <span className="hidden sm:inline text-sm font-normal text-muted">.dev.br</span>
        </Link>

        {/* ── Navegação desktop ─────────────────────────────────── */}
        <nav
          aria-label={copy.navLabel}
          className="hidden lg:flex items-center gap-3 xl:gap-6"
        >
          {copy.nav.map(({ label, href }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={[
                  'text-sm font-medium transition-colors p-2',
                  active
                    ? 'text-primary font-semibold'
                    : 'text-foreground hover:text-primary',
                ].join(' ')}
                aria-current={active ? 'page' : undefined}
                title={label}
              >
                {label}
              </Link>
            )
          })}
        </nav>

        {/* ── Ações desktop ─────────────────────────────────────── */}
        <div className="hidden lg:flex items-center gap-3">
          <LanguageLink
            lang={lang}
            className="p-2 text-sm font-medium text-foreground transition-colors hover:text-primary"
          />
          {withSearch && <SearchButton variant="desktop" />}
          <ThemeToggle lang={lang} />
        </div>

        {/* ── Ações mobile ──────────────────────────────────────── */}
        {/* O toggle fica fora do menu sanfonado de propósito: é a ação que o
            visitante mais quer achar rápido, e enterrá-la atrás do hambúrguer
            derrotaria o objetivo. */}
        <div className="flex items-center gap-1 lg:hidden">
          <ThemeToggle lang={lang} />
          <button
            type="button"
            className="p-2 text-foreground hover:text-primary transition-colors"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-label={open ? copy.closeMenu : copy.openMenu}
          >
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* ── Menu mobile ───────────────────────────────────────── */}
      {open && (
        <div className="lg:hidden border-t border-gray bg-surface w-full absolute z-9 top-16">
          <nav
            aria-label={copy.mobileNavLabel}
            className="container-xl flex flex-col py-5 gap-1"
          >
            {copy.nav.map(({ label, href }) => {
              const active = pathname === href
              return (
                <Link
                  key={href}
                  href={href}
                  className={[
                    'text-sm font-medium py-3 border-b border-gray transition-colors',
                    active ? 'text-primary font-semibold' : 'text-foreground hover:text-primary',
                  ].join(' ')}
                  aria-current={active ? 'page' : undefined}
                  onClick={() => setOpen(false)}
                  title={label}
                >
                  {label}
                </Link>
              )
            })}
            <LanguageLink
              lang={lang}
              className="text-sm font-medium py-3 border-b border-gray text-foreground transition-colors hover:text-primary"
            />

            {withSearch && (
              <div className="flex flex-col gap-3 pt-4">
                <SearchButton variant="mobile" onBeforeOpen={() => setOpen(false)} />
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
