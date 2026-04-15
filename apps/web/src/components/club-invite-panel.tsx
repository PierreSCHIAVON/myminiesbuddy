'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'

interface PendingInvitation {
  id: string
  invited: { id: string; name: string | null }
}

interface Props {
  clubId: string
  pendingInvitations: PendingInvitation[]
}

export function ClubInvitePanel({ clubId, pendingInvitations }: Props) {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)
    try {
      const res = await fetch(`/api/clubs/${clubId}/invitations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error || 'Erreur')
      } else {
        setSuccess(`Invitation envoyée à ${username}`)
        setUsername('')
        router.refresh()
      }
    } catch {
      setError('Erreur réseau')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleInvite} className="flex gap-2">
        <Input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Nom du joueur..."
          className="bg-gray-900 border-gray-700"
          required
          minLength={2}
        />
        <Button type="submit" className="bg-orange-600 hover:bg-orange-700 shrink-0" disabled={loading}>
          {loading ? '...' : 'Inviter'}
        </Button>
      </form>

      {error && (
        <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/30 rounded-md px-3 py-2">
          {error}
        </p>
      )}
      {success && (
        <p className="text-sm text-green-400 bg-green-400/10 border border-green-400/30 rounded-md px-3 py-2">
          {success}
        </p>
      )}

      {pendingInvitations.length > 0 && (
        <div>
          <p className="text-sm text-gray-500 mb-2">Invitations en attente</p>
          <Card>
            <div className="divide-y divide-gray-800/60">
              {pendingInvitations.map((inv) => (
                <div key={inv.id} className="px-4 py-3 flex items-center gap-3">
                  <div className="h-7 w-7 rounded-full bg-gray-800 flex items-center justify-center text-xs font-bold shrink-0">
                    {(inv.invited.name ?? '?')[0].toUpperCase()}
                  </div>
                  <span className="text-sm flex-1">{inv.invited.name ?? '—'}</span>
                  <span className="text-xs text-yellow-500/70 bg-yellow-500/10 px-2 py-0.5 rounded-full">
                    En attente
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
