import { getTranslations } from 'next-intl/server'
import { Card } from '@/components/ui/card'
import { prisma } from '@warforge/db'
import Link from 'next/link'
import { RankingsGameFilter } from '@/components/rankings-game-filter'
import { RankingsGeoFilter } from '@/components/rankings-geo-filter'
import { auth } from '@/auth'
import { EUROPEAN_COUNTRY_CODES, countryName, flagEmoji } from '@/lib/countries'

const PAGE_SIZE = 50

export default async function RankingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ game?: string; page?: string; region?: string }>
}) {
  const { locale } = await params
  const { game: gameFilter, page: pageParam, region: regionParam } = await searchParams
  const currentPage = Math.max(1, parseInt(pageParam ?? '1', 10) || 1)
  const t = await getTranslations({ locale, namespace: 'rankings' })

  // Auth pour connaître le pays de l'utilisateur connecté
  const session = await auth()
  let userCountry: string | null = null
  try {
    if (session?.user?.id) {
      const dbUser = await prisma.user.findUnique({
        where: { id: session.user.id as string },
        select: { country: true },
      })
      userCountry = dbUser?.country ?? null
    }
  } catch { /* DB not available */ }

  // Résolution du filtre région
  const region = regionParam ?? 'world'
  const isEurope = region === 'europe'
  const isCountry = region !== 'world' && region !== 'europe'
  const countryFilter = isCountry ? region.toUpperCase() : null

  let games: { id: string; name: string; slug: string }[] = []
  let participations: any[] = []

  try {
    ;[games, participations] = await Promise.all([
      prisma.game.findMany({
        select: { id: true, name: true, slug: true },
        orderBy: { name: 'asc' },
      }),
      prisma.tournamentPlayer.findMany({
        where: {
          tournament: {
            status: 'COMPLETED',
            ...(gameFilter ? { game: { slug: gameFilter } } : {}),
          },
          ...(countryFilter
            ? { user: { country: countryFilter } }
            : isEurope
            ? { user: { country: { in: [...EUROPEAN_COUNTRY_CODES] } } }
            : {}),
        },
        select: {
          userId: true,
          wins: true,
          losses: true,
          draws: true,
          points: true,
          user: { select: { name: true, country: true } },
        },
      }),
    ])
  } catch {
    // DB not available
  }

  // Agréger par joueur
  const byUser = new Map<
    string,
    { name: string; country: string | null; wins: number; losses: number; draws: number; points: number; played: number }
  >()

  for (const p of participations) {
    const existing = byUser.get(p.userId) ?? {
      name: p.user.name ?? '—',
      country: p.user.country ?? null,
      wins: 0,
      losses: 0,
      draws: 0,
      points: 0,
      played: 0,
    }
    existing.wins += p.wins ?? 0
    existing.losses += p.losses ?? 0
    existing.draws += p.draws ?? 0
    existing.points += p.points ?? 0
    existing.played += 1
    byUser.set(p.userId, existing)
  }

  const rankings = [...byUser.entries()]
    .map(([userId, stats]) => {
      const totalGames = stats.wins + stats.losses + stats.draws
      const winrate = totalGames > 0 ? Math.round((stats.wins / totalGames) * 100) : 0
      return { userId, ...stats, winrate, totalGames }
    })
    .filter((r) => r.totalGames > 0)
    .sort((a, b) => b.points - a.points || b.winrate - a.winrate || b.wins - a.wins)

  const selectedGame = games.find((g) => g.slug === gameFilter)

  const totalPages = Math.max(1, Math.ceil(rankings.length / PAGE_SIZE))
  const safePage = Math.min(currentPage, totalPages)
  const pageRankings = rankings.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  function pageUrl(p: number) {
    const params = new URLSearchParams()
    if (gameFilter) params.set('game', gameFilter)
    if (regionParam) params.set('region', regionParam)
    if (p > 1) params.set('page', String(p))
    const qs = params.toString()
    return `/${locale}/rankings${qs ? `?${qs}` : ''}`
  }

  const regionLabel = isCountry && countryFilter
    ? `${flagEmoji(countryFilter)} ${countryName(countryFilter, locale)}`
    : isEurope
    ? t('europe')
    : t('world')

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Header */}
      <section className="mb-10">
        <h1 className="text-4xl font-bold tracking-tighter mb-2">{t('title')}</h1>
        <p className="text-gray-400">{t('subtitle')}</p>
      </section>

      {/* Filtres */}
      <section className="mb-6 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <RankingsGeoFilter
          locale={locale}
          currentGame={gameFilter}
          currentRegion={regionParam}
          userCountry={userCountry}
          countryName={userCountry ? countryName(userCountry, locale) : null}
          labels={{
            world: t('world'),
            europe: t('europe'),
            myCountry: t('myCountry'),
            loginRequired: t('loginRequired'),
          }}
        />
        <RankingsGameFilter
          games={games}
          currentGame={gameFilter}
          allLabel={t('filterByGame')}
          locale={locale}
        />
      </section>

      {/* Titre région active */}
      {(isEurope || isCountry) && (
        <p className="text-sm text-orange-400 font-medium mb-4">{regionLabel}</p>
      )}

      {/* Tableau */}
      <section>
        {selectedGame && (
          <h2 className="text-xl font-semibold text-orange-500 mb-4">{selectedGame.name}</h2>
        )}

        {rankings.length === 0 ? (
          <div className="border border-dashed border-gray-700 rounded-xl py-16 text-center">
            <p className="text-gray-400">{t('noData')}</p>
          </div>
        ) : (
          <Card>
            {/* Header */}
            <div className="px-4 py-3 grid grid-cols-[2.5rem_1fr_2rem_3.5rem_3rem_3rem_3rem_4rem_4rem] gap-2 text-xs text-gray-500 uppercase tracking-wider border-b border-gray-800">
              <span>{t('rank')}</span>
              <span>{t('player')}</span>
              <span />
              <span className="text-center">{t('pts')}</span>
              <span className="text-center">{t('w')}</span>
              <span className="text-center">{t('l')}</span>
              <span className="text-center">{t('d')}</span>
              <span className="text-center">{t('winrate')}</span>
              <span className="text-center">{t('played')}</span>
            </div>

            <div className="divide-y divide-gray-800/60">
              {pageRankings.map((player, idx) => {
                const globalIdx = (safePage - 1) * PAGE_SIZE + idx
                const isFirst = globalIdx === 0
                const isTop3 = globalIdx < 3
                const medalColor = ['text-yellow-400', 'text-gray-300', 'text-orange-600']

                return (
                  <div
                    key={player.userId}
                    className={`px-4 py-3 grid grid-cols-[2.5rem_1fr_2rem_3.5rem_3rem_3rem_3rem_4rem_4rem] gap-2 items-center transition-colors hover:bg-gray-800/30 ${
                      isFirst ? 'bg-orange-600/5' : ''
                    }`}
                  >
                    {/* Rang */}
                    <span
                      className={`text-sm font-bold font-mono ${
                        isTop3 ? medalColor[globalIdx] ?? 'text-gray-500' : 'text-gray-500'
                      }`}
                    >
                      {isTop3 ? ['🥇', '🥈', '🥉'][globalIdx] : globalIdx + 1}
                    </span>

                    {/* Nom */}
                    <Link
                      href={`/${locale}/joueurs/${player.userId}`}
                      className={`font-medium truncate hover:text-orange-400 transition-colors ${isFirst ? 'text-white' : 'text-gray-200'}`}
                    >
                      {player.name}
                      {isFirst && (
                        <span className="ml-2 text-xs text-orange-400 font-normal hidden sm:inline">
                          {t('topPlayer')}
                        </span>
                      )}
                    </Link>

                    {/* Drapeau */}
                    <span className="text-base leading-none" title={player.country ? countryName(player.country, locale) : undefined}>
                      {player.country ? flagEmoji(player.country) : ''}
                    </span>

                    {/* Points */}
                    <span className={`text-center font-bold ${isFirst ? 'text-orange-400 text-base' : 'text-orange-400/80'}`}>
                      {player.points}
                    </span>

                    {/* V */}
                    <span className="text-center text-green-500">{player.wins}</span>

                    {/* D */}
                    <span className="text-center text-red-400">{player.losses}</span>

                    {/* N */}
                    <span className="text-center text-gray-400">{player.draws}</span>

                    {/* Winrate */}
                    <span className={`text-center text-sm ${player.winrate >= 60 ? 'text-green-400' : player.winrate >= 40 ? 'text-gray-300' : 'text-red-400'}`}>
                      {player.winrate}%
                    </span>

                    {/* Tournois */}
                    <span className="text-center text-gray-500 text-sm">{player.played}</span>
                  </div>
                )
              })}
            </div>
          </Card>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-gray-500">
              {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, rankings.length)} sur {rankings.length} joueurs
            </p>
            <div className="flex items-center gap-1">
              <Link
                href={pageUrl(safePage - 1)}
                aria-disabled={safePage === 1}
                className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                  safePage === 1
                    ? 'border-gray-800 text-gray-700 pointer-events-none'
                    : 'border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-200'
                }`}
              >
                ←
              </Link>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Link
                  key={p}
                  href={pageUrl(p)}
                  className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                    p === safePage
                      ? 'border-orange-600/60 bg-orange-600/10 text-orange-400'
                      : 'border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-200'
                  }`}
                >
                  {p}
                </Link>
              ))}
              <Link
                href={pageUrl(safePage + 1)}
                aria-disabled={safePage === totalPages}
                className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                  safePage === totalPages
                    ? 'border-gray-800 text-gray-700 pointer-events-none'
                    : 'border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-200'
                }`}
              >
                →
              </Link>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
