'use client'

import dynamic from 'next/dynamic'

const TournamentMap = dynamic(
  () => import('./tournament-map').then((m) => m.TournamentMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-56 rounded-xl bg-gray-900 border border-gray-800 animate-pulse" />
    ),
  }
)

interface Props {
  lat: number
  lng: number
  label: string
}

export function TournamentMapLoader({ lat, lng, label }: Props) {
  return <TournamentMap lat={lat} lng={lng} label={label} />
}
