'use client'

import { useRouter, usePathname } from 'next/navigation'

interface Props {
  games: { id: string; name: string; slug: string }[]
  currentGame: string | undefined
  allLabel: string
  locale: string
}

export function RankingsGameFilter({ games, currentGame, allLabel, locale }: Props) {
  const router = useRouter()

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const slug = e.target.value
    router.push(slug ? `/${locale}/rankings?game=${slug}` : `/${locale}/rankings`)
  }

  return (
    <select
      value={currentGame ?? ''}
      onChange={handleChange}
      className="bg-gray-900 border border-gray-700 text-sm text-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500 min-w-48"
    >
      <option value="">{allLabel}</option>
      {games.map((game) => (
        <option key={game.slug} value={game.slug}>
          {game.name}
        </option>
      ))}
    </select>
  )
}
