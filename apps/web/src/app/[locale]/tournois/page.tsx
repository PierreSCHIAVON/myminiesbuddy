import { getTranslations } from 'next-intl/server'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
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

      {rawTournaments.length === 0 && (
        <div className="text-center py-12 border border-dashed border-gray-700 rounded-xl">
          <p className="text-gray-400">{t('noTournamentsFound')}</p>
        </div>
      )}

      {/* Tournois en cours */}
      {live.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
            En cours ({live.length})
          </h2>
          <Card>
            <div className="divide-y divide-gray-800/60">
              {live.map((tournament: any) => (
                <TournamentRow
                  key={tournament.id}
                  tournament={tournament}
                  locale={locale}
                  href={tournamentUrl(tournament)}
                  badge={{ label: 'Live', color: 'bg-orange-600/20 text-orange-400' }}
                  factions={filteredGameFactions}
                  viewLabel={t('viewDetails')}
                  registerLabel={t('register')}
                  placesLabel={t('places')}
                />
              ))}
            </div>
          </Card>
        </section>
      )}

      {/* Inscriptions ouvertes */}
      {open.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            {t('upcomingTournaments')} ({open.length})
          </h2>
          <Card>
            <div className="divide-y divide-gray-800/60">
              {open.map((tournament: any) => (
                <TournamentRow
                  key={tournament.id}
                  tournament={tournament}
                  locale={locale}
                  href={tournamentUrl(tournament)}
                  badge={null}
                  factions={filteredGameFactions}
                  viewLabel={t('viewDetails')}
                  registerLabel={t('register')}
                  placesLabel={t('places')}
                />
              ))}
            </div>
          </Card>
        </section>
      )}

      {/* Terminés */}
      {completed.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            {t('pastTournaments')} ({completed.length})
          </h2>
          <Card className="opacity-75">
            <div className="divide-y divide-gray-800/60">
              {completed.map((tournament: any) => (
                <TournamentRow
                  key={tournament.id}
                  tournament={tournament}
                  locale={locale}
                  href={tournamentUrl(tournament)}
                  badge={{ label: t('completed') ?? 'Terminé', color: 'bg-gray-700/50 text-gray-500' }}
                  factions={[]}
                  viewLabel={t('viewDetails')}
                  registerLabel=""
                  placesLabel={t('places')}
                />
              ))}
            </div>
          </Card>
        </section>
      )}
    </div>
  )
}

// ─── Sous-composants ──────────────────────────────────────────────────────────

function TournamentRow({
  tournament, locale, href, badge, factions, viewLabel, registerLabel, placesLabel,
}: {
  tournament: any
  locale: string
  href: string
  badge: { label: string; color: string } | null
  factions: any[]
  viewLabel: string
  registerLabel: string
  placesLabel: string
}) {
  const isFull = tournament._count.players >= tournament.maxPlayers
  const isOpen = tournament.status === 'OPEN'

  return (
    <div className="px-4 py-3 flex items-center gap-4 hover:bg-gray-800/30 transition-colors">
      {/* Nom + meta */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <Link href={href} className="font-medium hover:text-orange-400 transition-colors truncate">
            {tournament.name}
          </Link>
          {badge && (
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold shrink-0 ${badge.color}`}>
              {badge.label}
            </span>
          )}
          {tournament.teamSize && (
            <span className="text-xs text-orange-400/70 shrink-0">{tournament.teamSize}v{tournament.teamSize}</span>
          )}
        </div>
        <div className="flex gap-3 text-xs text-gray-500 mt-0.5 flex-wrap">
          <Link href={`/${locale}/jeux/${tournament.game.slug}`} className="hover:text-orange-500 transition-colors">
            {tournament.game.name}
          </Link>
          {tournament.location && <span>{tournament.location}</span>}
          <span>
            {new Date(tournament.date).toLocaleDateString(
              locale === 'fr' ? 'fr-FR' : 'en-US',
              { day: 'numeric', month: 'short', year: 'numeric' }
            )}
          </span>
        </div>
      </div>

      {/* Places */}
      <div className="text-right shrink-0 hidden sm:block">
        <p className={`text-sm font-medium ${isFull ? 'text-red-400' : 'text-gray-400'}`}>
          {tournament._count.players}/{tournament.maxPlayers}
        </p>
        <p className="text-xs text-gray-600">{placesLabel}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <Link href={href}>
          <Button variant="outline" size="sm">{viewLabel}</Button>
        </Link>
        {isOpen && !isFull && registerLabel && (
          <TournamentListRegisterButton
            tournamentId={tournament.id}
            factions={factions}
            label={registerLabel}
          />
        )}
      </div>
    </div>
  )
}
