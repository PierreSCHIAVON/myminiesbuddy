'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface Props {
  tournamentId: string
  isRegistered: boolean
  isFull: boolean
  registerLabel: string
  unregisterLabel: string
  fullLabel: string
}

export function RegisterButton({
  tournamentId,
  isRegistered,
  isFull,
  registerLabel,
  unregisterLabel,
  fullLabel,
}: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleRegister() {
    setError(null)
    setLoading(true)
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error || 'Erreur lors de l\'inscription')
        return
      }
      router.refresh()
    } catch {
      setError('Erreur réseau')
    } finally {
      setLoading(false)
    }
  }

  async function handleUnregister() {
    setError(null)
    setLoading(true)
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/register`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const json = await res.json()
        setError(json.error || 'Erreur lors de la désinscription')
        return
      }
      router.refresh()
    } catch {
      setError('Erreur réseau')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      {isRegistered ? (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="pointer-events-none border-green-500/40 bg-green-600/10 text-green-400"
            disabled
          >
            ✓ {registerLabel}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-red-400 border-red-400/30 hover:bg-red-400/10"
            onClick={handleUnregister}
            disabled={loading}
          >
            {loading ? '...' : unregisterLabel}
          </Button>
        </div>
      ) : (
        <Button
          className="bg-orange-600 hover:bg-orange-700"
          onClick={handleRegister}
          disabled={isFull || loading}
        >
          {loading ? '...' : isFull ? fullLabel : registerLabel}
        </Button>
      )}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
