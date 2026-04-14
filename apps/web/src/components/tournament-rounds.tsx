'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Player {
  id: string
  user: { name: string | null }
  pseudo: string | null
  wins: number
  losses: number
  draws: number
  points: number
  teamId?: string | null
}

interface Match {
  id: string
  table: number | null
  status: string
  player1Id: string
  player2Id: string | null
  player1Score: number | null
  player2Score: number | null
  winnerId: string | null
  teamMatchId?: string | null
  player1: Player
  player2: Player | null
}

interface TeamMatch {
  id: string
  status: string
  team1Id: string
  team2Id: string | null
  team1TableWins: number
  team2TableWins: number
  winnerId: string | null
  team1: { id: string; name: string }
  team2: { id: string; name: string } | null
  matches: Match[]
}

interface Round {
  id: string
  number: number
  status: string
  matches: Match[]
  teamMatches?: TeamMatch[]
}

interface Team {
  id: string
  name: string
  wins: number
  losses: number
  draws: number
  points: number
  players: { id: string }[]
}

interface Props {
  tournamentId: string
  rounds: Round[]
  players: Player[]
  teams?: Team[]
  teamSize?: number | null
  isOrganizer: boolean
  tournamentStatus: string
  labels: {
    roundTitle: string
    generateRound: string
    allRoundsComplete: string
    table: string
    byeEarned: string
    byeAbsent: string
    pending: string
    completed: string
    submitResult: string
    generating: string
    standings: string
    player: string
    pts: string
    w: string
    l: string
    d: string
    errorGenerate: string
    errorSubmit: string
    absentPlayers: string
    markAbsent: string
  }
}

function MatchRow({
  match,
  tournamentId,
  roundId,
  isOrganizer,
  labels,
  onUpdated,
  compact = false,
}: {
  match: Match
  tournamentId: string
  roundId: string
  isOrganizer: boolean
  labels: Props['labels']
  onUpdated: () => void
  compact?: boolean
}) {
  const [p1Score, setP1Score] = useState(match.player1Score ?? 0)
  const [p2Score, setP2Score] = useState(match.player2Score ?? 0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)

  // BYE
  if (match.status === 'BYE') {
    const isEarned = match.winnerId === match.player1Id
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/40">
        {match.table !== null && (
          <span className="text-xs text-gray-500 w-12 shrink-0">T{match.table}</span>
        )}
        <span className={`flex-1 font-medium ${!isEarned ? 'text-gray-500' : ''}`}>
          {match.player1.pseudo ?? match.player1.user.name}
          {!isEarned && <span className="text-xs text-gray-600 ml-1">(absent)</span>}
        </span>
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            isEarned ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'
          }`}
        >
          {isEarned ? labels.byeEarned : labels.byeAbsent}
        </span>
      </div>
    )
  }

  async function handleSubmit() {
    setError(null)
    setLoading(true)
    try {
      const res = await fetch(
        `/api/tournaments/${tournamentId}/rounds/${roundId}/matches/${match.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ player1Score: p1Score, player2Score: p2Score }),
        }
      )
      if (!res.ok) {
        const json = await res.json()
        setError(json.error || labels.errorSubmit)
        return
      }
      setEditing(false)
      onUpdated()
    } catch {
      setError(labels.errorSubmit)
    } finally {
      setLoading(false)
    }
  }

  const winner =
    match.winnerId === match.player1Id
      ? 'p1'
      : match.winnerId === match.player2Id
        ? 'p2'
        : match.status === 'COMPLETED'
          ? 'draw'
          : null

  const showInput = isOrganizer && (match.status !== 'COMPLETED' || editing)
  const indentClass = compact ? '' : 'pl-14'

  return (
    <div className={`p-3 rounded-lg bg-gray-800/40 space-y-2 ${compact ? 'text-sm' : ''}`}>
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500 w-12 shrink-0">T{match.table ?? '—'}</span>
        <span
          className={`flex-1 font-medium truncate ${winner === 'p1' ? 'text-green-400' : winner === 'p2' ? 'text-red-400' : ''}`}
        >
          {match.player1.pseudo ?? match.player1.user.name}
        </span>
        <span className="text-gray-500 text-sm shrink-0">vs</span>
        <span
          className={`flex-1 font-medium truncate text-right ${winner === 'p2' ? 'text-green-400' : winner === 'p1' ? 'text-red-400' : ''}`}
        >
          {match.player2 ? (match.player2.pseudo ?? match.player2.user.name) : '—'}
        </span>
      </div>

      {match.status === 'COMPLETED' && !editing && (
        <div className={`flex items-center gap-2 ${indentClass} text-sm`}>
          <span className={winner === 'p1' ? 'text-green-400 font-bold' : 'text-gray-300'}>
            {match.player1Score}
          </span>
          <span className="text-gray-600">—</span>
          <span className={winner === 'p2' ? 'text-green-400 font-bold' : 'text-gray-300'}>
            {match.player2Score}
          </span>
          {winner === 'draw' && <span className="text-xs text-gray-400 ml-1">nul</span>}
          {isOrganizer && (
            <button
              onClick={() => setEditing(true)}
              className="text-xs text-gray-500 hover:text-gray-300 ml-2 underline"
            >
              modifier
            </button>
          )}
        </div>
      )}

      {showInput && (
        <div className={`flex items-center gap-2 ${indentClass}`}>
          <input
            type="number"
            min={0}
            value={p1Score}
            onChange={(e) => setP1Score(Number(e.target.value))}
            className="w-14 text-center bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm"
          />
          <span className="text-gray-600 text-xs">—</span>
          <input
            type="number"
            min={0}
            value={p2Score}
            onChange={(e) => setP2Score(Number(e.target.value))}
            className="w-14 text-center bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm"
          />
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={loading}
            className="bg-orange-600 hover:bg-orange-700 text-white ml-2"
          >
            {loading ? '...' : labels.submitResult}
          </Button>
          {editing && (
            <button
              onClick={() => setEditing(false)}
              className="text-xs text-gray-500 hover:text-gray-300 underline"
            >
              annuler
            </button>
          )}
          {error && <span className="text-xs text-red-400">{error}</span>}
        </div>
      )}
    </div>
  )
}

// Bloc affichant un match d'équipe + ses matchs individuels
function TeamMatchBlock({
  teamMatch,
  tournamentId,
  roundId,
  isOrganizer,
  labels,
  onUpdated,
}: {
  teamMatch: TeamMatch
  tournamentId: string
  roundId: string
  isOrganizer: boolean
  labels: Props['labels']
  onUpdated: () => void
}) {
  const isCompleted = teamMatch.status === 'COMPLETED'
  const team1Won = teamMatch.winnerId === teamMatch.team1Id
  const team2Won = teamMatch.winnerId === teamMatch.team2Id
  const isDraw = isCompleted && !teamMatch.winnerId

  return (
    <div className="rounded-xl border border-gray-700/60 overflow-hidden">
      {/* En-tête du match d'équipe */}
      <div
        className={`px-4 py-3 flex items-center justify-between gap-3 ${
          isCompleted ? 'bg-gray-800/60' : 'bg-gray-800/30'
        }`}
      >
        <span
          className={`font-bold text-sm flex-1 truncate ${team1Won ? 'text-green-400' : team2Won ? 'text-red-400' : ''}`}
        >
          {teamMatch.team1.name}
        </span>

        {isCompleted ? (
          <div className="flex items-center gap-2 shrink-0 text-sm font-mono">
            <span className={`font-bold ${team1Won ? 'text-green-400' : 'text-gray-300'}`}>
              {teamMatch.team1TableWins}
            </span>
            <span className="text-gray-600">—</span>
            <span className={`font-bold ${team2Won ? 'text-green-400' : 'text-gray-300'}`}>
              {teamMatch.team2TableWins}
            </span>
            {isDraw && <span className="text-xs text-gray-400 ml-1">nul</span>}
          </div>
        ) : (
          <span className="text-xs text-orange-400 shrink-0 px-2 py-0.5 rounded-full bg-orange-600/10">
            {labels.pending}
          </span>
        )}

        <span
          className={`font-bold text-sm flex-1 text-right truncate ${team2Won ? 'text-green-400' : team1Won ? 'text-red-400' : ''}`}
        >
          {teamMatch.team2?.name ?? 'BYE'}
        </span>
      </div>

      {/* Matchs individuels */}
      {teamMatch.matches.length > 0 && (
        <div className="p-3 space-y-2 bg-gray-900/20">
          {[...teamMatch.matches]
            .sort((a, b) => (a.table ?? 0) - (b.table ?? 0))
            .map((match) => (
              <MatchRow
                key={match.id}
                match={match}
                tournamentId={tournamentId}
                roundId={roundId}
                isOrganizer={isOrganizer}
                labels={labels}
                onUpdated={onUpdated}
                compact
              />
            ))}
        </div>
      )}
    </div>
  )
}

export function TournamentRounds({
  tournamentId,
  rounds,
  players,
  teams,
  teamSize,
  isOrganizer,
  tournamentStatus,
  labels,
}: Props) {
  const router = useRouter()
  const [generating, setGenerating] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)
  const [absentIds, setAbsentIds] = useState<Set<string>>(new Set())

  const isTeamTournament = teamSize != null && teamSize > 0
  const lastRound = rounds[rounds.length - 1]
  const canGenerateRound =
    isOrganizer &&
    tournamentStatus === 'IN_PROGRESS' &&
    (!lastRound || lastRound.status === 'COMPLETED')

  function toggleAbsent(id: string) {
    setAbsentIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleGenerateRound() {
    setGenerateError(null)
    setGenerating(true)
    try {
      const body = isTeamTournament
        ? { absentTeamIds: [...absentIds] }
        : { absentPlayerIds: [...absentIds] }
      const res = await fetch(`/api/tournaments/${tournamentId}/rounds`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const json = await res.json()
        setGenerateError(json.error || labels.errorGenerate)
        return
      }
      setAbsentIds(new Set())
      router.refresh()
    } catch {
      setGenerateError(labels.errorGenerate)
    } finally {
      setGenerating(false)
    }
  }

  // Classement individuel trié par points desc
  const sortedPlayers = [...players].sort((a, b) => b.points - a.points || b.wins - a.wins)
  // Classement équipes trié par points desc
  const sortedTeams = teams ? [...teams].sort((a, b) => b.points - a.points || b.wins - a.wins) : []

  // Items pour le sélecteur d'absents
  const absentItems = isTeamTournament
    ? (teams ?? []).map((t) => ({ id: t.id, label: t.name }))
    : players.map((p) => ({ id: p.id, label: p.pseudo ?? p.user.name ?? '' }))

  const activeCount = absentItems.length - absentIds.size

  return (
    <div className="space-y-10">
      {/* Section génération + absents */}
      {canGenerateRound && (
        <section>
          <Card className="border-orange-600/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{labels.generateRound}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-400 mb-3">
                  {isTeamTournament ? 'Équipes absentes' : labels.absentPlayers}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {absentItems.map((item) => {
                    const isAbsent = absentIds.has(item.id)
                    return (
                      <label
                        key={item.id}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors select-none ${
                          isAbsent
                            ? 'border-red-500/50 bg-red-600/10 text-red-400'
                            : 'border-gray-700 hover:border-gray-500 text-gray-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isAbsent}
                          onChange={() => toggleAbsent(item.id)}
                          className="accent-red-500"
                        />
                        <span className="text-sm truncate">{item.label}</span>
                      </label>
                    )
                  })}
                </div>
                {absentIds.size > 0 && (
                  <p className="text-xs text-red-400 mt-2">
                    {absentIds.size} {isTeamTournament ? 'équipe' : 'joueur'}{absentIds.size > 1 ? 's' : ''} absent{absentIds.size > 1 ? 's' : ''} — recevront une défaite
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3">
                <Button
                  onClick={handleGenerateRound}
                  disabled={generating || activeCount < 2}
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                >
                  {generating ? labels.generating : labels.generateRound}
                </Button>
                {activeCount < 2 && (
                  <p className="text-xs text-red-400">
                    Il faut au moins 2 {isTeamTournament ? 'équipes actives' : 'joueurs actifs'}
                  </p>
                )}
              </div>

              {generateError && <p className="text-sm text-red-400">{generateError}</p>}
            </CardContent>
          </Card>
        </section>
      )}

      {/* Liste des rondes */}
      <section>
        <h2 className="text-xl font-bold mb-4">Rondes</h2>

        {rounds.length === 0 ? (
          <div className="border border-dashed border-gray-700 rounded-xl py-8 text-center text-gray-400">
            Aucune ronde générée pour le moment.
          </div>
        ) : (
          <div className="space-y-6">
            {[...rounds].reverse().map((round) => (
              <Card key={round.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      {labels.roundTitle} {round.number}
                    </CardTitle>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        round.status === 'COMPLETED'
                          ? 'bg-blue-600/20 text-blue-400'
                          : 'bg-orange-600/20 text-orange-400'
                      }`}
                    >
                      {round.status === 'COMPLETED' ? labels.completed : labels.pending}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {isTeamTournament && round.teamMatches && round.teamMatches.length > 0 ? (
                    // Affichage par team matches
                    round.teamMatches.map((tm) => (
                      <TeamMatchBlock
                        key={tm.id}
                        teamMatch={tm}
                        tournamentId={tournamentId}
                        roundId={round.id}
                        isOrganizer={isOrganizer}
                        labels={labels}
                        onUpdated={() => router.refresh()}
                      />
                    ))
                  ) : (
                    // Affichage individuel
                    round.matches
                      .sort((a, b) => {
                        if (a.table === null && b.table !== null) return 1
                        if (a.table !== null && b.table === null) return -1
                        return (a.table ?? 0) - (b.table ?? 0)
                      })
                      .map((match) => (
                        <MatchRow
                          key={match.id}
                          match={match}
                          tournamentId={tournamentId}
                          roundId={round.id}
                          isOrganizer={isOrganizer}
                          labels={labels}
                          onUpdated={() => router.refresh()}
                        />
                      ))
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Classements */}
      {rounds.length > 0 && (
        <section className="space-y-6">
          {/* Classement équipes */}
          {isTeamTournament && sortedTeams.length > 0 && (
            <>
              <h2 className="text-xl font-bold mb-4">Classement équipes</h2>
              <Card>
                <div className="divide-y divide-gray-800">
                  <div className="px-4 py-2 grid grid-cols-[2rem_1fr_3rem_3rem_3rem_3rem] gap-2 text-xs text-gray-500 uppercase tracking-wider">
                    <span>#</span>
                    <span>Équipe</span>
                    <span className="text-center">{labels.pts}</span>
                    <span className="text-center">{labels.w}</span>
                    <span className="text-center">{labels.l}</span>
                    <span className="text-center">{labels.d}</span>
                  </div>
                  {sortedTeams.map((team, idx) => (
                    <div
                      key={team.id}
                      className={`px-4 py-3 grid grid-cols-[2rem_1fr_3rem_3rem_3rem_3rem] gap-2 items-center ${
                        idx === 0 && team.points > 0 ? 'bg-orange-600/5' : ''
                      }`}
                    >
                      <span
                        className={`text-sm font-mono ${
                          idx === 0 && team.points > 0 ? 'text-orange-400 font-bold' : 'text-gray-500'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <span className="font-medium truncate">{team.name}</span>
                      <span className="text-center font-bold text-orange-400">{team.points}</span>
                      <span className="text-center text-green-500">{team.wins}</span>
                      <span className="text-center text-red-400">{team.losses}</span>
                      <span className="text-center text-gray-400">{team.draws}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </>
          )}

          {/* Classement individuel */}
          <h2 className="text-xl font-bold mb-4">
            {isTeamTournament ? 'Classement individuel' : labels.standings}
          </h2>
          <Card>
            <div className="divide-y divide-gray-800">
              <div className="px-4 py-2 grid grid-cols-[2rem_1fr_3rem_3rem_3rem_3rem] gap-2 text-xs text-gray-500 uppercase tracking-wider">
                <span>#</span>
                <span>{labels.player}</span>
                <span className="text-center">{labels.pts}</span>
                <span className="text-center">{labels.w}</span>
                <span className="text-center">{labels.l}</span>
                <span className="text-center">{labels.d}</span>
              </div>
              {sortedPlayers.map((p, idx) => (
                <div
                  key={p.id}
                  className={`px-4 py-3 grid grid-cols-[2rem_1fr_3rem_3rem_3rem_3rem] gap-2 items-center ${
                    idx === 0 && p.points > 0 ? 'bg-orange-600/5' : ''
                  }`}
                >
                  <span
                    className={`text-sm font-mono ${
                      idx === 0 && p.points > 0 ? 'text-orange-400 font-bold' : 'text-gray-500'
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-medium truncate">{p.pseudo ?? p.user.name}</span>
                    {isTeamTournament && teams && p.teamId && (
                      <span className="text-xs text-gray-500 shrink-0">
                        ({teams.find((t) => t.id === p.teamId)?.name ?? ''})
                      </span>
                    )}
                  </div>
                  <span className="text-center font-bold text-orange-400">{p.points}</span>
                  <span className="text-center text-green-500">{p.wins}</span>
                  <span className="text-center text-red-400">{p.losses}</span>
                  <span className="text-center text-gray-400">{p.draws}</span>
                </div>
              ))}
            </div>
          </Card>
        </section>
      )}
    </div>
  )
}
