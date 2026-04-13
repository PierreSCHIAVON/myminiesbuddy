import { getTranslations } from 'next-intl/server'
import { Card, CardContent } from '@/components/ui/card'
import { prisma } from '@warforge/db'
import Link from 'next/link'

export default async function RankingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ game?: string }>
}) {
  const { locale } = await params
  const { game: gameFilter } = await searchParams
  const t = await getTranslations({ locale, namespace: 'rankings' })

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
        },
        select: {
          userId: true,
          wins: true,
          losses: true,
          draws: true,
          points: true,
          user: { select: { name: true } },
        },
      }),
    ])
  } catch {
    // DB not available
  }

  // Agréger par joueur
  const byUser = new Map<
    string,
    { name: string; wins: number; losses: number; draws: number; points: number; played: number }
  >()

  for (const p of participations) {
    const existing = byUser.get(p.userId) ?? {
      name: p.user.name ?? '—',
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

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Header */}
      <section className="mb-10">
        <h1 className="text-4xl font-bold tracking-tighter mb-2">{t('title')}</h1>
        <p className="text-gray-400">{t('subtitle')}</p>
      </section>

      {/* Filtre par jeu */}
      <section className="mb-8">
        <form method="GET" className="flex flex-wrap gap-2">
          <Link
            href={`/${locale}/rankings`}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
              !gameFilter
                ? 'border-orange-600/60 bg-orange-600/10 text-orange-400'
                : 'border-gray-700 text-gray-400 hover:border-gray-500'
            }`}
          >
            {t('filterByGame')}
          </Link>
          {games.map((game) => (
            <Link
              key={game.slug}
              href={`/${locale}/rankings?game=${game.slug}`}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                gameFilter === game.slug
                  ? 'border-orange-600/60 bg-orange-600/10 text-orange-400'
                  : 'border-gray-700 text-gray-400 hover:border-gray-500'
              }`}
            >
              {game.name}
            </Link>
          ))}
        </form>
      </section>

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
            <div className="px-4 py-3 grid grid-cols-[2.5rem_1fr_3.5rem_3rem_3rem_3rem_4rem_4rem] gap-2 text-xs text-gray-500 uppercase tracking-wider border-b border-gray-800">
              <span>{t('rank')}</span>
              <span>{t('player')}</span>
              <span className="text-center">{t('pts')}</span>
              <span className="text-center">{t('w')}</span>
              <span className="text-center">{t('l')}</span>
              <span className="text-center">{t('d')}</span>
              <span className="text-center">{t('winrate')}</span>
              <span className="text-center">{t('played')}</span>
            </div>

            <div className="divide-y divide-gray-800/60">
              {rankings.map((player, idx) => {
                const isFirst = idx === 0
                const isTop3 = idx < 3
                const medalColor = ['text-yellow-400', 'text-gray-300', 'text-orange-600']

                return (
                  <div
                    key={player.userId}
                    className={`px-4 py-3 grid grid-cols-[2.5rem_1fr_3.5rem_3rem_3rem_3rem_4rem_4rem] gap-2 items-center transition-colors hover:bg-gray-800/30 ${
                      isFirst ? 'bg-orange-600/5' : ''
                    }`}
                  >
                    {/* Rang */}
                    <span
                      className={`text-sm font-bold font-mono ${
                        isTop3 ? medalColor[idx] ?? 'text-gray-500' : 'text-gray-500'
                      }`}
                    >
                      {isTop3 ? ['🥇', '🥈', '🥉'][idx] : idx + 1}
                    </span>

                    {/* Nom */}
                    <span className={`font-medium truncate ${isFirst ? 'text-white' : 'text-gray-200'}`}>
                      {player.name}
                      {isFirst && (
                        <span className="ml-2 text-xs text-orange-400 font-normal hidden sm:inline">
                          {t('topPlayer')}
                        </span>
                      )}
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
      </section>
    </div>
  )
}
