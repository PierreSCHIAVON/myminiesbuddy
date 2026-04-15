import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { prisma } from '@warforge/db'
import type { Metadata } from 'next'
import { countryName, flagEmoji } from '@/lib/countries'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}): Promise<Metadata> {
  const { id } = await params
  try {
    const user = await prisma.user.findUnique({ where: { id }, select: { name: true } })
    if (user?.name) {
      return { title: user.name, description: `Profil joueur de ${user.name} sur WarForge` }
    }
  } catch { /* DB not available */ }
  return { title: 'Profil joueur' }
}

export default async function PlayerProfilePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale, id } = await params
  const t = await getTranslations({ locale, namespace: 'playerProfile' })

  let user: { name: string | null; country: string | null; createdAt: Date } | null = null
  let participations: any[] = []

  try {
    ;[user, participations] = await Promise.all([
      prisma.user.findUnique({
        where: { id },
        select: { name: true, country: true, createdAt: true },
      }),
      prisma.tournamentPlayer.findMany({
        where: { userId: id },
        include: {
          tournament: {
            select: {
              id: true,
              name: true,
              slug: true,
              date: true,
              status: true,
              game: { select: { name: true } },
            },
          },
          factionRef: { select: { name: true } },
        },
        orderBy: { tournament: { date: 'desc' } },
      }),
    ])
  } catch { /* DB not available */ }

  if (!user) notFound()

  const displayName = user.name ?? '—'
  const memberSince = new Date(user.createdAt).toLocaleDateString(
    locale === 'fr' ? 'fr-FR' : 'en-US',
    { month: 'long', year: 'numeric' }
  )

  // Stats sur tous les tournois (y compris en cours)
  const totalWins   = participations.reduce((s, p) => s + (p.wins ?? 0), 0)
  const totalLosses = participations.reduce((s, p) => s + (p.losses ?? 0), 0)
  const totalDraws  = participations.reduce((s, p) => s + (p.draws ?? 0), 0)
  const totalPoints = participations.reduce((s, p) => s + (p.points ?? 0), 0)
  const totalGames  = totalWins + totalLosses + totalDraws
  const winrate     = totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : null
  const tournamentsPlayed = participations.filter(p => p.tournament.status === 'COMPLETED').length

  // Rang global : calculé parmi tous les joueurs COMPLETED
  let globalRank: number | null = null
  try {
    const allParticipations = await prisma.tournamentPlayer.findMany({
      where: { tournament: { status: 'COMPLETED' } },
      select: { userId: true, points: true, wins: true, losses: true, draws: true },
    })
    const byUser = new Map<string, { points: number; winrate: number }>()
    for (const p of allParticipations) {
      const ex = byUser.get(p.userId) ?? { points: 0, winrate: 0, wins: 0, total: 0 } as any
      ex.points += p.points ?? 0
      ex.wins   = (ex.wins ?? 0) + (p.wins ?? 0)
      ex.total  = (ex.total ?? 0) + (p.wins ?? 0) + (p.losses ?? 0) + (p.draws ?? 0)
      byUser.set(p.userId, ex)
    }
    // winrate final
    const ranked = [...byUser.entries()]
      .map(([uid, s]: any) => ({
        userId: uid,
        points: s.points,
        winrate: s.total > 0 ? Math.round((s.wins / s.total) * 100) : 0,
      }))
      .sort((a, b) => b.points - a.points || b.winrate - a.winrate)
    const pos = ranked.findIndex(r => r.userId === id)
    if (pos !== -1) globalRank = pos + 1
  } catch { /* DB not available */ }

  // Factions les plus jouées
  const factionCounts = new Map<string, number>()
  for (const p of participations) {
    const name = p.factionRef?.name
    if (name) factionCounts.set(name, (factionCounts.get(name) ?? 0) + 1)
  }
  const topFactions = [...factionCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)

  function tournamentUrl(p: any) {
    return `/${locale}/tournois/${p.tournament.slug ?? p.tournament.id}`
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      {/* Retour */}
      <Link href={`/${locale}/rankings`} className="text-sm text-gray-500 hover:text-gray-300 transition-colors mb-8 inline-block">
        ← {t('backToRankings')}
      </Link>

      {/* Header joueur */}
      <section className="mb-10 flex items-start gap-6">
        <div className="h-16 w-16 rounded-full bg-orange-600 flex items-center justify-center text-2xl font-bold text-white shrink-0">
          {displayName[0]?.toUpperCase() ?? '?'}
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tighter">{displayName}</h1>
          <div className="flex items-center gap-2 mt-1">
            {user.country && (
              <span title={countryName(user.country, locale)} className="text-lg leading-none">
                {flagEmoji(user.country)}
              </span>
            )}
            <p className="text-gray-500 text-sm">{t('memberSince')} {memberSince}</p>
          </div>
          {globalRank && (
            <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-600/15 text-orange-400 text-sm font-semibold">
              {globalRank <= 3 ? ['🥇', '🥈', '🥉'][globalRank - 1] : `#${globalRank}`} {t('globalRank')}
            </div>
          )}
        </div>
      </section>

      {/* Stats */}
      <section className="mb-8">
        <h2 className="text-lg font-bold mb-4">{t('stats')}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: t('wins'),   value: totalWins,    color: 'text-green-500' },
            { label: t('losses'), value: totalLosses,  color: 'text-red-500' },
            { label: t('draws'),  value: totalDraws,   color: 'text-gray-400' },
            { label: t('winrate'), value: winrate !== null ? `${winrate}%` : '—', color: 'text-orange-400' },
          ].map(({ label, value, color }) => (
            <Card key={label}>
              <CardHeader className="pb-1 pt-4 px-4">
                <CardTitle className="text-xs text-gray-400 uppercase tracking-wider">{label}</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="flex gap-4 mt-3 text-sm text-gray-500">
          <span>{totalPoints} {t('totalPoints')}</span>
          <span>·</span>
          <span>{tournamentsPlayed} {t('tournamentsPlayed')}</span>
        </div>
      </section>

      {/* Factions favorites */}
      {topFactions.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-bold mb-3">{t('favoriteFactions')}</h2>
          <div className="flex flex-wrap gap-2">
            {topFactions.map(([name, count]) => (
              <span key={name} className="px-3 py-1.5 rounded-full bg-gray-800 border border-gray-700 text-sm">
                {name}
                <span className="ml-1.5 text-gray-500 text-xs">{count}×</span>
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Historique tournois */}
      <section>
        <h2 className="text-lg font-bold mb-4">{t('history')}</h2>
        {participations.length === 0 ? (
          <div className="border border-dashed border-gray-700 rounded-xl py-10 text-center text-gray-400">
            {t('noHistory')}
          </div>
        ) : (
          <Card>
            <div className="divide-y divide-gray-800">
              {participations.map((p: any) => {
                const total = (p.wins ?? 0) + (p.losses ?? 0) + (p.draws ?? 0)
                const statusColor: Record<string, string> = {
                  COMPLETED:   'bg-gray-700/50 text-gray-400',
                  IN_PROGRESS: 'bg-orange-600/20 text-orange-400',
                  OPEN:        'bg-green-600/20 text-green-400',
                }
                return (
                  <div key={p.id} className="px-4 py-3 flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-medium truncate">{p.tournament.name}</p>
                        {p.tournament.status !== 'COMPLETED' && (
                          <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${statusColor[p.tournament.status] ?? ''}`}>
                            {p.tournament.status === 'IN_PROGRESS' ? t('inProgress') : t('open')}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2 text-xs text-gray-500">
                        <span>{p.tournament.game.name}</span>
                        {p.factionRef && <span>· {p.factionRef.name}</span>}
                        <span>·</span>
                        <span>
                          {new Date(p.tournament.date).toLocaleDateString(
                            locale === 'fr' ? 'fr-FR' : 'en-US',
                            { day: 'numeric', month: 'short', year: 'numeric' }
                          )}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {total > 0 && (
                        <div className="flex gap-2 text-sm font-mono">
                          <span className="text-green-500">{p.wins}V</span>
                          <span className="text-red-400">{p.losses}D</span>
                          {p.draws > 0 && <span className="text-gray-400">{p.draws}N</span>}
                        </div>
                      )}
                      {p.points > 0 && (
                        <span className="text-orange-400 text-sm font-semibold">{p.points} pts</span>
                      )}
                      <Link
                        href={tournamentUrl(p)}
                        className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                      >
                        →
                      </Link>
                    </div>
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
