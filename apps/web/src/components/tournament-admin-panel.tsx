'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type TournamentStatus = 'DRAFT' | 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'

interface Props {
  tournamentId: string
  currentStatus: TournamentStatus
  locale: string
  labels: {
    adminPanel: string
    publishTournament: string
    startTournament: string
    completeTournament: string
    cancelTournament: string
    deleteTournament: string
    deleteConfirm: string
    actionError: string
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

export function TournamentAdminPanel({ tournamentId, currentStatus, locale, labels }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

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

  if (transitions.length === 0 && currentStatus !== 'DRAFT') return null

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
    </Card>
  )
}
