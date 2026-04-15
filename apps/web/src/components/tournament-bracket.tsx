'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Participant {
  id: string
  name: string // user.name pour joueur, team.name pour équipe
  pseudo?: string | null
}

interface BracketMatch {
  id: string
  tournamentId: string
  roundOf: number
  position: number
  status: string
  player1Id: string | null
  player2Id: string | null
  team1Id: string | null
  team2Id: string | null
  player1Score: number | null
  player2Score: number | null
  winnerId: string | null
  player1: { id: string; user: { name: string | null }; pseudo?: string | null } | null
  player2: { id: string; user: { name: string | null }; pseudo?: string | null } | null
  team1: { id: string; name: string } | null
  team2: { id: string; name: string } | null
}

interface Props {
  tournamentId: string
  matches: BracketMatch[]
  isOrganizer: boolean
  topCutSize: number | null
  tournamentStatus: string
  players: Array<{ id: string; user: { name: string | null }; pseudo: string | null; points: number; wins: number; sos: number }>
  teams?: Array<{ id: string; name: string; points: number; wins: number }> | null
  teamSize?: number | null
  labels: {
    startTopCut: string
    topCutSize: string
    generate: string
    generating: string
    round: string
    final: string
    semiFinal: string
    quarterFinal: string
    roundOf: string
    bye: string
    tbd: string
    submit: string
    submitting: string
    draw: string
    bracketExists: string
    winner: string
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function roundLabel(roundOf: number, labels: Props['labels']): string {
  if (roundOf === 2) return labels.final
  if (roundOf === 4) return labels.semiFinal
  if (roundOf === 8) return labels.quarterFinal
  return `${labels.roundOf} ${roundOf}`
}

function participantName(match: BracketMatch, slot: 1 | 2): string | null {
  if (match.team1Id || match.team2Id) {
    const team = slot === 1 ? match.team1 : match.team2
    return team?.name ?? null
  }
  const player = slot === 1 ? match.player1 : match.player2
  if (!player) return null
  return player.pseudo ?? player.user.name ?? null
}

function participantId(match: BracketMatch, slot: 1 | 2): string | null {
  if (match.team1Id || match.team2Id) {
    return slot === 1 ? match.team1Id : match.team2Id
  }
  return slot === 1 ? match.player1Id : match.player2Id
}

// ─── Carte d'un match du bracket ──────────────────────────────────────────────

function BracketMatchCard({
  match,
  isOrganizer,
  tournamentId,
  labels,
  onResult,
}: {
  match: BracketMatch
  isOrganizer: boolean
  tournamentId: string
  labels: Props['labels']
  onResult: () => void
}) {
  const [s1, setS1] = useState('')
  const [s2, setS2] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const p1Name = participantName(match, 1)
  const p2Name = participantName(match, 2)
  const p1Id = participantId(match, 1)
  const p2Id = participantId(match, 2)
  const isCompleted = match.status === 'COMPLETED'
  const isBye = match.status === 'BYE'
  const isPending = match.status === 'PENDING'

  const p1Won = isCompleted && match.winnerId === p1Id
  const p2Won = isCompleted && match.winnerId === p2Id

  async function handleSubmit() {
    const score1 = parseInt(s1)
    const score2 = parseInt(s2)
    if (isNaN(score1) || isNaN(score2)) return
    if (score1 === score2) {
      setError(labels.draw)
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/bracket/${match.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player1Score: score1, player2Score: score2 }),
      })
      if (!res.ok) {
        const json = await res.json()
        setError(json.error || 'Erreur')
        return
      }
      onResult()
    } catch {
      setError('Erreur réseau')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={`rounded-lg border p-3 space-y-2 text-sm ${
      isCompleted
        ? 'border-green-600/30 bg-green-950/20'
        : isBye
        ? 'border-gray-700/50 bg-gray-900/30'
        : 'border-gray-700 bg-gray-900/50'
    }`}>
      {/* Participant 1 */}
      <div className={`flex items-center justify-between gap-2 ${p1Won ? 'font-semibold text-green-400' : ''}`}>
        <span className={`truncate ${!p1Name ? 'text-gray-600 italic' : ''}`}>
          {p1Name ?? labels.tbd}
        </span>
        {isCompleted && (
          <span className={`text-lg font-bold tabular-nums ${p1Won ? 'text-green-400' : 'text-gray-500'}`}>
            {match.player1Score}
          </span>
        )}
      </div>

      {/* Séparateur */}
      <div className="border-t border-gray-700/50" />

      {/* Participant 2 */}
      <div className={`flex items-center justify-between gap-2 ${p2Won ? 'font-semibold text-green-400' : ''}`}>
        <span className={`truncate ${!p2Name ? 'text-gray-600 italic' : isBye ? 'text-gray-500 italic' : ''}`}>
          {isBye ? labels.bye : (p2Name ?? labels.tbd)}
        </span>
        {isCompleted && (
          <span className={`text-lg font-bold tabular-nums ${p2Won ? 'text-green-400' : 'text-gray-500'}`}>
            {match.player2Score}
          </span>
        )}
      </div>

      {/* Saisie scores (organisateur, match en attente avec 2 participants) */}
      {isOrganizer && isPending && p1Name && p2Name && (
        <div className="pt-1 space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              value={s1}
              onChange={(e) => setS1(e.target.value)}
              placeholder="0"
              className="w-14 text-center rounded bg-gray-800 border border-gray-600 px-2 py-1 text-sm"
            />
            <span className="text-gray-500 text-xs">–</span>
            <input
              type="number"
              min={0}
              value={s2}
              onChange={(e) => setS2(e.target.value)}
              placeholder="0"
              className="w-14 text-center rounded bg-gray-800 border border-gray-600 px-2 py-1 text-sm"
            />
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={submitting || !s1 || !s2}
              className="h-7 text-xs"
            >
              {submitting ? labels.submitting : labels.submit}
            </Button>
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
        </div>
      )}
    </div>
  )
}

// ─── Composant principal ───────────────────────────────────────────────────────

export function TournamentBracket({
  tournamentId,
  matches,
  isOrganizer,
  topCutSize,
  tournamentStatus,
  players,
  teams,
  teamSize,
  labels,
}: Props) {
  const router = useRouter()
  const [size, setSize] = useState<number>(4)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hasBracket = matches.length > 0
  const isTeam = teamSize != null && teamSize > 0
  const participants = isTeam ? (teams ?? []) : players
  const canStart =
    isOrganizer &&
    tournamentStatus === 'IN_PROGRESS' &&
    !hasBracket &&
    participants.length >= 2

  // Grouper les matchs par roundOf (desc = premier round en haut)
  const rounds = Array.from(new Set(matches.map((m) => m.roundOf))).sort((a, b) => b - a)

  async function handleGenerate() {
    setError(null)
    setGenerating(true)
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/bracket`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topCutSize: size }),
      })
      if (!res.ok) {
        const json = await res.json()
        setError(json.error || 'Erreur')
        return
      }
      router.refresh()
    } catch {
      setError('Erreur réseau')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Panel démarrage top-cut (organisateur uniquement, pas encore de bracket) */}
      {canStart && (
        <Card className="border-orange-600/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{labels.startTopCut}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <label className="text-sm text-gray-400">{labels.topCutSize}</label>
              <div className="flex gap-2">
                {[2, 4, 8, 16].filter((n) => n <= participants.length).map((n) => (
                  <button
                    key={n}
                    onClick={() => setSize(n)}
                    className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                      size === n
                        ? 'bg-orange-600 text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    Top {n}
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <Button
              onClick={handleGenerate}
              disabled={generating}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {generating ? labels.generating : labels.generate}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Affichage du bracket */}
      {hasBracket && (
        <div className="space-y-8">
          {rounds.map((roundOf) => {
            const roundMatches = matches
              .filter((m) => m.roundOf === roundOf)
              .sort((a, b) => a.position - b.position)

            return (
              <section key={roundOf}>
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  {roundLabel(roundOf, labels)}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {roundMatches.map((match) => (
                    <BracketMatchCard
                      key={match.id}
                      match={match}
                      isOrganizer={isOrganizer}
                      tournamentId={tournamentId}
                      labels={labels}
                      onResult={() => router.refresh()}
                    />
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      )}

      {/* État vide si pas encore de bracket */}
      {!hasBracket && !canStart && (
        <p className="text-gray-500 text-sm text-center py-8">
          {labels.bracketExists}
        </p>
      )}
    </div>
  )
}
