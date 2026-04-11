import { getTranslations } from 'next-intl/server'
import { auth } from '@/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { redirect } from 'next/navigation'

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

  const stats = [
    {
      label: t('wins'),
      value: '0',
      className: 'text-green-500',
    },
    {
      label: t('losses'),
      value: '0',
      className: 'text-red-500',
    },
    {
      label: t('ratio'),
      value: '-',
      className: 'text-gray-400',
    },
  ]

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Welcome Section */}
      <section className="mb-12">
        <h1 className="text-4xl font-bold tracking-tighter mb-2">
          {t('welcome', { name: session.user.name || 'Player' })}
        </h1>
        <p className="text-gray-400">
          Manage your tournaments and track your progress
        </p>
      </section>

      {/* Statistics */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">{t('statistics')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">
                  {stat.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-3xl font-bold ${stat.className}`}>
                  {stat.value}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Tournaments Section */}
      <section className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">{t('myTournaments')}</h2>
          <Button className="bg-orange-600 hover:bg-orange-700">
            Créer un tournoi
          </Button>
        </div>

        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-400 mb-4">{t('noTournaments')}</p>
            <Button variant="outline">
              {t('myTournamentsDesc')}
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Recent Activity */}
      <section>
        <h2 className="text-2xl font-bold mb-6">{t('recentActivity')}</h2>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-400">Aucune activité récente</p>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
