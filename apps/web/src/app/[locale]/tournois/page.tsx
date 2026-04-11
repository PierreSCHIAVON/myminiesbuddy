import { getTranslations } from 'next-intl/server'
import { auth } from '@/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import Link from 'next/link'

interface Tournament {
  id: string
  name: string
  game: string
  location: string
  date: string
  currentPlayers: number
  maxPlayers: number
  description: string
}

export default async function TournamentsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ game?: string; search?: string }>
}) {
  const { locale } = await params
  const { game: gameFilter, search: searchQuery } = await searchParams
  const t = await getTranslations({ locale, namespace: 'tournaments' })

  // Fetch games for filter dropdown
  let gamesList: any[] = []
  try {
    const gamesResponse = await fetch(
      `${process.env.AUTH_URL || 'http://localhost:3000'}/api/games`,
      { cache: 'revalidate' }
    )
    if (gamesResponse.ok) {
      gamesList = await gamesResponse.json()
    }
  } catch (error) {
    console.error('Error fetching games:', error)
  }

  // Fetch tournaments
  let tournaments: Tournament[] = []
  try {
    const url = new URL(
      `${process.env.AUTH_URL || 'http://localhost:3000'}/api/tournaments`
    )
    if (gameFilter) url.searchParams.append('game', gameFilter)
    if (searchQuery) url.searchParams.append('search', searchQuery)

    const response = await fetch(url.toString(), { cache: 'revalidate' })
    if (response.ok) {
      tournaments = await response.json()
    }
  } catch (error) {
    console.error('Error fetching tournaments:', error)
  }

  // Separate upcoming and past tournaments
  const today = new Date()
  const upcoming = tournaments.filter((t) => new Date(t.date) >= today)
  const past = tournaments.filter((t) => new Date(t.date) < today)

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Header */}
      <section className="mb-12">
        <h1 className="text-4xl font-bold tracking-tighter mb-2">
          {t('title')}
        </h1>
        <p className="text-gray-400 text-lg">
          {t('upcomingTournaments')}
        </p>
      </section>

      {/* Search & Filters */}
      <section className="mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <Input
            placeholder={t('searchPlaceholder')}
            className="flex-1 bg-gray-900 border-gray-700"
            defaultValue={searchQuery || ''}
          />

      {/* Game Filter */}
          <select
            className="px-4 py-2 bg-gray-900 border border-gray-700 rounded-md text-foreground hover:border-gray-600 transition-colors"
            defaultValue={gameFilter || ''}
          >
            <option value="">{t('filterByGame')}</option>
            {gamesList.map((game: any) => (
              <option key={game.slug} value={game.slug}>
                {game.name}
              </option>
            ))}
          </select>

          {/* Create Tournament Button */}
          <Button className="bg-orange-600 hover:bg-orange-700 whitespace-nowrap">
            + {t('tournament')}
          </Button>
        </div>
      </section>

      {/* Upcoming Tournaments */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">
          {t('upcomingTournaments')} ({upcoming.length})
        </h2>

            {upcoming.map((tournament) => {
              const isFull = tournament.currentPlayers >= tournament.maxPlayers
              const spotsLeft = tournament.maxPlayers - tournament.currentPlayers

              return (
                <Card key={tournament.id} className="overflow-hidden hover:border-orange-600/50 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      {/* Tournament Info */}
                      <div className="flex-1">
                        <div className="flex items-start gap-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold mb-1">
                              {tournament.name}
                            </h3>
                            <p className="text-sm text-gray-400 mb-2">
                              {tournament.description}
                            </p>
                            <div className="flex flex-wrap gap-3 text-sm text-gray-400">
                              <span>
                                <span className="font-medium">{t('game')}:</span> {tournament.game}
                              </span>
                              <span>
                                <span className="font-medium">{t('location')}:</span> {tournament.location}
                              </span>
                              <span>
                                <span className="font-medium">{t('date')}:</span>{' '}
                                {new Date(tournament.date).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US')}
                              </span>
                            </div>
                          </div>

                          {/* Status Badge */}
                          <div className="text-right">
                            <div
                              className={`inline-block px-3 py-1 rounded-full text-sm font-semibold mb-2 ${
                                isFull
                                  ? 'bg-red-600/20 text-red-400'
                                  : 'bg-green-600/20 text-green-400'
                              }`}
                            >
                              {isFull ? t('full') : t('available')}
                            </div>
                            <p className="text-sm text-gray-400 mt-2">
                              {tournament.currentPlayers}/{tournament.maxPlayers} {t('places')}
                            </p>
                            {!isFull && (
                              <p className="text-xs text-gray-500 mt-1">
                                {spotsLeft} spot{spotsLeft > 1 ? 's' : ''} left
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Link href={`/${locale}/tournois/${tournament.id}`}>
                          <Button variant="outline">
                            {t('viewDetails')}
                          </Button>
                        </Link>
                        {!isFull && (
                          <Button className="bg-orange-600 hover:bg-orange-700">
                            {t('register')}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
      </section>

      {/* Past Tournaments */}
      {past.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold mb-6">
            {t('pastTournaments')} ({past.length})
          </h2>
          <div className="space-y-4">
            {past.map((tournament) => (
              <Card key={tournament.id} className="opacity-75">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-1 text-gray-300">
                        {tournament.name}
                      </h3>
                      <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                        <span>{tournament.game}</span>
                        <span>{tournament.location}</span>
                        <span>
                          {new Date(tournament.date).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US')}
                        </span>
                      </div>
                    </div>
                    <Button variant="outline" className="text-gray-400">
                      {t('viewDetails')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
