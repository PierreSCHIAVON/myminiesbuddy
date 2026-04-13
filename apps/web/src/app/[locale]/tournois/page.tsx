import { getTranslations } from 'next-intl/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { prisma } from '@warforge/db'
import { TournamentListRegisterButton } from '@/components/tournament-list-register-button'

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

  let gamesList: { id: string; name: string; slug: string }[] = []
  let rawTournaments: any[] = []
  let filteredGameFactions: { id: string; name: string; group: string | null }[] = []

  try {
    const where: any = { status: 'OPEN' }
    if (gameFilter) where.game = { slug: gameFilter }
    if (searchQuery) where.OR = [
      { name: { contains: searchQuery, mode: 'insensitive' } },
      { location: { contains: searchQuery, mode: 'insensitive' } },
    ]

    const queries: [Promise<any>, Promise<any>, Promise<any>] = [
      prisma.game.findMany({ select: { id: true, name: true, slug: true }, orderBy: { name: 'asc' } }),
      prisma.tournament.findMany({
        where,
        include: { game: true, _count: { select: { players: true } } },
        orderBy: { date: 'asc' },
      }),
      // Charger les factions du jeu filtré seulement
      gameFilter
        ? prisma.faction.findMany({
            where: { game: { slug: gameFilter } },
            select: { id: true, name: true, group: true },
            orderBy: [{ group: 'asc' }, { name: 'asc' }],
          })
        : Promise.resolve([]),
    ]

    ;[gamesList, rawTournaments, filteredGameFactions] = await Promise.all(queries)
  } catch {
    // DB not available
  }

  const today = new Date()
  const upcoming = rawTournaments.filter((t: any) => new Date(t.date) >= today)
  const past = rawTournaments.filter((t: any) => new Date(t.date) < today)

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Header */}
      <section className="mb-10">
        <h1 className="text-4xl font-bold tracking-tighter mb-2">{t('title')}</h1>
        {gameFilter && gamesList.find((g) => g.slug === gameFilter) && (
          <p className="text-orange-500 font-semibold">
            {gamesList.find((g) => g.slug === gameFilter)?.name}
          </p>
        )}
      </section>

      {/* Search & Filters */}
      <section className="mb-8">
        <form
          key={`${gameFilter ?? ''}-${searchQuery ?? ''}`}
          method="GET"
          className="flex flex-col md:flex-row md:items-center gap-3"
        >
          <Input
            name="search"
            placeholder={t('searchPlaceholder')}
            className="flex-1 bg-gray-900 border-gray-700"
            defaultValue={searchQuery || ''}
          />

          <select
            name="game"
            className="px-4 py-2 bg-gray-900 border border-gray-700 rounded-md text-foreground hover:border-gray-600 transition-colors"
            defaultValue={gameFilter || ''}
          >
            <option value="">{t('filterByGame')}</option>
            {gamesList.map((game) => (
              <option key={game.slug} value={game.slug}>
                {game.name}
              </option>
            ))}
          </select>

          <Button type="submit" variant="outline" className="whitespace-nowrap">
            {t('filterApply')}
          </Button>

          {(gameFilter || searchQuery) && (
            <Link
              href={`/${locale}/tournois`}
              className="inline-flex items-center justify-center rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted whitespace-nowrap transition-colors"
            >
              ✕ {t('filterClear')}
            </Link>
          )}

          <Link
            href={`/${locale}/tournois/nouveau`}
            className="inline-flex items-center justify-center rounded-lg bg-orange-600 hover:bg-orange-700 px-4 py-2 text-sm font-medium text-white whitespace-nowrap transition-colors"
          >
            + {t('createTournament')}
          </Link>
        </form>
      </section>

      {/* Upcoming Tournaments */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">
          {t('upcomingTournaments')} ({upcoming.length})
        </h2>

        {upcoming.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-gray-700 rounded-xl">
            <p className="text-gray-400">{t('noTournamentsFound')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {upcoming.map((tournament: any) => {
              const isFull = tournament._count.players >= tournament.maxPlayers
              const spotsLeft = tournament.maxPlayers - tournament._count.players

              return (
                <Card key={tournament.id} className="overflow-hidden hover:border-orange-600/50 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-1">{tournament.name}</h3>
                        {tournament.description && (
                          <p className="text-sm text-gray-400 mb-2 line-clamp-2">{tournament.description}</p>
                        )}
                        <div className="flex flex-wrap gap-3 text-sm text-gray-400">
                          <span>
                            <span className="font-medium">{t('game')}:</span>{' '}
                            <Link
                              href={`/${locale}/jeux/${tournament.game.slug}`}
                              className="hover:text-orange-500 transition-colors"
                            >
                              {tournament.game.name}
                            </Link>
                          </span>
                          {tournament.location && (
                            <span>
                              <span className="font-medium">{t('location')}:</span> {tournament.location}
                            </span>
                          )}
                          <span>
                            <span className="font-medium">{t('date')}:</span>{' '}
                            {new Date(tournament.date).toLocaleDateString(
                              locale === 'fr' ? 'fr-FR' : 'en-US',
                              { day: 'numeric', month: 'long', year: 'numeric' }
                            )}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <div
                          className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            isFull ? 'bg-red-600/20 text-red-400' : 'bg-green-600/20 text-green-400'
                          }`}
                        >
                          {isFull ? t('full') : t('available')}
                        </div>
                        <p className="text-sm text-gray-400">
                          {tournament._count.players}/{tournament.maxPlayers} {t('places')}
                        </p>
                        {!isFull && (
                          <p className="text-xs text-gray-500">
                            {spotsLeft} {t('spotsLeft')}
                          </p>
                        )}
                        <div className="flex gap-2 mt-1">
                          <Link href={`/${locale}/tournois/${tournament.id}`}>
                            <Button variant="outline" size="sm">{t('viewDetails')}</Button>
                          </Link>
                          {!isFull && (
                            <TournamentListRegisterButton
                              tournamentId={tournament.id}
                              factions={filteredGameFactions}
                              label={t('register')}
                            />
                          )}
                        </div>
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
          <div className="space-y-3">
            {past.map((tournament: any) => (
              <Card key={tournament.id} className="opacity-60 hover:opacity-80 transition-opacity">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-300 truncate">{tournament.name}</h3>
                      <div className="flex gap-3 text-sm text-gray-500 mt-0.5">
                        <span>{tournament.game.name}</span>
                        {tournament.location && <span>{tournament.location}</span>}
                        <span>
                          {new Date(tournament.date).toLocaleDateString(
                            locale === 'fr' ? 'fr-FR' : 'en-US',
                            { day: 'numeric', month: 'long', year: 'numeric' }
                          )}
                        </span>
                      </div>
                    </div>
                    <Link href={`/${locale}/tournois/${tournament.id}`}>
                      <Button variant="outline" size="sm" className="text-gray-400 shrink-0">
                        {t('viewDetails')}
                      </Button>
                    </Link>
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
