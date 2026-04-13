import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import Image from 'next/image'
import { prisma } from '@warforge/db'
import { notFound } from 'next/navigation'

export default async function GameDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  const t = await getTranslations({ locale, namespace: 'games' })

  interface FactionStat {
    factionId: string
    factionName: string
    group: string | null
    players: number
    wins: number
    losses: number
    draws: number
    winRate: number
    metaPct: number
  }

  let game: {
    id: string
    name: string
    slug: string
    abbreviation: string | null
    description: string | null
    logoUrl: string | null
    factions: { id: string; name: string; slug: string; group: string | null }[]
    _count: { tournaments: number }
  } | null = null

  let factionStats: FactionStat[] = []

  try {
    game = await prisma.game.findUnique({
      where: { slug },
      include: {
        factions: {
          orderBy: [{ group: 'asc' }, { name: 'asc' }],
        },
        _count: { select: { tournaments: true } },
      },
    })

    if (game) {
      const raw = await prisma.tournamentPlayer.groupBy({
        by: ['factionId'],
        where: {
          factionId: { not: null },
          tournament: { gameId: game.id, status: 'COMPLETED' },
        },
        _count: { id: true },
        _sum: { wins: true, losses: true, draws: true },
      })

      const totalPlayers = raw.reduce((s, r) => s + r._count.id, 0)

      const factionIds = raw.map((r) => r.factionId!).filter(Boolean)
      const factionMap = factionIds.length
        ? await prisma.faction.findMany({
            where: { id: { in: factionIds } },
            select: { id: true, name: true, group: true },
          })
        : []
      const factionById = Object.fromEntries(factionMap.map((f) => [f.id, f]))

      factionStats = raw
        .map((r) => {
          const faction = factionById[r.factionId!]
          if (!faction) return null
          const players = r._count.id
          const wins = r._sum.wins ?? 0
          const losses = r._sum.losses ?? 0
          const draws = r._sum.draws ?? 0
          const games = wins + losses + draws
          return {
            factionId: r.factionId!,
            factionName: faction.name,
            group: faction.group,
            players,
            wins,
            losses,
            draws,
            winRate: games > 0 ? Math.round((wins / games) * 100) : 0,
            metaPct: totalPlayers > 0 ? Math.round((players / totalPlayers) * 100) : 0,
          } satisfies FactionStat
        })
        .filter(Boolean) as FactionStat[]

      factionStats.sort((a, b) => b.winRate - a.winRate || b.players - a.players)
    }
  } catch {
    // DB not available
  }

  if (!game) return notFound()

  const statsById = Object.fromEntries(factionStats.map((s) => [s.factionId, s]))
  const allFactionRows = game.factions.map((f) => ({
    faction: f,
    stat: statsById[f.id] ?? null,
  }))
  allFactionRows.sort((a, b) => {
    if (a.stat && b.stat) return b.stat.winRate - a.stat.winRate || b.stat.players - a.stat.players
    if (a.stat) return -1
    if (b.stat) return 1
    return a.faction.name.localeCompare(b.faction.name)
  })

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

            {/* Quick stats + CTA */}
            <div className="flex flex-wrap items-center gap-6">
              {game.factions.length > 0 && (
                <div className="flex flex-col">
                  <span className="text-2xl font-bold text-orange-500">{game.factions.length}</span>
                  <span className="text-sm text-gray-400">{t('factionLabel')}</span>
                </div>
              )}
              {game._count.tournaments > 0 && (
                <div className="flex flex-col">
                  <span className="text-2xl font-bold text-orange-500">{game._count.tournaments}</span>
                  <span className="text-sm text-gray-400">{t('tournamentCount')}</span>
                </div>
              )}
              <Link
                href={`/${locale}/tournois?game=${game.slug}`}
                className="inline-flex items-center justify-center rounded-lg bg-orange-600 hover:bg-orange-700 px-4 py-2 text-sm font-medium text-white transition-colors"
              >
                {t('seeTournaments')} →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Factions & Stats */}
      {allFactionRows.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-2">{t('statsTitle')}</h2>
          <p className="text-sm text-gray-500 mb-6">{t('statsSubtitle')}</p>

          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-gray-900/60">
                  <th className="text-left px-4 py-3 font-semibold text-gray-400">#</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-400">{t('statsFaction')}</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-400">{t('statsPlayers')}</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-400">{t('statsMeta')}</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-400">{t('statsWins')}</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-400">{t('statsLosses')}</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-400">{t('statsDraws')}</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-400">{t('statsWinRate')}</th>
                </tr>
              </thead>
              <tbody>
                {allFactionRows.map(({ faction, stat }, idx) => (
                  <tr
                    key={faction.id}
                    className="border-b border-border/50 hover:bg-gray-900/40 transition-colors"
                  >
                    <td className="px-4 py-3 text-gray-500 font-mono">{stat ? idx + 1 : '—'}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold">{faction.name}</div>
                      {faction.group && (
                        <div className="text-xs text-gray-500">{faction.group}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-300">
                      {stat ? stat.players : <span className="text-gray-600">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {stat
                        ? <span className="text-orange-400 font-semibold">{stat.metaPct}%</span>
                        : <span className="text-gray-600">—</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-center text-green-400">
                      {stat ? stat.wins : <span className="text-gray-600">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center text-red-400">
                      {stat ? stat.losses : <span className="text-gray-600">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-400">
                      {stat ? stat.draws : <span className="text-gray-600">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {stat ? (
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-20 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-orange-500 rounded-full"
                              style={{ width: `${stat.winRate}%` }}
                            />
                          </div>
                          <span
                            className={`font-bold tabular-nums w-12 text-right ${
                              stat.winRate >= 60
                                ? 'text-green-400'
                                : stat.winRate >= 40
                                ? 'text-orange-400'
                                : 'text-red-400'
                            }`}
                          >{stat.winRate}%</span>
                        </div>
                      ) : (
                        <span className="text-gray-600 text-xs font-mono">TBD</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}
