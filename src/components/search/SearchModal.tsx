'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Fuse from 'fuse.js'
import { Search, X, ArrowRight } from 'lucide-react'
import { fuseOptions, categoryLabel, type SearchItem } from '@/lib/search-data'
import { useSearchModal } from './SearchContext'

const MAX_MODAL_RESULTS = 6

interface SearchModalProps {
  /**
   * Índice montado no servidor (lib/search-index.ts). Chega por prop porque a
   * derivação lê /content com `fs`, o que não existe no cliente.
   */
  items: SearchItem[]
}

export function SearchModal({ items }: SearchModalProps) {
  const { isOpen, closeSearch }         = useSearchModal()
  const router                          = useRouter()
  const dialogRef                       = useRef<HTMLDialogElement>(null)
  const inputRef                        = useRef<HTMLInputElement>(null)
  const [query, setQuery]               = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [activeIndex, setActiveIndex]   = useState(-1)

  // Instância única do Fuse (não recriada a cada render)
  const fuse = useMemo(() => new Fuse(items, fuseOptions), [items])

  // Resultados com debounce de 150ms
  const results = useMemo(() => {
    if (debouncedQuery.length < 2) return []
    return fuse.search(debouncedQuery).slice(0, MAX_MODAL_RESULTS)
  }, [fuse, debouncedQuery])

  // Debounce do input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 150)
    return () => clearTimeout(t)
  }, [query])

  // Limpa o estado ao fechar — ajuste de estado durante o render
  // (padrão recomendado no lugar de setState dentro de effect)
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen)
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen)
    if (!isOpen) {
      setQuery('')
      setDebouncedQuery('')
      setActiveIndex(-1)
    }
  }

  // Abre / fecha o <dialog> nativo via ref
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (isOpen) {
      dialog.showModal()
      document.body.style.overflow = 'hidden'
      // Focus após showModal() para garantir funcionamento cross-browser
      setTimeout(() => inputRef.current?.focus(), 0)
    } else {
      if (dialog.open) dialog.close()
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Sincroniza evento nativo "close" (Escape) com o contexto
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    dialog.addEventListener('close', closeSearch)
    return () => dialog.removeEventListener('close', closeSearch)
  }, [closeSearch])

  // Navegação por teclado nos resultados
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!results.length) return
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIndex(i => (i + 1) % results.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIndex(i => (i - 1 + results.length) % results.length)
      } else if (e.key === 'Enter' && activeIndex >= 0) {
        e.preventDefault()
        const item = results[activeIndex]?.item
        if (item) { router.push(item.href); closeSearch() }
      }
    },
    [results, activeIndex, router, closeSearch],
  )

  const activeResultId = activeIndex >= 0
    ? `sr-${results[activeIndex]?.item.id}`
    : undefined

  return (
    <dialog
      ref={dialogRef}
      className="search-dialog"
      aria-label="Busca"
    >
      {/* Overlay full-screen — captura cliques fora da caixa branca */}
      <div
        className="fixed inset-0 flex items-start justify-center pt-[72px] px-4"
        onClick={closeSearch}
        aria-hidden="true"
      >
      {/* Caixa branca — stopPropagation evita fechar ao clicar dentro */}
      <div
        className="w-full max-w-3xl overflow-hidden border border-gray-strong border-t-2 border-t-primary bg-surface"
        onClick={e => e.stopPropagation()}
      >
        {/* ── Cabeçalho com input ──────────────────────────────── */}
        <div className="flex items-center gap-3 border-b border-gray px-6 py-5">
          <Search className="w-5 h-5 text-primary shrink-0" strokeWidth={2} />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={e => { setQuery(e.target.value); setActiveIndex(-1) }}
            onKeyDown={handleKeyDown}
            placeholder="Buscar artigos, ferramentas, páginas..."
            className="flex-1 bg-transparent font-mono text-base text-foreground outline-none placeholder:text-label"
            aria-label="Campo de busca"
            aria-autocomplete="list"
            aria-controls="search-results-list"
            aria-activedescendant={activeResultId}
            autoComplete="off"
          />
          <button
            type="button"
            onClick={closeSearch}
            className="p-1.5 text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
            aria-label="Fechar busca"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Resultados ──────────────────────────────────────── */}
        {debouncedQuery.length >= 2 && (
          <div id="search-results-list" role="listbox">
            {results.length > 0 ? (
              <>
                <ul>
                  {results.map(({ item }, index) => {
                    const active = index === activeIndex
                    return (
                      <li
                        key={item.id}
                        id={`sr-${item.id}`}
                        role="option"
                        aria-selected={active}
                      >
                        <Link
                          href={item.href}
                          onClick={closeSearch}
                          className={[
                            'flex items-start gap-4 px-5 py-3.5 transition-colors',
                            active ? 'bg-surface-2' : 'hover:bg-surface-2',
                          ].join(' ')}
                        >
                          <span className="search-chip mt-0.5 shrink-0 border border-primary px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-primary">
                            {categoryLabel[item.category]}
                          </span>
                          <span className="flex flex-col min-w-0">
                            <span className={`text-sm font-semibold ${active ? 'text-primary' : 'text-foreground'}`}>
                              {item.title}
                            </span>
                            <span className="truncate text-xs text-muted">
                              {item.description}
                            </span>
                          </span>
                        </Link>
                      </li>
                    )
                  })}
                </ul>

                {/* Link para página completa */}
                <div className="border-t border-gray px-5 py-3">
                  <Link
                    href={`/busca?q=${encodeURIComponent(debouncedQuery)}`}
                    onClick={closeSearch}
                    className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.1em] text-primary transition-colors hover:text-primary-hover"
                  >
                    Ver todos os resultados para &ldquo;{debouncedQuery}&rdquo;
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </>
            ) : (
              <div className="px-5 py-10 text-center text-sm text-muted">
                Nenhum resultado encontrado para &ldquo;{debouncedQuery}&rdquo;
              </div>
            )}
          </div>
        )}

        {/* Estado vazio (antes de digitar) */}
        {debouncedQuery.length < 2 && (
          <div className="px-5 py-8 text-center font-mono text-xs uppercase tracking-[0.1em] text-label">
            Digite ao menos 2 caracteres para buscar
          </div>
        )}
      </div>
      </div>
    </dialog>
  )
}
