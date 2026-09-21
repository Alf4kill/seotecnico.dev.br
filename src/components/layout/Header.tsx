'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Search, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { site } from '@/lib/site'
import { counterpartPath, type Lang } from '@/lib/hreflang'
import { useSearchModal } from '@/components/search/SearchContext'

// ─────────────────────────────────────────────────────────────────────────────
// Header de um root layout. Recebe o idioma do layout (ver RootShell) e nunca
// o deduz da URL: a moldura é do documento, não da rota.
//
// A moldura inglesa tem só destinos em inglês. Linkar páginas em português a
// partir dela era exatamente o defeito que ela existe para corrigir — um
// recrutador que clica em qualquer coisa não pode ser despejado noutro idioma.
//
// Visual: barra de instrumento — marca em grotesca, navegação em mono
// caixa-alta, item ativo sublinhado em ciano (docs/design-system.md).
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
const SWITCH: Record<Lang, { code: string; label: string; page: string; site: string; home: string }> = {
  'pt-BR': {
    code: 'PT',
    label: 'Português',
    page: 'Ler esta página em português',
    site: 'Versão do site em português',
    home: '/',
  },
  en: {
    code: 'EN',
    label: 'English',
    page: 'Read this page in English',
    site: 'English version of the site',
    home: '/en',
  },
}

/** Seção ativa: a rota exata ou qualquer página dentro dela (/blog/x → Blog). */
function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`)
}

/**
 * Link para o outro idioma. Aponta para a tradução da página atual quando ela
 * existe — o mesmo mapa que gera o hreflang, então link visível e declaração
 * para o Google não divergem — e, quando não existe, para a home do outro
 * idioma. Nunca para lugar nenhum.
 */
function LanguageLink({ lang, className, children }: { lang: Lang; className: string; children?: React.ReactNode }) {
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
      {children ?? copy.label}
    </Link>
  )
}

/**
 * Seletor PT/EN segmentado: o idioma atual cheio de ciano, o outro é o link.
 * O nome acessível do link é o idioma por extenso — "EN" sozinho é sigla.
 */
function LanguageToggle({ lang }: { lang: Lang }) {
  const other: Lang = lang === 'en' ? 'pt-BR' : 'en'
  const segment = 'flex items-center px-3.5 font-mono text-xs font-semibold tracking-[0.1em]'
  const current = <span className={`${segment} bg-primary text-on-primary`}>{SWITCH[lang].code}</span>
  const link = (
    <LanguageLink lang={lang} className={`${segment} text-muted transition-colors hover:text-foreground`}>
      <span aria-hidden="true">{SWITCH[other].code}</span>
      <span className="sr-only">{SWITCH[other].label}</span>
    </LanguageLink>
  )
  return (
    <div className="flex h-11 border border-gray">
      {lang === 'pt-BR' ? <>{current}{link}</> : <>{link}{current}</>}
    </div>
  )
}

/**
 * O botão de busca é um componente à parte porque `useSearchModal` exige o
 * SearchProvider, que só a moldura portuguesa monta. Um hook não pode ser
 * chamado condicionalmente; um componente pode ser renderizado condicionalmente.
 *
 * Tem cara de campo ("buscar…"), mas é botão: abre o modal, que é onde a
 * busca de verdade acontece (e o atalho Ctrl/⌘+K também leva até ele).
 */
function SearchButton({ variant, onBeforeOpen }: { variant: 'desktop' | 'mobile'; onBeforeOpen?: () => void }) {
  const { openSearch } = useSearchModal()

  if (variant === 'mobile') {
    return (
      <button
        type="button"
        onClick={() => { onBeforeOpen?.(); openSearch() }}
        aria-label="Abrir busca"
        className="flex h-11 w-11 items-center justify-center text-foreground transition-colors hover:text-primary"
      >
        <Search className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={openSearch}
      aria-label="Abrir busca"
      className="flex h-11 w-52 items-center justify-between border border-gray-control bg-surface px-3.5 font-mono text-[0.8125rem] text-muted transition-colors hover:border-primary hover:text-foreground"
    >
      buscar…
      <Search className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
    </button>
  )
}

export function Header({ lang }: { lang: Lang }) {
  const pathname        = usePathname()
  const [open, setOpen] = useState(false)
  const copy            = COPY[lang]
  const withSearch      = lang === 'pt-BR'

  return (
    <header className="sticky top-0 z-9 w-full border-b border-gray bg-background">
      <div className="container-xl flex h-16 items-center justify-between gap-6 lg:h-19">

        {/* ── Marca ─────────────────────────────────────────────── */}
        <Link
          href={copy.home}
          className="flex shrink-0 items-baseline gap-2.5"
          aria-label={copy.homeLabel}
          title={copy.homeLabel}
        >
          <span className="font-display text-[1.1875rem] font-bold uppercase tracking-[-0.01em] text-foreground">
            SEO Técnico
          </span>
          <span className="font-mono text-[0.6875rem] tracking-[0.14em] text-primary">.DEV.BR</span>
        </Link>

        {/* ── Navegação desktop ─────────────────────────────────── */}
        <nav aria-label={copy.navLabel} className="hidden items-center gap-8 lg:flex">
          {copy.nav.map(({ label, href }) => {
            const active = isActive(pathname, href)
            return (
              <Link
                key={href}
                href={href}
                className={[
                  'border-b-2 py-1 font-mono text-xs uppercase tracking-[0.12em] transition-colors',
                  active
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted hover:text-foreground',
                ].join(' ')}
                aria-current={pathname === href ? 'page' : undefined}
                title={label}
              >
                {label}
              </Link>
            )
          })}
        </nav>

        {/* ── Ações desktop ─────────────────────────────────────── */}
        <div className="hidden items-center gap-4 lg:flex">
          {withSearch && <SearchButton variant="desktop" />}
          <LanguageToggle lang={lang} />
        </div>

        {/* ── Ações mobile ──────────────────────────────────────── */}
        <div className="flex items-center gap-1 lg:hidden">
          {withSearch && <SearchButton variant="mobile" />}
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center text-foreground transition-colors hover:text-primary"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-label={open ? copy.closeMenu : copy.openMenu}
          >
            {open ? <X className="h-6 w-6" aria-hidden="true" /> : <Menu className="h-6 w-6" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {/* ── Menu mobile ───────────────────────────────────────── */}
      {open && (
        <div className="absolute top-16 z-9 w-full border-b border-gray bg-background lg:hidden">
          <nav aria-label={copy.mobileNavLabel} className="container-xl flex flex-col py-4">
            {copy.nav.map(({ label, href }) => {
              const active = isActive(pathname, href)
              return (
                <Link
                  key={href}
                  href={href}
                  className={[
                    'flex min-h-12 items-center border-b border-gray font-mono text-[0.8125rem] uppercase tracking-[0.12em] transition-colors',
                    active ? 'text-primary' : 'text-foreground hover:text-primary',
                  ].join(' ')}
                  aria-current={pathname === href ? 'page' : undefined}
                  onClick={() => setOpen(false)}
                  title={label}
                >
                  {label}
                </Link>
              )
            })}
            <LanguageLink
              lang={lang}
              className="flex min-h-12 items-center font-mono text-[0.8125rem] uppercase tracking-[0.12em] text-muted transition-colors hover:text-primary"
            />
          </nav>
        </div>
      )}
    </header>
  )
}
