import { getTranslations } from 'next-intl/server'
import { auth } from '@/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { notFound } from 'next/navigation'
import { RegisterButton } from '@/components/register-button'

export default async function TournamentDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale, id } = await params
  const session = await auth()
  const t = await getTranslations({ locale, namespace: 'tournaments' })

  try {
    const response = await fetch(
      `${process.env.AUTH_URL || 'http://localhost:3000'}/api/tournaments/${id}`,
      { cache: 'no-store' }
    )

    if (!response.ok) {
      notFound()
    }

    const tournament = await response.json()

    const isFull = tournament.players.length >= tournament.maxPlayers
    const spotsLeft = tournament.maxPlayers - tournament.players.length
    const isRegistered = session?.user?.id
      ? tournament.players.some((p: any) => p.userId === session.user?.id)
      : false

    const date = new Date(tournament.date).toLocaleDateString(
      locale === 'fr' ? 'fr-FR' : 'en-US',
      {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }
    )

    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1">
              <div className="text-sm text-orange-500 font-semibold mb-2">
                {tournament.game.name}
              </div>
              <h1 className="text-4xl font-bold tracking-tighter mb-2">
                {tournament.name}
              </h1>
              <p className="text-gray-400">{tournament.description}</p>
            </div>

            {/* Status */}
            <div className="text-right">
              <div
                className={`inline-block px-4 py-2 rounded-lg font-semibold mb-4 ${
                  isFull
                    ? 'bg-red-600/20 text-red-400'
                    : 'bg-green-600/20 text-green-400'
                }`}
              >
                {isFull ? t('full') : t('available')}
              </div>
              <p className="text-gray-400">
                {tournament.players.length}/{tournament.maxPlayers} {t('places')}
              </p>
              {!isFull && (
                <p className="text-xs text-gray-500 mt-1">
                  {spotsLeft} spot{spotsLeft > 1 ? 's' : ''} available
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Main Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">{t('date')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold">{date}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">{t('location')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold">{tournament.location || 'TBD'}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Format</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold capitalize">
                {tournament.format.toLowerCase().replace('_', ' ')}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Registration Card */}
        {session?.user ? (
          <Card className="mb-12 border-orange-600/50 bg-orange-600/5">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold mb-1">
                    {isRegistered ? 'Vous êtes inscrit' : 'Vous pouvez vous inscrire'}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {isRegistered
                      ? 'Vous participez à ce tournoi'
                      : 'Rejoignez ce tournoi dès maintenant'}
                  </p>
                </div>
                <RegisterButton
                  tournamentId={tournament.id}
                  isRegistered={isRegistered}
                  isFull={isFull}
                  factions={tournament.game.factions ?? []}
                  registerLabel={t('register')}
                  unregisterLabel={t('unregister')}
                  fullLabel={t('full')}
                />
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-12 border-yellow-600/50 bg-yellow-600/5">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold mb-1">Connexion requise</h3>
                  <p className="text-sm text-gray-400">
                    Veuillez vous connecter pour vous inscrire au tournoi
                  </p>
                </div>
                <Button
                  className="bg-yellow-600 hover:bg-yellow-700"
                  disabled
                >
                  Connexion requise
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Players List */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Joueurs inscrits</h2>
          <Card>
            {tournament.players.length === 0 ? (
              <CardContent className="py-8 text-center text-gray-400">
                Aucun joueur inscrit pour le moment
              </CardContent>
            ) : (
              <div className="divide-y divide-gray-700">
                {tournament.players.map((player: any, idx: number) => (
                  <div key={player.id} className="p-4 flex items-center gap-3">
                    <span className="text-gray-500 font-semibold">
                      {idx + 1}.
                    </span>
                    <div className="flex-1">
                      <p className="font-semibold">{player.user.name}</p>
                      {player.factionRef?.name && (
                        <p className="text-sm text-gray-400">{player.factionRef.name}</p>
                      )}
                    </div>
                    <div className="text-right text-sm text-gray-400">
                      Inscrit le{' '}
                      {new Date(player.registeredAt).toLocaleDateString(
                        locale === 'fr' ? 'fr-FR' : 'en-US'
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </section>

        {/* Organizer Info */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Organisateur</h2>
          <Card>
            <CardContent className="p-6">
              <div>
                <p className="font-semibold">{tournament.organizer.name}</p>
                <p className="text-sm text-gray-400">
                  {tournament.organizer.email}
                </p>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    )
  } catch (error) {
    console.error('Error loading tournament:', error)
    notFound()
  }
}
