'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Fuse from 'fuse.js'
import { Search } from 'lucide-react'
import {
  fuseOptions,
  SEARCH_COPY,
  type SearchCategory,
  type SearchItem,
} from '@/lib/search-data'
import type { Lang } from '@/lib/hreflang'

interface BuscaResultsProps {
  /** Query inicial vinda do Server Component (searchParams.q) */
  initialQuery: string
  /** Índice montado no servidor (lib/search-index.ts), pelo mesmo motivo do modal. */
  items: SearchItem[]
  /** Idioma da página: textos e rota de resultados (/busca ou /en/search). */
  lang?: Lang
}

export function BuscaResults({ initialQuery, items, lang = 'pt-BR' }: BuscaResultsProps) {
  const copy         = SEARCH_COPY[lang]
  const router       = useRouter()
  const searchParams = useSearchParams()
  const debounceRef  = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sincroniza input com URL (para navegação back/forward e compartilhamento)
  // via ajuste de estado durante o render (padrão recomendado no lugar de
  // setState dentro de effect).
  const urlQuery = searchParams.get('q') ?? initialQuery
  const [query, setQuery] = useState(urlQuery)
  const [prevUrlQuery, setPrevUrlQuery] = useState(urlQuery)
  if (urlQuery !== prevUrlQuery) {
    setPrevUrlQuery(urlQuery)
    setQuery(urlQuery)
  }

  const fuse    = useMemo(() => new Fuse(items, fuseOptions), [items])
  const results = useMemo(() => {
    if (query.length < 2) return []
    return fuse.search(query)
  }, [fuse, query])

  // Atualiza URL com debounce de 300ms (bookmarkável, sem recarregar)
  const handleChange = useCallback((value: string) => {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams()
      if (value) params.set('q', value)
      router.replace(`${copy.path}${value ? `?${params}` : ''}`, { scroll: false })
    }, 300)
  }, [router, copy.path])

  // Agrupa resultados por categoria
  const grouped = useMemo(() => {
    const map = new Map<SearchCategory, typeof results>()
    results.forEach(r => {
      const cat = r.item.category
      if (!map.has(cat)) map.set(cat, [])
      map.get(cat)!.push(r)
    })
    return map
  }, [results])

  return (
    <div className="py-12">
      {/* Input de busca */}
      <div className="mb-10 flex max-w-xl items-center gap-3 border border-gray-control bg-surface px-5 py-3 transition-colors focus-within:border-primary">
        <Search className="h-5 w-5 shrink-0 text-muted" strokeWidth={2} aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={e => handleChange(e.target.value)}
          placeholder={copy.placeholder}
          className="flex-1 bg-transparent font-mono text-sm text-foreground outline-none placeholder:text-label"
          aria-label={copy.input}
          autoFocus
          autoComplete="off"
        />
      </div>

      {/* Resultados */}
      {query.length >= 2 ? (
        results.length > 0 ? (
          <div className="flex flex-col gap-10">
            {Array.from(grouped.entries()).map(([cat, hits]) => (
              <section key={cat}>
                <h2 className="eyebrow mb-4 text-primary">
                  {copy.categoryPlural[cat]}
                </h2>
                <ul className="flex flex-col gap-2">
                  {hits.map(({ item }) => (
                    <li key={item.id}>
                      <Link
                        href={item.href}
                        className="flex flex-col gap-1 border border-gray bg-surface p-4 transition-colors hover:border-primary"
                      >
                        <span className="text-sm font-semibold text-foreground">
                          {item.title}
                        </span>
                        <span className="text-xs text-muted">
                          {item.description}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">
            {copy.noResults} &ldquo;{query}&rdquo;.
          </p>
        )
      ) : (
        <p className="text-sm text-muted">
          {copy.minChars}.
        </p>
      )}
    </div>
  )
}
