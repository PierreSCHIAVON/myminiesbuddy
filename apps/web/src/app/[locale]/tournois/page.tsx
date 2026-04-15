import { getTranslations } from 'next-intl/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { prisma } from '@warforge/db'
import { TournamentListRegisterButton } from '@/components/tournament-list-register-button'
import { TournamentsFilters } from '@/components/tournaments-filters'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tournois',
  description: 'Découvrez les tournois de wargame en cours et à venir.',
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

  let gamesList: { id: string; name: string; slug: string }[] = []
  let rawTournaments: any[] = []
  let filteredGameFactions: { id: string; name: string; group: string | null }[] = []

  try {
    // Afficher tous les tournois publics (pas DRAFT ni CANCELLED)
    const where: any = { status: { in: ['OPEN', 'IN_PROGRESS', 'COMPLETED'] } }
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
        orderBy: { date: 'desc' },
      }),
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

  const live       = rawTournaments.filter((t: any) => t.status === 'IN_PROGRESS')
  const open       = rawTournaments.filter((t: any) => t.status === 'OPEN')
  const completed  = rawTournaments.filter((t: any) => t.status === 'COMPLETED')

  // URL préférentielle : slug si disponible, sinon id
  function tournamentUrl(t: any) {
    return `/${locale}/tournois/${t.slug ?? t.id}`
  }

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
        <TournamentsFilters
          locale={locale}
          games={gamesList}
          currentSearch={searchQuery}
          currentGame={gameFilter}
          createLabel={`+ ${t('createTournament')}`}
          searchPlaceholder={t('searchPlaceholder')}
          filterByGameLabel={t('filterByGame')}
          filterClearLabel={t('filterClear')}
        />
      </section>

      {/* Tournois en cours */}
      {live.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            En cours ({live.length})
          </h2>
          <div className="space-y-4">
            {live.map((tournament: any) => (
              <TournamentCard
                key={tournament.id}
                tournament={tournament}
                locale={locale}
                href={tournamentUrl(tournament)}
                badge={{ label: 'En cours', color: 'bg-orange-600/20 text-orange-400' }}
                factions={filteredGameFactions}
                viewLabel={t('viewDetails')}
                placesLabel={t('places')}
              />
            ))}
          </div>
        </section>
      )}

      {/* Inscriptions ouvertes */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">
          {t('upcomingTournaments')} ({open.length})
        </h2>

        {open.length === 0 && live.length === 0 && completed.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-gray-700 rounded-xl">
            <p className="text-gray-400">{t('noTournamentsFound')}</p>
          </div>
        ) : open.length === 0 ? (
          <p className="text-gray-500 text-sm">{t('noTournamentsFound')}</p>
        ) : (
          <div className="space-y-4">
            {open.map((tournament: any) => {
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
                        <TournamentMeta tournament={tournament} locale={locale} t={t} />
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          isFull ? 'bg-red-600/20 text-red-400' : 'bg-green-600/20 text-green-400'
                        }`}>
                          {isFull ? t('full') : t('available')}
                        </div>
                        <p className="text-sm text-gray-400">
                          {tournament._count.players}/{tournament.maxPlayers} {t('places')}
                        </p>
                        {!isFull && (
                          <p className="text-xs text-gray-500">{spotsLeft} {t('spotsLeft')}</p>
                        )}
                        <div className="flex gap-2 mt-1">
                          <Link href={tournamentUrl(tournament)}>
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

      {/* Terminés */}
      {completed.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold mb-6">
            {t('pastTournaments')} ({completed.length})
          </h2>
          <div className="space-y-3">
            {completed.map((tournament: any) => (
              <Card key={tournament.id} className="opacity-70 hover:opacity-90 transition-opacity">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-300 truncate">{tournament.name}</h3>
                      <div className="flex gap-3 text-sm text-gray-500 mt-0.5 flex-wrap">
                        <span>{tournament.game.name}</span>
                        {tournament.location && <span>{tournament.location}</span>}
                        <span>
                          {new Date(tournament.date).toLocaleDateString(
                            locale === 'fr' ? 'fr-FR' : 'en-US',
                            { day: 'numeric', month: 'long', year: 'numeric' }
                          )}
                        </span>
                        <span className="text-gray-600">
                          {tournament._count.players} participants
                        </span>
                      </div>
                    </div>
                    <Link href={tournamentUrl(tournament)}>
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

// ─── Sous-composants ──────────────────────────────────────────────────────────

function TournamentMeta({ tournament, locale, t }: { tournament: any; locale: string; t: any }) {
  return (
    <div className="flex flex-wrap gap-3 text-sm text-gray-400">
      <span>
        <span className="font-medium">{t('game')}:</span>{' '}
        <Link href={`/${locale}/jeux/${tournament.game.slug}`} className="hover:text-orange-500 transition-colors">
          {tournament.game.name}
        </Link>
      </span>
      {tournament.location && (
        <span><span className="font-medium">{t('location')}:</span> {tournament.location}</span>
      )}
      <span>
        <span className="font-medium">{t('date')}:</span>{' '}
        {new Date(tournament.date).toLocaleDateString(
          locale === 'fr' ? 'fr-FR' : 'en-US',
          { day: 'numeric', month: 'long', year: 'numeric' }
        )}
      </span>
      {tournament.teamSize && (
        <span className="text-orange-400/80">{tournament.teamSize}v{tournament.teamSize}</span>
      )}
    </div>
  )
}

function TournamentCard({
  tournament, locale, href, badge, factions, viewLabel, placesLabel,
}: {
  tournament: any
  locale: string
  href: string
  badge: { label: string; color: string }
  factions: any[]
  viewLabel: string
  placesLabel: string
}) {
  return (
    <Card className="overflow-hidden hover:border-orange-600/50 transition-colors">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-semibold">{tournament.name}</h3>
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${badge.color}`}>
                {badge.label}
              </span>
            </div>
            {tournament.description && (
              <p className="text-sm text-gray-400 mb-2 line-clamp-2">{tournament.description}</p>
            )}
            <div className="flex flex-wrap gap-3 text-sm text-gray-400">
              <span>{tournament.game.name}</span>
              {tournament.location && <span>{tournament.location}</span>}
              <span>
                {new Date(tournament.date).toLocaleDateString(
                  locale === 'fr' ? 'fr-FR' : 'en-US',
                  { day: 'numeric', month: 'long', year: 'numeric' }
                )}
              </span>
              {tournament.teamSize && (
                <span className="text-orange-400/80">{tournament.teamSize}v{tournament.teamSize}</span>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <p className="text-sm text-gray-400">
              {tournament._count.players}/{tournament.maxPlayers} {placesLabel}
            </p>
            <Link href={href}>
              <Button variant="outline" size="sm">{viewLabel}</Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
