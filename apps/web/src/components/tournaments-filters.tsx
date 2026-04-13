'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useRef } from 'react'
import { Input } from '@/components/ui/input'
import Link from 'next/link'

interface TournamentsFiltersProps {
  locale: string
  games: { id: string; name: string; slug: string }[]
  currentSearch?: string
  currentGame?: string
  createLabel: string
  searchPlaceholder: string
  filterByGameLabel: string
  filterClearLabel: string
}

export function TournamentsFilters({
  locale,
  games,
  currentSearch,
  currentGame,
  createLabel,
  searchPlaceholder,
  filterByGameLabel,
  filterClearLabel,
}: TournamentsFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function buildUrl(search: string, game: string) {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (game) params.set('game', game)
    const qs = params.toString()
    return qs ? `${pathname}?${qs}` : pathname
  }

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      router.push(buildUrl(value, currentGame ?? ''))
    }, 300)
  }

  function handleGameChange(e: React.ChangeEvent<HTMLSelectElement>) {
    router.push(buildUrl(currentSearch ?? '', e.target.value))
  }

  const hasFilter = !!(currentSearch || currentGame)

  return (
    <div className="flex flex-col md:flex-row md:items-center gap-3">
      <Input
        name="search"
        placeholder={searchPlaceholder}
        className="flex-1 bg-gray-900 border-gray-700"
        defaultValue={currentSearch || ''}
        onChange={handleSearchChange}
      />

      <select
        name="game"
        className="px-4 py-2 bg-gray-900 border border-gray-700 rounded-md text-foreground hover:border-gray-600 transition-colors"
        defaultValue={currentGame || ''}
        onChange={handleGameChange}
      >
        <option value="">{filterByGameLabel}</option>
        {games.map((game) => (
          <option key={game.slug} value={game.slug}>
            {game.name}
          </option>
        ))}
      </select>

      {hasFilter && (
        <Link
          href={`/${locale}/tournois`}
          className="inline-flex items-center justify-center rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted whitespace-nowrap transition-colors"
        >
          ✕ {filterClearLabel}
        </Link>
      )}

      <Link
        href={`/${locale}/tournois/nouveau`}
        className="inline-flex items-center justify-center rounded-lg bg-orange-600 hover:bg-orange-700 px-4 py-2 text-sm font-medium text-white whitespace-nowrap transition-colors"
      >
        + {createLabel}
      </Link>
    </div>
  )
}
