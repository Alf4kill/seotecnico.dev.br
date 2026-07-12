'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Fuse from 'fuse.js'
import { Search } from 'lucide-react'
import { searchData, fuseOptions, categoryLabel, type SearchCategory } from '@/lib/search-data'

interface BuscaResultsProps {
  /** Query inicial vinda do Server Component (searchParams.q) */
  initialQuery: string
}

export function BuscaResults({ initialQuery }: BuscaResultsProps) {
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

  const fuse    = useMemo(() => new Fuse(searchData, fuseOptions), [])
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
      router.replace(`/busca${value ? `?${params}` : ''}`, { scroll: false })
    }, 300)
  }, [router])

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
      <div className="flex items-center gap-3 border border-gray-200 rounded-full px-5 py-3 bg-white shadow-sm focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all mb-10 max-w-xl">
        <Search className="w-5 h-5 text-gray-400 shrink-0" strokeWidth={2} />
        <input
          type="search"
          value={query}
          onChange={e => handleChange(e.target.value)}
          placeholder="Buscar artigos, ferramentas, páginas..."
          className="flex-1 text-sm text-foreground placeholder:text-gray-400 outline-none bg-transparent"
          aria-label="Campo de busca"
          autoFocus
          autoComplete="off"
        />
      </div>

      {/* Resultados */}
      {query.length >= 2 ? (
        results.length > 0 ? (
          <div className="flex flex-col gap-10">
            {Array.from(grouped.entries()).map(([cat, items]) => (
              <section key={cat}>
                <h2 className="text-xs font-bold uppercase tracking-widest text-primary mb-4">
                  {categoryLabel[cat]}s
                </h2>
                <ul className="flex flex-col gap-2">
                  {items.map(({ item }) => (
                    <li key={item.id}>
                      <Link
                        href={item.href}
                        className="flex flex-col gap-1 p-4 rounded-xl border border-gray-100 bg-white hover:border-primary hover:shadow-sm transition-all"
                      >
                        <span className="text-sm font-semibold text-foreground">
                          {item.title}
                        </span>
                        <span className="text-xs text-gray-500">
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
          <p className="text-sm text-gray-500">
            Nenhum resultado encontrado para &ldquo;{query}&rdquo;.
          </p>
        )
      ) : (
        <p className="text-sm text-gray-400">
          Digite ao menos 2 caracteres para buscar.
        </p>
      )}
    </div>
  )
}
