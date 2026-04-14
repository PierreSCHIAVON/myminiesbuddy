'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface TeamPlayer {
  id: string // TournamentPlayer id
  user: { id: string; name: string | null; email: string }
  pseudo: string | null
}

interface Team {
  id: string
  name: string
  players: TeamPlayer[]
}

interface UnassignedPlayer {
  id: string // TournamentPlayer id
  user: { id: string; name: string | null; email: string }
  pseudo: string | null
}

interface Props {
  tournamentId: string
  teamSize: number
  initialTeams: Team[]
  unassignedPlayers: UnassignedPlayer[]
  labels: {
    title: string
    createTeam: string
    teamNamePlaceholder: string
    createButton: string
    deleteTeam: string
    deleteTeamConfirm: string
    assignPlayer: string
    assignNone: string
    removePlayer: string
    slotsUsed: string // "{used}/{total} joueurs"
    createError: string
    createDuplicate: string
  }
}

export function TeamManager({
  tournamentId,
  teamSize,
  initialTeams,
  unassignedPlayers: initialUnassigned,
  labels,
}: Props) {
  const router = useRouter()
  const [teams, setTeams] = useState<Team[]>(initialTeams)
  const [unassigned, setUnassigned] = useState<UnassignedPlayer[]>(initialUnassigned)
  const [newTeamName, setNewTeamName] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [loadingAction, setLoadingAction] = useState<string | null>(null)

  async function handleCreateTeam() {
    if (!newTeamName.trim()) return
    setCreateError(null)
    setCreating(true)
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/teams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTeamName.trim() }),
      })
      const json = await res.json()
      if (!res.ok) {
        setCreateError(res.status === 409 ? labels.createDuplicate : (json.error || labels.createError))
        return
      }
      setTeams((prev) => [...prev, json])
      setNewTeamName('')
      router.refresh()
    } catch {
      setCreateError(labels.createError)
    } finally {
      setCreating(false)
    }
  }

  async function handleDeleteTeam(teamId: string) {
    if (!window.confirm(labels.deleteTeamConfirm)) return
    setLoadingAction(`delete-${teamId}`)
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/teams/${teamId}`, {
        method: 'DELETE',
      })
      if (!res.ok) return
      // Les joueurs de l'équipe retournent dans la liste non assignée
      const deletedTeam = teams.find((t) => t.id === teamId)
      if (deletedTeam) {
        setUnassigned((prev) => [...prev, ...deletedTeam.players])
      }
      setTeams((prev) => prev.filter((t) => t.id !== teamId))
      router.refresh()
    } finally {
      setLoadingAction(null)
    }
  }

  async function handleAssignPlayer(teamId: string, playerId: string) {
    if (!playerId) return
    setLoadingAction(`assign-${teamId}`)
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/teams/${teamId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addPlayerId: playerId }),
      })
      const json = await res.json()
      if (!res.ok) return
      setTeams((prev) => prev.map((t) => (t.id === teamId ? json : t)))
      setUnassigned((prev) => prev.filter((p) => p.id !== playerId))
      router.refresh()
    } finally {
      setLoadingAction(null)
    }
  }

  async function handleRemovePlayer(teamId: string, playerId: string) {
    setLoadingAction(`remove-${playerId}`)
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/teams/${teamId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ removePlayerId: playerId }),
      })
      const json = await res.json()
      if (!res.ok) return
      const removedPlayer = teams.find((t) => t.id === teamId)?.players.find((p) => p.id === playerId)
      if (removedPlayer) {
        setUnassigned((prev) => [...prev, removedPlayer])
      }
      setTeams((prev) => prev.map((t) => (t.id === teamId ? json : t)))
      router.refresh()
    } finally {
      setLoadingAction(null)
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
        {labels.title}
      </p>

      {/* Créer une équipe */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newTeamName}
          onChange={(e) => setNewTeamName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCreateTeam()}
          placeholder={labels.teamNamePlaceholder}
          className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-orange-600/50"
        />
        <Button
          size="sm"
          onClick={handleCreateTeam}
          disabled={creating || !newTeamName.trim()}
          className="bg-orange-600 hover:bg-orange-700 text-white shrink-0"
        >
          {creating ? '...' : labels.createButton}
        </Button>
      </div>
      {createError && <p className="text-xs text-red-400">{createError}</p>}

      {/* Liste des équipes */}
      <div className="space-y-3">
        {teams.map((team) => {
          const slotsUsed = team.players.length
          const isFull = slotsUsed >= teamSize

          return (
            <div
              key={team.id}
              className="rounded-lg border border-gray-700/50 bg-gray-900/40 p-3 space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <span className="font-semibold text-sm">{team.name}</span>
                  <span className="ml-2 text-xs text-gray-500">
                    {slotsUsed}/{teamSize}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteTeam(team.id)}
                  disabled={loadingAction === `delete-${team.id}`}
                  className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50"
                >
                  {labels.deleteTeam}
                </button>
              </div>

              {/* Joueurs de l'équipe */}
              {team.players.length > 0 && (
                <div className="space-y-1">
                  {team.players.map((player) => (
                    <div
                      key={player.id}
                      className="flex items-center justify-between gap-2 px-2 py-1 rounded bg-gray-800/60 text-sm"
                    >
                      <span className="truncate">
                        {player.pseudo ?? player.user.name ?? player.user.email}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemovePlayer(team.id, player.id)}
                        disabled={loadingAction === `remove-${player.id}`}
                        className="text-xs text-gray-500 hover:text-gray-300 shrink-0 disabled:opacity-50"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Assigner un joueur */}
              {!isFull && unassigned.length > 0 && (
                <select
                  defaultValue=""
                  onChange={(e) => {
                    if (e.target.value) {
                      handleAssignPlayer(team.id, e.target.value)
                      e.target.value = ''
                    }
                  }}
                  disabled={loadingAction === `assign-${team.id}`}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-orange-600/50 disabled:opacity-50"
                >
                  <option value="">{labels.assignPlayer}</option>
                  {unassigned.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.pseudo ?? p.user.name ?? p.user.email}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )
        })}
      </div>

      {/* Joueurs non assignés */}
      {unassigned.length > 0 && (
        <p className="text-xs text-gray-500">
          {unassigned.length} joueur{unassigned.length > 1 ? 's' : ''} non assigné{unassigned.length > 1 ? 's' : ''}
        </p>
      )}
    </div>
  )
}
