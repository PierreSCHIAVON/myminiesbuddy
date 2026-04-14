'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

interface UserResult {
  id: string
  name: string | null
  email: string
}

interface Props {
  tournamentId: string
  onSelect: (user: UserResult) => void
  placeholder?: string
  disabled?: boolean
}

export function PlayerSearch({ tournamentId, onSelect, placeholder = 'Rechercher un joueur...', disabled }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<UserResult[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); setOpen(false); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(q)}&tournamentId=${tournamentId}`)
      if (res.ok) {
        const data = await res.json()
        setResults(data)
        setOpen(data.length > 0)
      }
    } catch {
      // silencieux
    } finally {
      setLoading(false)
    }
  }, [tournamentId])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setQuery(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(val), 300)
  }

  function handleSelect(user: UserResult) {
    setQuery('')
    setResults([])
    setOpen(false)
    onSelect(user)
  }

  // Fermer la liste au clic extérieur
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-600/50 focus:border-orange-600/50 disabled:opacity-50 transition-colors"
          autoComplete="off"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-3.5 h-3.5 border-2 border-gray-600 border-t-orange-500 rounded-full animate-spin" />
          </div>
        )}
      </div>

      {open && results.length > 0 && (
        <ul className="absolute z-50 top-full left-0 right-0 mt-1 bg-gray-900 border border-gray-700 rounded-lg shadow-xl overflow-hidden">
          {results.map((user) => (
            <li key={user.id}>
              <button
                type="button"
                onClick={() => handleSelect(user)}
                className="w-full px-3 py-2.5 text-left hover:bg-gray-800 transition-colors flex items-center gap-3"
              >
                <div className="w-7 h-7 rounded-full bg-orange-600/20 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-orange-400">
                    {(user.name ?? user.email).charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{user.name ?? '—'}</p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      {open && results.length === 0 && query.length >= 2 && !loading && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-500">
          Aucun joueur trouvé
        </div>
      )}
    </div>
  )
}
