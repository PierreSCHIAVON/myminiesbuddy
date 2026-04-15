import { getTranslations } from 'next-intl/server'
import { auth, signOut } from '@/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@warforge/db'
import { ProfileNameEditor } from '@/components/profile-name-editor'
import { ProfileCountrySelector } from '@/components/profile-country-selector'

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const session = await auth()
  const { locale } = await params

  if (!session?.user) {
    redirect(`/${locale}`)
  }

  const t = await getTranslations({ locale, namespace: 'profile' })

  const userId = session.user.id as string
  const role = (session.user.role as string) ?? 'PLAYER'

  let dbUser: { name: string | null; country: string | null; createdAt: Date } | null = null
  let participations: any[] = []

  try {
    ;[dbUser, participations] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, country: true, createdAt: true },
      }),
      prisma.tournamentPlayer.findMany({
        where: { userId },
        include: {
          tournament: {
            select: {
              id: true,
              name: true,
              date: true,
              status: true,
              game: { select: { name: true } },
            },
          },
        },
        orderBy: { tournament: { date: 'desc' } },
      }),
    ])
  } catch {
    // DB not available
  }

  const displayName = dbUser?.name ?? session.user.name ?? 'Player'
  const memberSince = dbUser?.createdAt
    ? new Date(dbUser.createdAt).toLocaleDateString(
        locale === 'fr' ? 'fr-FR' : 'en-US',
        { month: 'long', year: 'numeric' }
      )
    : null

  // Stats globales (tous statuts confondus)
  const totalWins = participations.reduce((s, p) => s + (p.wins ?? 0), 0)
  const totalLosses = participations.reduce((s, p) => s + (p.losses ?? 0), 0)
  const totalDraws = participations.reduce((s, p) => s + (p.draws ?? 0), 0)
  const totalGames = totalWins + totalLosses + totalDraws
  const winrate = totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : null
  const tournamentsPlayed = participations.filter(
    (p) => p.tournament.status === 'COMPLETED'
  ).length

  // Historique : 5 derniers tournois terminés
  const recentHistory = participations
    .filter((p) => p.tournament.status === 'COMPLETED')
    .slice(0, 5)

  const roleLabel: Record<string, string> = {
    PLAYER: t('rolePlayer'),
    ORGANIZER: t('roleOrganizer'),
    ADMIN: t('roleAdmin'),
  }

  const roleColor: Record<string, string> = {
    PLAYER: 'bg-gray-700/50 text-gray-300',
    ORGANIZER: 'bg-orange-600/20 text-orange-400',
    ADMIN: 'bg-purple-600/20 text-purple-400',
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <section className="mb-10">
        <h1 className="text-4xl font-bold tracking-tighter">{t('title')}</h1>
        {memberSince && (
          <p className="text-gray-500 text-sm mt-1">{t('memberSince')} {memberSince}</p>
        )}
      </section>

      {/* Infos personnelles */}
      <section className="mb-8">
        <h2 className="text-lg font-bold mb-4">{t('personalInfo')}</h2>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-6">
              <Avatar className="h-16 w-16 shrink-0">
                <AvatarImage src={session.user.image ?? ''} alt={displayName} />
                <AvatarFallback className="bg-orange-600 text-white text-xl font-bold">
                  {displayName[0]?.toUpperCase() ?? 'U'}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 space-y-4 min-w-0">
                <ProfileNameEditor
                  currentName={displayName}
                  labels={{
                    name: t('name'),
                    edit: t('edit'),
                    save: t('save'),
                    cancel: t('cancel'),
                    editSuccess: t('editSuccess'),
                    editError: t('editError'),
                    nameTooShort: t('nameTooShort'),
                  }}
                />

                <ProfileCountrySelector
                  currentCountry={dbUser?.country ?? null}
                  locale={locale}
                  labels={{
                    country: t('country'),
                    edit: t('edit'),
                    save: t('save'),
                    cancel: t('cancel'),
                    noCountry: t('noCountry'),
                    saveSuccess: t('editSuccess'),
                    saveError: t('editError'),
                  }}
                />

                <div>
                  <label className="text-sm font-medium text-gray-400">{t('email')}</label>
                  <p className="text-base mt-0.5">{session.user.email}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-400">{t('role')}</label>
                  <div className="mt-1">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${roleColor[role] ?? roleColor.PLAYER}`}>
                      {roleLabel[role] ?? role}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Stats globales */}
      <section className="mb-8">
        <h2 className="text-lg font-bold mb-4">{t('stats')}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: t('wins'), value: totalWins, color: 'text-green-500' },
            { label: t('losses'), value: totalLosses, color: 'text-red-500' },
            { label: t('draws'), value: totalDraws, color: 'text-gray-400' },
            {
              label: t('winrate'),
              value: winrate !== null ? `${winrate}%` : '—',
              color: 'text-orange-400',
            },
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
        {tournamentsPlayed > 0 && (
          <p className="text-sm text-gray-500 mt-2">
            {tournamentsPlayed} {t('tournamentsPlayed')}
          </p>
        )}
      </section>

      {/* Historique récent */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">{t('recentHistory')}</h2>
          {participations.length > 5 && (
            <Link
              href={`/${locale}/dashboard`}
              className="text-sm text-gray-400 hover:text-orange-400 transition-colors"
            >
              Tout voir →
            </Link>
          )}
        </div>
        {recentHistory.length === 0 ? (
          <div className="border border-dashed border-gray-700 rounded-xl py-8 text-center text-gray-400">
            {t('noHistory')}
          </div>
        ) : (
          <Card>
            <div className="divide-y divide-gray-800">
              {recentHistory.map((p: any) => {
                const total = (p.wins ?? 0) + (p.losses ?? 0) + (p.draws ?? 0)
                return (
                  <div key={p.id} className="px-4 py-3 flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{p.tournament.name}</p>
                      <div className="flex gap-2 text-xs text-gray-500 mt-0.5">
                        <span>{p.tournament.game.name}</span>
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
                      <Link
                        href={`/${locale}/tournois/${p.tournament.id}`}
                        className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                      >
                        Voir →
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        )}
      </section>

      {/* Préférences */}
      <section className="mb-8">
        <h2 className="text-lg font-bold mb-4">{t('preferences')}</h2>
        <Card>
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-400">{t('language')}</label>
                <p className="mt-0.5">{locale === 'fr' ? 'Français' : 'English'}</p>
              </div>
              <div className="flex gap-2">
                {['fr', 'en'].map((l) => (
                  <Link
                    key={l}
                    href={`/${l}/profil`}
                    className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${
                      locale === l
                        ? 'border-orange-600/50 bg-orange-600/10 text-orange-400'
                        : 'border-gray-700 text-gray-400 hover:border-gray-500'
                    }`}
                  >
                    {l === 'fr' ? 'FR' : 'EN'}
                  </Link>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Déconnexion */}
      <section className="border-t border-gray-800 pt-8">
        <h2 className="text-lg font-bold mb-4">{t('security')}</h2>
        <form
          action={async () => {
            'use server'
            await signOut({ redirectTo: `/${locale}` })
          }}
        >
          <Button type="submit" variant="destructive" className="w-full sm:w-auto">
            {t('logout')}
          </Button>
        </form>
      </section>
    </div>
  )
}
