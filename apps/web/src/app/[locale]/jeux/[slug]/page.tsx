import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import Image from 'next/image'
import { prisma } from '@warforge/db'
import { notFound } from 'next/navigation'
import { FactionStatsTable } from '@/components/faction-stats-table'

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
  let completedTournaments = 0
  let totalPlayers = 0

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
      completedTournaments = await prisma.tournament.count({
        where: { gameId: game.id, status: 'COMPLETED' },
      })

      const raw = await prisma.tournamentPlayer.groupBy({
        by: ['factionId'],
        where: {
          factionId: { not: null },
          tournament: { gameId: game.id, status: 'COMPLETED' },
        },
        _count: { id: true },
        _sum: { wins: true, losses: true, draws: true },
      })

      totalPlayers = raw.reduce((s, r) => s + r._count.id, 0)

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
                className="object-contain p-3"
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
      {game.factions.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-2">{t('statsTitle')}</h2>
          <FactionStatsTable
            rows={allFactionRows}
            labels={{
              faction: t('statsFaction'),
              players: t('statsPlayers'),
              meta: t('statsMeta'),
              wins: t('statsWins'),
              losses: t('statsLosses'),
              draws: t('statsDraws'),
              winRate: t('statsWinRate'),
              showAll: t('statsShowAll', { count: allFactionRows.filter(r => !r.stat).length }),
              showLess: t('statsShowLess'),
              noData: t('statsNoData'),
              basedOn: completedTournaments > 0
                ? t('statsBasedOn', { tournaments: completedTournaments, players: totalPlayers })
                : '',
            }}
          />
        </section>
      )}
    </div>
  )
}
