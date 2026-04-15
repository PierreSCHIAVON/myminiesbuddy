'use client'

import { useRouter } from 'next/navigation'

interface Props {
  locale: string
  currentGame: string | undefined
  currentRegion: string | undefined
  userCountry: string | null
  labels: {
    world: string
    europe: string
    myCountry: string
    loginRequired: string
  }
  countryName: string | null
}

export function RankingsGeoFilter({ locale, currentGame, currentRegion, userCountry, labels, countryName }: Props) {
  const router = useRouter()

  function go(region: string | null) {
    const params = new URLSearchParams()
    if (currentGame) params.set('game', currentGame)
    if (region) params.set('region', region)
    const qs = params.toString()
    router.push(`/${locale}/rankings${qs ? `?${qs}` : ''}`)
  }

  const tabs = [
    { id: 'world', label: labels.world },
    { id: 'europe', label: labels.europe },
    {
      id: userCountry ?? 'country',
      label: userCountry && countryName ? countryName : labels.myCountry,
      disabled: !userCountry,
      title: !userCountry ? labels.loginRequired : undefined,
    },
  ]

  const active = currentRegion ?? 'world'

  return (
    <div className="flex gap-1 p-1 rounded-lg bg-gray-900/60 border border-gray-800 w-fit">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => !tab.disabled && go(tab.id === 'world' ? null : tab.id)}
          disabled={tab.disabled}
          title={tab.title}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
            active === tab.id
              ? 'bg-orange-600 text-white'
              : tab.disabled
              ? 'text-gray-600 cursor-not-allowed'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
