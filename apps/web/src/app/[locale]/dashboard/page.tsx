import { getTranslations } from 'next-intl/server'
import { auth } from '@/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@warforge/db'

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const session = await auth()
  const { locale } = await params

  if (!session?.user) {
    redirect(`/${locale}`)
  }

  const t = await getTranslations({ locale, namespace: 'dashboard' })

  const userId = session.user.id as string
  const role = (session.user.role as string) ?? 'PLAYER'
  const isOrganizer = role === 'ORGANIZER' || role === 'ADMIN'

  // Résultats par défaut
  let activeRegistrations: any[] = []
  let pastRegistrations: any[] = []
  let organizedTournaments: any[] = []

  try {
    const queries: Promise<any>[] = [
      // Inscriptions actives (OPEN ou IN_PROGRESS)
      prisma.tournamentPlayer.findMany({
        where: {
          userId,
          tournament: { status: { in: ['OPEN', 'IN_PROGRESS'] } },
        },
        include: {
          tournament: { include: { game: { select: { name: true, slug: true } } } },
        },
        orderBy: { tournament: { date: 'asc' } },
      }),
      // Historique (COMPLETED)
      prisma.tournamentPlayer.findMany({
        where: {
          userId,
          tournament: { status: 'COMPLETED' },
        },
        include: {
          tournament: { include: { game: { select: { name: true, slug: true } } } },
        },
        orderBy: { tournament: { date: 'desc' } },
      }),
    ]

    if (isOrganizer) {
      queries.push(
        prisma.tournament.findMany({
          where: { organizerId: userId },
          include: { game: { select: { name: true, slug: true } }, _count: { select: { players: true } } },
          orderBy: { createdAt: 'desc' },
        })
      )
    }

    const results = await Promise.all(queries)
    activeRegistrations = results[0]
    pastRegistrations = results[1]
    if (isOrganizer) organizedTournaments = results[2]
  } catch {
    // DB not available
  }

  // Calcul des stats globales
  const totalWins = pastRegistrations.reduce((s: number, r: any) => s + (r.wins ?? 0), 0)
  const totalLosses = pastRegistrations.reduce((s: number, r: any) => s + (r.losses ?? 0), 0)
  const totalDraws = pastRegistrations.reduce((s: number, r: any) => s + (r.draws ?? 0), 0)
  const totalGames = totalWins + totalLosses + totalDraws
  const winrate = totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : null

  const statusLabel: Record<string, string> = {
    DRAFT: t('statusDraft'),
    OPEN: t('statusOpen'),
    IN_PROGRESS: t('statusInProgress'),
    COMPLETED: t('statusCompleted'),
    CANCELLED: t('statusCancelled'),
  }

  const statusColor: Record<string, string> = {
    DRAFT: 'bg-gray-700/50 text-gray-400',
    OPEN: 'bg-green-600/20 text-green-400',
    IN_PROGRESS: 'bg-orange-600/20 text-orange-400',
    COMPLETED: 'bg-blue-600/20 text-blue-400',
    CANCELLED: 'bg-red-600/20 text-red-400',
  }

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Header */}
      <section className="mb-10">
        <h1 className="text-4xl font-bold tracking-tighter mb-1">
          {t('welcome', { name: session.user.name?.split(' ')[0] ?? 'Player' })}
        </h1>
        <p className="text-gray-400 text-sm">{session.user.email}</p>
      </section>

      {/* Stats */}
      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">{t('statistics')}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-1 pt-4 px-4">
              <CardTitle className="text-xs font-medium text-gray-400 uppercase tracking-wider">{t('wins')}</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="text-3xl font-bold text-green-500">{totalWins}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1 pt-4 px-4">
              <CardTitle className="text-xs font-medium text-gray-400 uppercase tracking-wider">{t('losses')}</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="text-3xl font-bold text-red-500">{totalLosses}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1 pt-4 px-4">
              <CardTitle className="text-xs font-medium text-gray-400 uppercase tracking-wider">{t('draws')}</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="text-3xl font-bold text-gray-400">{totalDraws}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1 pt-4 px-4">
              <CardTitle className="text-xs font-medium text-gray-400 uppercase tracking-wider">{t('ratio')}</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="text-3xl font-bold text-orange-500">
                {winrate !== null ? `${winrate}%` : '—'}
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Inscriptions actives */}
      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">{t('myRegistrations')}</h2>
        {activeRegistrations.length === 0 ? (
          <div className="border border-dashed border-gray-700 rounded-xl py-10 text-center">
            <p className="text-gray-400 mb-4">{t('noRegistrations')}</p>
            <Link
              href={`/${locale}/tournois`}
              className="inline-flex items-center justify-center rounded-lg bg-orange-600 hover:bg-orange-700 px-4 py-2 text-sm font-medium text-white transition-colors"
            >
              {t('myTournaments')}
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {activeRegistrations.map((reg: any) => {
              const t_ = reg.tournament
              return (
                <Card key={reg.id} className="hover:border-orange-600/50 transition-colors">
                  <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[t_.status]}`}>
                          {statusLabel[t_.status]}
                        </span>
                        <span className="text-xs text-gray-500">{t_.game.name}</span>
                      </div>
                      <h3 className="font-semibold truncate">{t_.name}</h3>
                      <p className="text-sm text-gray-400 mt-0.5">
                        {new Date(t_.date).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
                          day: 'numeric', month: 'long', year: 'numeric',
                        })}
                        {t_.location && ` — ${t_.location}`}
                      </p>
                    </div>
                    <Link href={`/${locale}/tournois/${t_.id}`}>
                      <Button variant="outline" size="sm">{t('view')}</Button>
                    </Link>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </section>

      {/* Historique */}
      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">{t('pastTournaments')}</h2>
        {pastRegistrations.length === 0 ? (
          <div className="border border-dashed border-gray-700 rounded-xl py-8 text-center">
            <p className="text-gray-400">{t('noPastTournaments')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {pastRegistrations.map((reg: any) => {
              const t_ = reg.tournament
              const total = (reg.wins ?? 0) + (reg.losses ?? 0) + (reg.draws ?? 0)
              return (
                <Card key={reg.id} className="opacity-75 hover:opacity-100 transition-opacity">
                  <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate text-gray-200">{t_.name}</h3>
                      <div className="flex gap-3 text-sm text-gray-500 mt-0.5">
                        <span>{t_.game.name}</span>
                        <span>
                          {new Date(t_.date).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
                            day: 'numeric', month: 'short', year: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>
                    {total > 0 && (
                      <div className="flex gap-3 text-sm font-mono shrink-0">
                        <span className="text-green-500">{reg.wins}V</span>
                        <span className="text-red-400">{reg.losses}D</span>
                        {reg.draws > 0 && <span className="text-gray-400">{reg.draws}N</span>}
                      </div>
                    )}
                    <Link href={`/${locale}/tournois/${t_.id}`}>
                      <Button variant="ghost" size="sm" className="text-gray-500">{t('view')}</Button>
                    </Link>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </section>

      {/* Section organisateur */}
      {isOrganizer && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">{t('myOrganizedTournaments')}</h2>
            <Link
              href={`/${locale}/tournois/nouveau`}
              className="inline-flex items-center justify-center rounded-lg bg-orange-600 hover:bg-orange-700 px-4 py-2 text-sm font-medium text-white transition-colors"
            >
              + {t('createTournament')}
            </Link>
          </div>
          {organizedTournaments.length === 0 ? (
            <div className="border border-dashed border-gray-700 rounded-xl py-8 text-center">
              <p className="text-gray-400">{t('noOrganizedTournaments')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {organizedTournaments.map((tournament: any) => (
                <Card key={tournament.id} className="hover:border-orange-600/50 transition-colors">
                  <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[tournament.status]}`}>
                          {statusLabel[tournament.status]}
                        </span>
                        <span className="text-xs text-gray-500">{tournament.game.name}</span>
                        <span className="text-xs text-gray-600">
                          {t('playersCount', { count: tournament._count.players })}
                        </span>
                      </div>
                      <h3 className="font-semibold truncate">{tournament.name}</h3>
                      <p className="text-sm text-gray-400 mt-0.5">
                        {new Date(tournament.date).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
                          day: 'numeric', month: 'long', year: 'numeric',
                        })}
                        {tournament.location && ` — ${tournament.location}`}
                      </p>
                    </div>
                    <Link href={`/${locale}/tournois/${tournament.id}`}>
                      <Button variant="outline" size="sm">{t('manage')}</Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  )
}
