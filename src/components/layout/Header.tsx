'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Search, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { site } from '@/lib/site'
import { useSearchModal } from '@/components/search/SearchContext'

const navLinks = [
  { label: 'Guia',        href: '/guia/seo-tecnico-nextjs' },
  { label: 'Blog',        href: '/blog' },
  { label: 'Ferramentas', href: '/ferramentas' },
  { label: 'Sobre',       href: '/sobre' },
]

export function Header() {
  const pathname        = usePathname()
  const [open, setOpen] = useState(false)
  const { openSearch }  = useSearchModal()

  return (
    <header className="w-full bg-white border-b border-gray sticky top-0 z-9">
      <div className="container-xl flex items-center justify-between h-16">

        {/* ── Logo (texto) ──────────────────────────────────────── */}
        <Link
          href="/"
          className="shrink-0 text-lg font-bold text-foreground"
          aria-label={`${site.name} — página inicial`}
          title={`${site.name} — página inicial`}
        >
          SEO <span className="text-primary">Técnico</span>
          <span className="hidden sm:inline text-sm font-normal text-muted">.dev.br</span>
        </Link>

        {/* ── Navegação desktop ─────────────────────────────────── */}
        <nav
          aria-label="Navegação principal"
          className="hidden lg:flex items-center gap-3 xl:gap-6"
        >
          {navLinks.map(({ label, href }) => {
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
        <div className="hidden lg:flex items-center">
          <button
            type="button"
            onClick={openSearch}
            aria-label="Abrir busca"
            className="flex items-center gap-2 py-2 px-4 text-sm font-medium border border-gray rounded-full hover:border-primary text-primary transition-colors cursor-pointer"
          >
            Buscar
            <Search className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>

        {/* ── Hambúrguer mobile ─────────────────────────────────── */}
        <button
          type="button"
          className="lg:hidden p-2 text-foreground hover:text-primary transition-colors"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-label={open ? 'Fechar menu' : 'Abrir menu'}
        >
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* ── Menu mobile ───────────────────────────────────────── */}
      {open && (
        <div className="lg:hidden border-t border-gray bg-white w-full absolute z-9 top-16">
          <nav
            aria-label="Navegação mobile"
            className="container-xl flex flex-col py-5 gap-1"
          >
            {navLinks.map(({ label, href }) => {
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

            <div className="flex flex-col gap-3 pt-4">
              <button
                type="button"
                onClick={() => { setOpen(false); openSearch() }}
                className="flex items-center justify-center gap-2 w-full p-2 text-sm font-medium text-foreground border border-foreground rounded-full hover:border-primary hover:text-primary transition-colors"
              >
                Buscar <Search className="w-4 h-4" />
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
