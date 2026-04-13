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
  player1: Player
  player2: Player | null
}

interface Round {
  id: string
  number: number
  status: string
  matches: Match[]
}

interface Props {
  tournamentId: string
  rounds: Round[]
  players: Player[]
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
}: {
  match: Match
  tournamentId: string
  roundId: string
  isOrganizer: boolean
  labels: Props['labels']
  onUpdated: () => void
}) {
  const [p1Score, setP1Score] = useState(match.player1Score ?? 0)
  const [p2Score, setP2Score] = useState(match.player2Score ?? 0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)

  // BYE : distinguer BYE gagné (winnerId = player1Id) de BYE absent (winnerId = null)
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
            isEarned
              ? 'bg-green-600/20 text-green-400'
              : 'bg-red-600/20 text-red-400'
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

  return (
    <div className="p-3 rounded-lg bg-gray-800/40 space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500 w-12 shrink-0">T{match.table ?? '—'}</span>
        <span className={`flex-1 font-medium truncate ${winner === 'p1' ? 'text-green-400' : winner === 'p2' ? 'text-red-400' : ''}`}>
          {match.player1.pseudo ?? match.player1.user.name}
        </span>
        <span className="text-gray-500 text-sm shrink-0">vs</span>
        <span className={`flex-1 font-medium truncate text-right ${winner === 'p2' ? 'text-green-400' : winner === 'p1' ? 'text-red-400' : ''}`}>
          {match.player2 ? (match.player2.pseudo ?? match.player2.user.name) : '—'}
        </span>
      </div>

      {match.status === 'COMPLETED' && !editing && (
        <div className="flex items-center gap-2 pl-14 text-sm">
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
        <div className="flex items-center gap-2 pl-14">
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

export function TournamentRounds({
  tournamentId,
  rounds,
  players,
  isOrganizer,
  tournamentStatus,
  labels,
}: Props) {
  const router = useRouter()
  const [generating, setGenerating] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)
  const [absentIds, setAbsentIds] = useState<Set<string>>(new Set())

  const lastRound = rounds[rounds.length - 1]
  const canGenerateRound =
    isOrganizer &&
    tournamentStatus === 'IN_PROGRESS' &&
    (!lastRound || lastRound.status === 'COMPLETED')

  function toggleAbsent(playerId: string) {
    setAbsentIds((prev) => {
      const next = new Set(prev)
      if (next.has(playerId)) next.delete(playerId)
      else next.add(playerId)
      return next
    })
  }

  async function handleGenerateRound() {
    setGenerateError(null)
    setGenerating(true)
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/rounds`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ absentPlayerIds: [...absentIds] }),
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

  // Classement trié par points desc
  const sorted = [...players].sort((a, b) => b.points - a.points || b.wins - a.wins)

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
              {/* Sélection des absents */}
              <div>
                <p className="text-sm text-gray-400 mb-3">{labels.absentPlayers}</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {players.map((p) => {
                    const isAbsent = absentIds.has(p.id)
                    return (
                      <label
                        key={p.id}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors select-none ${
                          isAbsent
                            ? 'border-red-500/50 bg-red-600/10 text-red-400'
                            : 'border-gray-700 hover:border-gray-500 text-gray-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isAbsent}
                          onChange={() => toggleAbsent(p.id)}
                          className="accent-red-500"
                        />
                        <span className="text-sm truncate">{p.user.name}</span>
                      </label>
                    )
                  })}
                </div>
                {absentIds.size > 0 && (
                  <p className="text-xs text-red-400 mt-2">
                    {absentIds.size} joueur{absentIds.size > 1 ? 's' : ''} absent{absentIds.size > 1 ? 's' : ''} — recevront une défaite
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3">
                <Button
                  onClick={handleGenerateRound}
                  disabled={generating || players.length - absentIds.size < 2}
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                >
                  {generating ? labels.generating : labels.generateRound}
                </Button>
                {players.length - absentIds.size < 2 && (
                  <p className="text-xs text-red-400">Il faut au moins 2 joueurs actifs</p>
                )}
              </div>

              {generateError && (
                <p className="text-sm text-red-400">{generateError}</p>
              )}
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
                <CardContent className="space-y-2">
                  {round.matches
                    .sort((a, b) => {
                      // BYE absents en bas (table null)
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
                    ))}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Classement */}
      {rounds.length > 0 && (
        <section>
          <h2 className="text-xl font-bold mb-4">{labels.standings}</h2>
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
              {sorted.map((p, idx) => (
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
                  <span className="font-medium truncate">{p.pseudo ?? p.user.name}</span>
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
