'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

interface SearchContextValue {
  isOpen:      boolean
  openSearch:  () => void
  closeSearch: () => void
}

const SearchContext = createContext<SearchContextValue | null>(null)

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  const openSearch  = useCallback(() => setIsOpen(true),  [])
  const closeSearch = useCallback(() => setIsOpen(false), [])

  // Atalho global Ctrl+K / Cmd+K
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        openSearch()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [openSearch])

  return (
    <SearchContext.Provider value={{ isOpen, openSearch, closeSearch }}>
      {children}
    </SearchContext.Provider>
  )
}

export function useSearchModal() {
  const ctx = useContext(SearchContext)
  if (!ctx) throw new Error('useSearchModal deve ser usado dentro de SearchProvider')
  return ctx
}
