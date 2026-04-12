import { getTranslations } from 'next-intl/server'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import Image from 'next/image'
import { prisma } from '@warforge/db'
import { TournamentListRegisterButton } from '@/components/tournament-list-register-button'
import { notFound } from 'next/navigation'

export default async function GameDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  const t = await getTranslations({ locale, namespace: 'games' })
  const tT = await getTranslations({ locale, namespace: 'tournaments' })

  let game: {
    id: string
    name: string
    slug: string
    abbreviation: string | null
    description: string | null
    logoUrl: string | null
    factions: { id: string; name: string; slug: string; group: string | null }[]
    tournaments: {
      id: string
      name: string
      description: string | null
      location: string | null
      date: Date
      maxPlayers: number
      status: string
      format: string
      pointsLimit: number | null
      _count: { players: number }
    }[]
  } | null = null

  try {
    game = await prisma.game.findUnique({
      where: { slug },
      include: {
        factions: {
          orderBy: [{ group: 'asc' }, { name: 'asc' }],
        },
        tournaments: {
          where: { status: 'OPEN' },
          include: { _count: { select: { players: true } } },
          orderBy: { date: 'asc' },
        },
      },
    })
  } catch {
    // DB not available
  }

  if (!game) return notFound()

  // Grouper les factions par groupe
  const factionGroups = game.factions.reduce<Record<string, typeof game.factions>>(
    (acc, faction) => {
      const group = faction.group ?? t('otherFactions')
      if (!acc[group]) acc[group] = []
      acc[group].push(faction)
      return acc
    },
    {}
  )

  const today = new Date()
  const upcoming = game.tournaments.filter((t) => t.date >= today)
  const past = game.tournaments.filter((t) => t.date < today)

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Breadcrumb */}
      <Link
        href={`/${locale}/jeux`}
        className="text-sm text-gray-400 hover:text-orange-500 transition-colors inline-flex items-center gap-1 mb-8"
      >
        ← {t('backToGames')}
      </Link>

      {/* Hero */}
      <section className="mb-12">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Logo */}
          <div className="shrink-0 w-32 h-32 md:w-48 md:h-48 relative rounded-xl overflow-hidden bg-gray-800 border border-border flex items-center justify-center">
            {game.logoUrl ? (
              <Image
                src={game.logoUrl}
                alt={game.name}
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <span className="text-5xl font-bold text-gray-600 select-none">
                {game.abbreviation ?? game.name.charAt(0)}
              </span>
            )}
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl font-bold tracking-tighter">{game.name}</h1>
              {game.abbreviation && (
                <span className="px-2 py-0.5 rounded bg-orange-600/20 text-orange-400 text-sm font-mono font-semibold">
                  {game.abbreviation}
                </span>
              )}
            </div>

            {game.description && (
              <p className="text-gray-400 text-lg mb-6 max-w-2xl leading-relaxed">
                {game.description}
              </p>
            )}

            {/* Quick stats */}
            <div className="flex flex-wrap gap-6">
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-orange-500">
                  {upcoming.length}
                </span>
                <span className="text-sm text-gray-400">{t('activeTournaments')}</span>
              </div>
              {game.factions.length > 0 && (
                <div className="flex flex-col">
                  <span className="text-2xl font-bold text-orange-500">
                    {game.factions.length}
                  </span>
                  <span className="text-sm text-gray-400">{t('factionLabel')}</span>
                </div>
              )}
              {game.tournaments.length > 0 && (
                <div className="flex flex-col">
                  <span className="text-2xl font-bold text-gray-400">
                    {past.length}
                  </span>
                  <span className="text-sm text-gray-400">{tT('pastTournaments')}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Factions */}
      {game.factions.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">{t('factionsTitle')}</h2>

          {Object.keys(factionGroups).length === 1 && !game.factions[0]?.group ? (
            // Pas de groupes — grille simple
            <div className="flex flex-wrap gap-2">
              {game.factions.map((faction) => (
                <span
                  key={faction.id}
                  className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-full text-sm text-gray-300 hover:border-orange-600/50 hover:text-orange-400 transition-colors cursor-default"
                >
                  {faction.name}
                </span>
              ))}
            </div>
          ) : (
            // Groupes multiples — sections avec titre
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(factionGroups).map(([group, factions]) => (
                <div key={group}>
                  <h3 className="text-sm font-semibold text-orange-500 uppercase tracking-wider mb-3">
                    {group}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {factions.map((faction) => (
                      <span
                        key={faction.id}
                        className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-full text-sm text-gray-300 hover:border-orange-600/50 hover:text-orange-400 transition-colors cursor-default"
                      >
                        {faction.name}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Upcoming Tournaments */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">
            {tT('upcomingTournaments')}
            {upcoming.length > 0 && (
              <span className="ml-2 text-lg font-normal text-gray-400">({upcoming.length})</span>
            )}
          </h2>
          <Link
            href={`/${locale}/tournois/nouveau`}
            className="inline-flex items-center justify-center rounded-lg bg-orange-600 hover:bg-orange-700 px-4 py-2 text-sm font-medium text-white transition-colors"
          >
            + {tT('createTournament')}
          </Link>
        </div>

        {upcoming.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-gray-700 rounded-xl">
            <p className="text-gray-400 mb-4">{t('noTournamentsForGame')}</p>
            <Link
              href={`/${locale}/tournois/nouveau`}
              className="inline-flex items-center justify-center rounded-lg bg-orange-600 hover:bg-orange-700 px-4 py-2 text-sm font-medium text-white transition-colors"
            >
              {t('organizeTournament')}
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {upcoming.map((tournament) => {
              const isFull = tournament._count.players >= tournament.maxPlayers
              const spotsLeft = tournament.maxPlayers - tournament._count.players

              return (
                <Card
                  key={tournament.id}
                  className="overflow-hidden hover:border-orange-600/50 transition-colors"
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      {/* Info */}
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-1">{tournament.name}</h3>
                        {tournament.description && (
                          <p className="text-sm text-gray-400 mb-2 line-clamp-2">
                            {tournament.description}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                          {tournament.location && (
                            <span>
                              <span className="font-medium">{tT('location')}:</span>{' '}
                              {tournament.location}
                            </span>
                          )}
                          <span>
                            <span className="font-medium">{tT('date')}:</span>{' '}
                            {tournament.date.toLocaleDateString(
                              locale === 'fr' ? 'fr-FR' : 'en-US',
                              { day: 'numeric', month: 'long', year: 'numeric' }
                            )}
                          </span>
                          {tournament.pointsLimit && (
                            <span>
                              <span className="font-medium">{tT('points')}:</span>{' '}
                              {tournament.pointsLimit} pts
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Status + Actions */}
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <div
                          className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            isFull
                              ? 'bg-red-600/20 text-red-400'
                              : 'bg-green-600/20 text-green-400'
                          }`}
                        >
                          {isFull ? tT('full') : tT('available')}
                        </div>
                        <p className="text-sm text-gray-400">
                          {tournament._count.players}/{tournament.maxPlayers} {tT('places')}
                        </p>
                        {!isFull && (
                          <p className="text-xs text-gray-500">
                            {spotsLeft} place{spotsLeft > 1 ? 's' : ''} libre{spotsLeft > 1 ? 's' : ''}
                          </p>
                        )}
                        <div className="flex gap-2 mt-1">
                          <Link href={`/${locale}/tournois/${tournament.id}`}>
                            <Button variant="outline" size="sm">
                              {tT('viewDetails')}
                            </Button>
                          </Link>
                          {!isFull && (
                            <TournamentListRegisterButton
                              tournamentId={tournament.id}
                              label={tT('register')}
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
            {tT('pastTournaments')}
            <span className="ml-2 text-lg font-normal text-gray-400">({past.length})</span>
          </h2>
          <div className="space-y-3">
            {past.map((tournament) => (
              <Card key={tournament.id} className="opacity-60 hover:opacity-80 transition-opacity">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-300 truncate">{tournament.name}</h3>
                      <div className="flex gap-3 text-sm text-gray-500 mt-0.5">
                        {tournament.location && <span>{tournament.location}</span>}
                        <span>
                          {tournament.date.toLocaleDateString(
                            locale === 'fr' ? 'fr-FR' : 'en-US',
                            { day: 'numeric', month: 'long', year: 'numeric' }
                          )}
                        </span>
                      </div>
                    </div>
                    <Link href={`/${locale}/tournois/${tournament.id}`}>
                      <Button variant="outline" size="sm" className="text-gray-400 shrink-0">
                        {tT('viewDetails')}
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
