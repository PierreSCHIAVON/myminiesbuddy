import { getTranslations } from 'next-intl/server'
import { auth } from '@/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { notFound } from 'next/navigation'
import { RegisterButton } from '@/components/register-button'
import { TournamentAdminPanel } from '@/components/tournament-admin-panel'
import { TournamentRounds } from '@/components/tournament-rounds'
import { TournamentBracket } from '@/components/tournament-bracket'
import { ArmyListEditor } from '@/components/army-list-editor'
import { prisma } from '@warforge/db'
import Link from 'next/link'
import type { Metadata } from 'next'

// ─── Metadata pour les previews de partage (OG / Twitter) ───────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}): Promise<Metadata> {
  const { id } = await params

  let tournament: { name: string; description: string | null; date: Date; location: string | null; status: string; game: { name: string } } | null = null
  try {
    tournament = await prisma.tournament.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      select: {
        name: true,
        description: true,
        date: true,
        location: true,
        status: true,
        game: { select: { name: true } },
      },
    })
  } catch { /* DB unavailable */ }

  if (!tournament) return { title: 'Tournoi introuvable' }

  const date = new Date(tournament.date).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
  const location = tournament.location ? ` · ${tournament.location}` : ''
  const description = tournament.description
    ?? `${tournament.game.name} · ${date}${location}`

  return {
    title: tournament.name,
    description,
    openGraph: {
      title: tournament.name,
      description,
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title: tournament.name,
      description,
    },
  }
}

export default async function TournamentDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale, id } = await params
  const session = await auth()
  const t = await getTranslations({ locale, namespace: 'tournaments' })

  let tournament: any = null

  try {
    tournament = await prisma.tournament.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      include: {
        game: {
          include: {
            factions: { orderBy: [{ group: 'asc' }, { name: 'asc' }] },
          },
        },
        organizer: { select: { id: true, name: true, email: true } },
        players: {
          include: {
            user: { select: { id: true, name: true, email: true } },
            factionRef: { select: { id: true, name: true } },
          },
          orderBy: { registeredAt: 'asc' },
        },
        teams: {
          include: {
            players: {
              include: { user: { select: { id: true, name: true, email: true } } },
              orderBy: { registeredAt: 'asc' },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        rounds: {
          include: {
            matches: {
              include: {
                player1: { include: { user: { select: { id: true, name: true } } } },
                player2: { include: { user: { select: { id: true, name: true } } } },
              },
            },
            teamMatches: {
              include: {
                team1: true,
                team2: true,
                matches: {
                  include: {
                    player1: { include: { user: { select: { id: true, name: true } } } },
                    player2: { include: { user: { select: { id: true, name: true } } } },
                  },
                  orderBy: { table: 'asc' },
                },
              },
            },
          },
          orderBy: { number: 'asc' },
        },
        bracketMatches: {
          include: {
            player1: { include: { user: { select: { id: true, name: true } } } },
            player2: { include: { user: { select: { id: true, name: true } } } },
            team1: true,
            team2: true,
          },
          orderBy: [{ roundOf: 'desc' }, { position: 'asc' }],
        },
      },
    })
  } catch {
    // DB not available
  }

  if (!tournament) notFound()

  const userId = session?.user?.id as string | undefined
  const userRole = (session?.user?.role as string) ?? ''

  const isFull = tournament.players.length >= tournament.maxPlayers
  const spotsLeft = tournament.maxPlayers - tournament.players.length
  const myRegistration = userId
    ? tournament.players.find((p: any) => p.user.id === userId)
    : null
  const isRegistered = !!myRegistration
  const isOrganizer =
    userId === tournament.organizer.id ||
    session?.user?.email === tournament.organizer.email ||
    userRole === 'ADMIN'

  const statusColor: Record<string, string> = {
    DRAFT: 'bg-gray-700/50 text-gray-400',
    OPEN: 'bg-green-600/20 text-green-400',
    IN_PROGRESS: 'bg-orange-600/20 text-orange-400',
    COMPLETED: 'bg-blue-600/20 text-blue-400',
    CANCELLED: 'bg-red-600/20 text-red-400',
  }

  const statusLabel: Record<string, string> = {
    DRAFT: t('statusDraft'),
    OPEN: t('statusOpen'),
    IN_PROGRESS: t('statusInProgress'),
    COMPLETED: t('statusCompleted'),
    CANCELLED: t('statusCancelled'),
  }

  const date = new Date(tournament.date).toLocaleDateString(
    locale === 'fr' ? 'fr-FR' : 'en-US',
    { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
  )

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      {/* Back */}
      <Link
        href={`/${locale}/tournois`}
        className="text-sm text-gray-400 hover:text-foreground transition-colors mb-6 inline-block"
      >
        ← {t('title')}
      </Link>

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
            {tournament.description && (
              <p className="text-gray-400">{tournament.description}</p>
            )}
          </div>

          <div className="text-right shrink-0">
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold mb-3 ${statusColor[tournament.status]}`}>
              {statusLabel[tournament.status]}
            </span>
            <p className="text-gray-400 text-sm">
              {tournament.players.length}/{tournament.maxPlayers} {t('places')}
            </p>
            {!isFull && tournament.status === 'OPEN' && (
              <p className="text-xs text-gray-500 mt-1">
                {spotsLeft} {t('spotsLeft')}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Panneau organisateur */}
      {isOrganizer && (
        <TournamentAdminPanel
          tournamentId={tournament.id}
          currentStatus={tournament.status}
          locale={locale}
          factions={tournament.game.factions}
          teamSize={tournament.teamSize ?? null}
          teams={tournament.teams ?? []}
          unassignedPlayers={
            tournament.teamSize
              ? tournament.players
                  .filter((p: any) => !p.teamId)
                  .map((p: any) => ({
                    id: p.id,
                    user: p.user,
                    pseudo: p.pseudo,
                  }))
              : []
          }
          labels={{
            adminPanel: t('adminPanel'),
            publishTournament: t('publishTournament'),
            startTournament: t('startTournament'),
            completeTournament: t('completeTournament'),
            cancelTournament: t('cancelTournament'),
            deleteTournament: t('deleteTournament'),
            deleteConfirm: t('deleteConfirm'),
            actionError: t('actionError'),
            addPlayer: t('addPlayer'),
            addPlayerSearch: t('addPlayerSearch'),
            addPlayerFaction: t('addPlayerFaction'),
            addPlayerFactionNone: t('addPlayerFactionNone'),
            addPlayerConfirm: t('addPlayerConfirm'),
            addPlayerSuccess: t('addPlayerSuccess'),
            addPlayerError: t('addPlayerError'),
            addPlayerAlready: t('addPlayerAlready'),
            teamsTitle: 'Équipes',
            createTeam: 'Créer une équipe',
            teamNamePlaceholder: 'Nom de l\'équipe',
            createTeamButton: 'Créer',
            deleteTeam: 'Supprimer',
            deleteTeamConfirm: 'Supprimer cette équipe et désassigner ses joueurs ?',
            assignPlayer: '+ Assigner un joueur',
            assignNone: '—',
            removePlayer: 'Retirer',
            createTeamError: 'Erreur lors de la création',
            createTeamDuplicate: 'Ce nom d\'équipe est déjà utilisé',
          }}
        />
      )}

      {/* Info cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-gray-400 uppercase tracking-wider">{t('date')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-semibold capitalize">{date}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-gray-400 uppercase tracking-wider">{t('location')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-semibold">{tournament.location || '—'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-gray-400 uppercase tracking-wider">Format</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-semibold capitalize">
              {tournament.format.toLowerCase().replace('_', ' ')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Bloc inscription */}
      {tournament.status === 'OPEN' && (
        <div className="mb-10 space-y-4">
          {session?.user ? (
            <>
              <Card className="border-orange-600/50 bg-orange-600/5">
                <CardContent className="p-6 flex items-start justify-between gap-4 flex-col sm:flex-row">
                  <div>
                    <h3 className="font-semibold mb-1">
                      {isRegistered ? t('alreadyRegistered') : t('canRegister')}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {isRegistered ? t('alreadyRegisteredDesc') : t('canRegisterDesc')}
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
                    pseudoLabel={!isRegistered ? t('pseudo') : undefined}
                    pseudoPlaceholder={t('pseudoPlaceholder')}
                    pseudoOptional={t('pseudoOptional')}
                    teamNameLabel={!isRegistered ? t('teamName') : undefined}
                    teamNamePlaceholder={t('teamNamePlaceholder')}
                    teamNameOptional={t('teamNameOptional')}
                    armyListLabel={!isRegistered ? t('armyList') : undefined}
                    armyListPlaceholder={t('armyListPlaceholder')}
                    armyListOptional={t('armyListOptional')}
                  />
                </CardContent>
              </Card>
              {/* Éditeur de liste pour le joueur déjà inscrit */}
              {isRegistered && (
                <ArmyListEditor
                  tournamentId={tournament.id}
                  currentList={myRegistration?.listNotes ?? null}
                  pointsLimit={tournament.pointsLimit}
                  labels={{
                    armyList: t('armyList'),
                    armyListPlaceholder: t('armyListPlaceholder'),
                    armyListOptional: t('armyListOptional'),
                    armyListEdit: t('armyListEdit'),
                    armyListSave: t('armyListSave'),
                    armyListCancel: t('armyListCancel'),
                    armyListSaved: t('armyListSaved'),
                    armyListError: t('armyListError'),
                    armyListEmpty: t('armyListEmpty'),
                    armyListPointsLimit: tournament.pointsLimit ? t('armyListPointsLimit', { limit: tournament.pointsLimit }) : '',
                  }}
                />
              )}
            </>
          ) : (
            <Card className="border-yellow-600/50 bg-yellow-600/5">
              <CardContent className="p-6 flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold mb-1">{t('loginRequired')}</h3>
                  <p className="text-sm text-gray-400">{t('loginRequiredDesc')}</p>
                </div>
                <Button className="bg-yellow-600 hover:bg-yellow-700" disabled>
                  {t('loginRequired')}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Liste des joueurs */}
      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">
          {t('registeredPlayers')} ({tournament.players.length})
        </h2>
        <Card>
          {tournament.players.length === 0 ? (
            <CardContent className="py-8 text-center text-gray-400">
              {t('noPlayersYet')}
            </CardContent>
          ) : (
            <div className="divide-y divide-gray-800">
              {tournament.players.map((player: any, idx: number) => (
                <div key={player.id} className="p-4 flex items-center gap-3">
                  <span className="text-gray-600 font-mono text-sm w-6 shrink-0">
                    {idx + 1}.
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold truncate">
                        {player.pseudo ?? player.user.name}
                      </p>
                      {player.pseudo && (
                        <span className="text-xs text-gray-500">({player.user.name})</span>
                      )}
                      {player.teamName && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-gray-700/60 text-gray-400">
                          {player.teamName}
                        </span>
                      )}
                    </div>
                    {player.factionRef?.name && (
                      <p className="text-sm text-gray-400">{player.factionRef.name}</p>
                    )}
                  </div>
                  <div className="text-right text-xs text-gray-500 shrink-0">
                    {t('registeredOn')}{' '}
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

      {/* Listes d'armées — visible par l'organisateur */}
      {isOrganizer && tournament.players.some((p: any) => p.listNotes) && (
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-4">{t('armyListsTitle')}</h2>
          <div className="space-y-3">
            {tournament.players
              .filter((p: any) => p.listNotes)
              .map((player: any) => (
                <Card key={player.id} className="border-gray-700/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-semibold">{player.user.name}</p>
                        {player.factionRef?.name && (
                          <p className="text-xs text-gray-400">{player.factionRef.name}</p>
                        )}
                      </div>
                      {tournament.pointsLimit && (
                        <span className="text-xs text-orange-400">
                          {t('armyListPointsLimit', { limit: tournament.pointsLimit })}
                        </span>
                      )}
                    </div>
                    <pre className="text-sm text-gray-300 font-mono whitespace-pre-wrap wrap-break-word bg-gray-900/50 rounded-lg p-3 max-h-48 overflow-y-auto">
                      {player.listNotes}
                    </pre>
                  </CardContent>
                </Card>
              ))}
          </div>
        </section>
      )}

      {/* Rondes & Classement */}
      {(tournament.status === 'IN_PROGRESS' || tournament.status === 'COMPLETED') && (
        <section className="mb-10">
          <TournamentRounds
            tournamentId={tournament.id}
            rounds={tournament.rounds}
            players={tournament.players}
            teams={tournament.teams}
            teamSize={tournament.teamSize}
            isOrganizer={isOrganizer}
            tournamentStatus={tournament.status}
            labels={{
              roundTitle: t('roundTitle'),
              generateRound: t('generateRound'),
              allRoundsComplete: t('allRoundsComplete'),
              table: t('table'),
              byeEarned: t('byeEarned'),
              byeAbsent: t('byeAbsent'),
              pending: t('resultPending'),
              completed: t('resultCompleted'),
              submitResult: t('submitResult'),
              standings: t('standings'),
              player: t('player'),
              pts: t('pts'),
              w: t('w'),
              l: t('l'),
              d: t('d'),
              generating: t('generating'),
              errorGenerate: t('errorGenerate'),
              errorSubmit: t('errorSubmitResult'),
              absentPlayers: t('absentPlayers'),
              markAbsent: t('markAbsent'),
            }}
          />
        </section>
      )}

      {/* Top-cut / Bracket */}
      {(tournament.status === 'IN_PROGRESS' || tournament.status === 'COMPLETED') && (
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-4">Top-cut</h2>
          <TournamentBracket
            tournamentId={tournament.id}
            matches={tournament.bracketMatches ?? []}
            isOrganizer={isOrganizer}
            topCutSize={tournament.topCutSize ?? null}
            tournamentStatus={tournament.status}
            players={tournament.players.map((p: any) => ({
              id: p.id,
              user: p.user,
              pseudo: p.pseudo ?? null,
              points: p.points,
              wins: p.wins,
              sos: p.sos,
            }))}
            teams={tournament.teams ?? null}
            teamSize={tournament.teamSize ?? null}
            labels={{
              startTopCut: 'Démarrer le top-cut',
              topCutSize: 'Taille',
              generate: 'Générer le bracket',
              generating: 'Génération…',
              round: 'Round',
              final: 'Finale',
              semiFinal: 'Demi-finales',
              quarterFinal: 'Quarts de finale',
              roundOf: 'Top',
              bye: 'BYE',
              tbd: 'À déterminer',
              submit: 'Valider',
              submitting: '…',
              draw: 'Les matchs de bracket ne peuvent pas être nuls',
              bracketExists: 'Le bracket démarrera après les rondes Swiss.',
              winner: 'Vainqueur',
            }}
          />
        </section>
      )}

      {/* Organisateur */}
      <section>
        <h2 className="text-xl font-bold mb-4">{t('organizer')}</h2>
        <Card>
          <CardContent className="p-5">
            <p className="font-semibold">{tournament.organizer.name}</p>
            <p className="text-sm text-gray-400">{tournament.organizer.email}</p>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
