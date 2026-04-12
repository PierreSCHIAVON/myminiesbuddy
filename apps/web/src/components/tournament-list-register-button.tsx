'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface Props {
  tournamentId: string
  label: string
}

export function TournamentListRegisterButton({ tournamentId, label }: Props) {
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
      if (!res.ok) {
        const json = await res.json()
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

  return (
    <>
      <Button
        className="bg-orange-600 hover:bg-orange-700"
        onClick={handleRegister}
        disabled={loading}
      >
        {loading ? '...' : label}
      </Button>
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </>
  )
}
