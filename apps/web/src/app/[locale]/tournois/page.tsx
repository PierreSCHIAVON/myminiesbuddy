import { getTranslations } from 'next-intl/server'
import { auth } from '@/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

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

// Mock data - will be replaced with real data from API/database
const mockTournaments: Tournament[] = [
  {
    id: '1',
    name: "L'Alliance 40K - Avril 2026",
    game: 'Warhammer 40K',
    location: 'Fressain',
    date: '2026-04-26',
    currentPlayers: 17,
    maxPlayers: 16,
    description: 'Tournoi compétitif Warhammer 40K edition 10th. Swiss pairing, 3 rondes.',
  },
  {
    id: '2',
    name: 'Doublette 40K à Utopolys',
    game: 'Warhammer 40K',
    location: 'Mons En Baroeul',
    date: '2026-04-26',
    currentPlayers: 24,
    maxPlayers: 24,
    description: 'Tournoi en doublettes. Format amusant pour équipes de 2.',
  },
  {
    id: '3',
    name: 'Underground 13',
    game: 'Warhammer Age of Sigmar',
    location: 'Domérat',
    date: '2026-04-26',
    currentPlayers: 13,
    maxPlayers: 24,
    description: 'Tournoi Age of Sigmar 4ème edition. Ambiance narrative.',
  },
  {
    id: '4',
    name: 'Convention Bolt Action',
    game: 'Bolt Action',
    location: 'La Garde',
    date: '2026-04-26',
    currentPlayers: 8,
    maxPlayers: 8,
    description: 'WWII tabletop gaming convention. Multiple game systems.',
  },
  {
    id: '5',
    name: 'Clash of Charnay III',
    game: 'Kings of War',
    location: 'Charnay-Lès-Mâcon',
    date: '2026-06-06',
    currentPlayers: 8,
    maxPlayers: 16,
    description: 'Fantasy battle tournament. Kings of War 3rd edition.',
  },
  {
    id: '6',
    name: 'La boucherie',
    game: 'Warhammer Age of Sigmar',
    location: 'Ustaritz',
    date: '2026-05-16',
    currentPlayers: 0,
    maxPlayers: 18,
    description: 'AoS compétitif. Points de classement en jeu.',
  },
]

const gamesList = [
  'Warhammer 40K',
  'Warhammer Age of Sigmar',
  'Warhammer: The Old World',
  'Bolt Action',
  'Kings of War',
  'Warmachine',
  'Infinity',
  'Blood Bowl',
  'SAGA',
  'Star Wars: Legion',
]

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

  // Filter tournaments based on search and game
  let filtered = mockTournaments
  if (gameFilter) {
    filtered = filtered.filter((t) => t.game === gameFilter)
  }
  if (searchQuery) {
    filtered = filtered.filter(
      (t) =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.location.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }

  // Separate upcoming and past tournaments
  const today = new Date()
  const upcoming = filtered.filter((t) => new Date(t.date) >= today)
  const past = filtered.filter((t) => new Date(t.date) < today)

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
            {gamesList.map((game) => (
              <option key={game} value={game}>
                {game}
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

        {upcoming.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-400">
              {t('noTournaments')}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
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
                        <Button variant="outline">
                          {t('viewDetails')}
                        </Button>
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
          </div>
        )}
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
