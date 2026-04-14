'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PlayerSearch } from '@/components/player-search'
import { TeamManager } from '@/components/team-manager'

type TournamentStatus = 'DRAFT' | 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'

interface Faction {
  id: string
  name: string
  group: string | null
}

interface TeamPlayer {
  id: string
  user: { id: string; name: string | null; email: string }
  pseudo: string | null
}

interface Team {
  id: string
  name: string
  players: TeamPlayer[]
}

interface Props {
  tournamentId: string
  currentStatus: TournamentStatus
  locale: string
  factions: Faction[]
  teamSize?: number | null
  teams?: Team[]
  unassignedPlayers?: TeamPlayer[]
  labels: {
    adminPanel: string
    publishTournament: string
    startTournament: string
    completeTournament: string
    cancelTournament: string
    deleteTournament: string
    deleteConfirm: string
    actionError: string
    addPlayer: string
    addPlayerSearch: string
    addPlayerFaction: string
    addPlayerFactionNone: string
    addPlayerConfirm: string
    addPlayerSuccess: string
    addPlayerError: string
    addPlayerAlready: string
    // Équipes
    teamsTitle?: string
    createTeam?: string
    teamNamePlaceholder?: string
    createTeamButton?: string
    deleteTeam?: string
    deleteTeamConfirm?: string
    assignPlayer?: string
    assignNone?: string
    removePlayer?: string
    createTeamError?: string
    createTeamDuplicate?: string
  }
}

// Transitions de statut autorisées
const STATUS_TRANSITIONS: Record<TournamentStatus, TournamentStatus[]> = {
  DRAFT: ['OPEN', 'CANCELLED'],
  OPEN: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
}

export function TournamentAdminPanel({ tournamentId, currentStatus, locale, factions, teamSize, teams, unassignedPlayers, labels }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // État pour l'ajout manuel de joueur
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string | null; email: string } | null>(null)
  const [selectedFactionId, setSelectedFactionId] = useState<string>('')
  const [addLoading, setAddLoading] = useState(false)
  const [addMessage, setAddMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const transitions = STATUS_TRANSITIONS[currentStatus]

  async function handleStatusChange(newStatus: TournamentStatus) {
    setError(null)
    setLoading(newStatus)
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) {
        const json = await res.json()
        setError(json.error || labels.actionError)
        return
      }
      router.refresh()
    } catch {
      setError(labels.actionError)
    } finally {
      setLoading(null)
    }
  }

  async function handleDelete() {
    if (!window.confirm(labels.deleteConfirm)) return
    setError(null)
    setLoading('DELETE')
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}`, { method: 'DELETE' })
      if (!res.ok) {
        const json = await res.json()
        setError(json.error || labels.actionError)
        return
      }
      router.push(`/${locale}/tournois`)
    } catch {
      setError(labels.actionError)
    } finally {
      setLoading(null)
    }
  }

  async function handleAddPlayer() {
    if (!selectedUser) return
    setAddMessage(null)
    setAddLoading(true)
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/players`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          factionId: selectedFactionId || null,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setAddMessage({
          type: 'error',
          text: res.status === 409 ? labels.addPlayerAlready : (json.error || labels.addPlayerError),
        })
        return
      }
      setAddMessage({ type: 'success', text: labels.addPlayerSuccess })
      setSelectedUser(null)
      setSelectedFactionId('')
      router.refresh()
    } catch {
      setAddMessage({ type: 'error', text: labels.addPlayerError })
    } finally {
      setAddLoading(false)
    }
  }

  if (transitions.length === 0 && currentStatus !== 'DRAFT' && currentStatus !== 'OPEN') return null

  return (
    <Card className="mb-8 border-orange-600/40 bg-orange-600/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-orange-400 uppercase tracking-wider">
          {labels.adminPanel}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {transitions.includes('OPEN') && (
          <Button
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={() => handleStatusChange('OPEN')}
            disabled={loading !== null}
          >
            {loading === 'OPEN' ? '...' : labels.publishTournament}
          </Button>
        )}
        {transitions.includes('IN_PROGRESS') && (
          <Button
            size="sm"
            className="bg-orange-600 hover:bg-orange-700 text-white"
            onClick={() => handleStatusChange('IN_PROGRESS')}
            disabled={loading !== null}
          >
            {loading === 'IN_PROGRESS' ? '...' : labels.startTournament}
          </Button>
        )}
        {transitions.includes('COMPLETED') && (
          <Button
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => handleStatusChange('COMPLETED')}
            disabled={loading !== null}
          >
            {loading === 'COMPLETED' ? '...' : labels.completeTournament}
          </Button>
        )}
        {transitions.includes('CANCELLED') && (
          <Button
            size="sm"
            variant="outline"
            className="text-yellow-400 border-yellow-400/30 hover:bg-yellow-400/10"
            onClick={() => handleStatusChange('CANCELLED')}
            disabled={loading !== null}
          >
            {loading === 'CANCELLED' ? '...' : labels.cancelTournament}
          </Button>
        )}
        <Button
          size="sm"
          variant="outline"
          className="text-red-400 border-red-400/30 hover:bg-red-400/10 ml-auto"
          onClick={handleDelete}
          disabled={loading !== null}
        >
          {loading === 'DELETE' ? '...' : labels.deleteTournament}
        </Button>
        {error && <p className="w-full text-xs text-red-400 mt-1">{error}</p>}
      </CardContent>

      {/* Gestion des équipes — uniquement quand tournoi par équipes et OPEN */}
      {currentStatus === 'OPEN' && teamSize != null && teams !== undefined && unassignedPlayers !== undefined && (
        <CardContent className="border-t border-orange-600/20 pt-4">
          <TeamManager
            tournamentId={tournamentId}
            teamSize={teamSize}
            initialTeams={teams}
            unassignedPlayers={unassignedPlayers}
            labels={{
              title: labels.teamsTitle ?? 'Équipes',
              createTeam: labels.createTeam ?? 'Créer une équipe',
              teamNamePlaceholder: labels.teamNamePlaceholder ?? 'Nom de l\'équipe',
              createButton: labels.createTeamButton ?? 'Créer',
              deleteTeam: labels.deleteTeam ?? 'Supprimer',
              deleteTeamConfirm: labels.deleteTeamConfirm ?? 'Supprimer cette équipe ?',
              assignPlayer: labels.assignPlayer ?? '+ Assigner un joueur',
              assignNone: labels.assignNone ?? '—',
              removePlayer: labels.removePlayer ?? 'Retirer',
              slotsUsed: '{used}/{total} joueurs',
              createError: labels.createTeamError ?? 'Erreur lors de la création',
              createDuplicate: labels.createTeamDuplicate ?? 'Ce nom d\'équipe est déjà utilisé',
            }}
          />
        </CardContent>
      )}

      {/* Ajout manuel de joueur — uniquement quand OPEN */}
      {currentStatus === 'OPEN' && (
        <CardContent className="border-t border-orange-600/20 pt-4 space-y-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            {labels.addPlayer}
          </p>

          {selectedUser ? (
            <div className="flex items-center gap-2 flex-wrap">
              {/* Joueur sélectionné */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-600/10 border border-orange-600/30 text-sm flex-1 min-w-0">
                <span className="font-medium truncate">{selectedUser.name ?? selectedUser.email}</span>
                <span className="text-gray-500 text-xs truncate hidden sm:block">{selectedUser.email}</span>
                <button
                  type="button"
                  onClick={() => { setSelectedUser(null); setAddMessage(null) }}
                  className="ml-auto text-gray-500 hover:text-gray-300 shrink-0"
                >
                  ✕
                </button>
              </div>

              {/* Faction optionnelle */}
              {factions.length > 0 && (
                <select
                  value={selectedFactionId}
                  onChange={(e) => setSelectedFactionId(e.target.value)}
                  className="bg-gray-900 border border-gray-700 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-orange-600/50"
                >
                  <option value="">{labels.addPlayerFactionNone}</option>
                  {factions.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.group ? `${f.group} — ` : ''}{f.name}
                    </option>
                  ))}
                </select>
              )}

              <Button
                size="sm"
                onClick={handleAddPlayer}
                disabled={addLoading}
                className="bg-orange-600 hover:bg-orange-700 text-white shrink-0"
              >
                {addLoading ? '...' : labels.addPlayerConfirm}
              </Button>
            </div>
          ) : (
            <PlayerSearch
              tournamentId={tournamentId}
              onSelect={(user) => { setSelectedUser(user); setAddMessage(null) }}
              placeholder={labels.addPlayerSearch}
            />
          )}

          {addMessage && (
            <p className={`text-xs ${addMessage.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
              {addMessage.text}
            </p>
          )}
        </CardContent>
      )}
    </Card>
  )
}
