'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Fuse from 'fuse.js'
import { Search, X, ArrowRight } from 'lucide-react'
import { searchData, fuseOptions, categoryLabel } from '@/lib/search-data'
import { useSearchModal } from './SearchContext'

const MAX_MODAL_RESULTS = 6

export function SearchModal() {
  const { isOpen, closeSearch }         = useSearchModal()
  const router                          = useRouter()
  const dialogRef                       = useRef<HTMLDialogElement>(null)
  const inputRef                        = useRef<HTMLInputElement>(null)
  const [query, setQuery]               = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [activeIndex, setActiveIndex]   = useState(-1)

  // Instância única do Fuse (não recriada a cada render)
  const fuse = useMemo(() => new Fuse(searchData, fuseOptions), [])

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
        className="bg-surface rounded-b-2xl w-full max-w-3xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* ── Cabeçalho com input ──────────────────────────────── */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
          <Search className="w-5 h-5 text-primary shrink-0" strokeWidth={2} />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={e => { setQuery(e.target.value); setActiveIndex(-1) }}
            onKeyDown={handleKeyDown}
            placeholder="Buscar artigos, ferramentas, páginas..."
            className="flex-1 text-base text-foreground placeholder:text-gray-400 outline-none bg-transparent"
            aria-label="Campo de busca"
            aria-autocomplete="list"
            aria-controls="search-results-list"
            aria-activedescendant={activeResultId}
            autoComplete="off"
          />
          <button
            type="button"
            onClick={closeSearch}
            className="p-1.5 rounded-lg text-gray-400 hover:text-foreground hover:bg-surface-2 transition-colors"
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
                            active ? 'bg-primary/10' : 'hover:bg-surface-2',
                          ].join(' ')}
                        >
                          <span className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/10 rounded px-1.5 py-0.5 shrink-0">
                            {categoryLabel[item.category]}
                          </span>
                          <span className="flex flex-col min-w-0">
                            <span className={`text-sm font-semibold ${active ? 'text-primary' : 'text-foreground'}`}>
                              {item.title}
                            </span>
                            <span className="text-xs text-gray-500 truncate">
                              {item.description}
                            </span>
                          </span>
                        </Link>
                      </li>
                    )
                  })}
                </ul>

                {/* Link para página completa */}
                <div className="border-t border-gray-100 px-5 py-3">
                  <Link
                    href={`/busca?q=${encodeURIComponent(debouncedQuery)}`}
                    onClick={closeSearch}
                    className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary-dark transition-colors"
                  >
                    Ver todos os resultados para &ldquo;{debouncedQuery}&rdquo;
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </>
            ) : (
              <div className="px-5 py-10 text-center text-sm text-gray-500">
                Nenhum resultado encontrado para &ldquo;{debouncedQuery}&rdquo;
              </div>
            )}
          </div>
        )}

        {/* Estado vazio (antes de digitar) */}
        {debouncedQuery.length < 2 && (
          <div className="px-5 py-8 text-center text-sm text-gray-400">
            Digite ao menos 2 caracteres para buscar
          </div>
        )}
      </div>
      </div>
    </dialog>
  )
}
