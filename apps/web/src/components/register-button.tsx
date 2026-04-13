'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface Faction {
  id: string
  name: string
  group: string | null
}

interface Props {
  tournamentId: string
  isRegistered: boolean
  isFull: boolean
  factions: Faction[]
  registerLabel: string
  unregisterLabel: string
  fullLabel: string
}

export function RegisterButton({
  tournamentId,
  isRegistered,
  isFull,
  factions,
  registerLabel,
  unregisterLabel,
  fullLabel,
}: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [factionId, setFactionId] = useState<string>('')

  const safeFactions = factions ?? []

  // Grouper les factions par group pour le <select>
  const groups = safeFactions.reduce<Record<string, Faction[]>>((acc, f) => {
    const g = f.group ?? ''
    if (!acc[g]) acc[g] = []
    acc[g].push(f)
    return acc
  }, {})
  const hasGroups = Object.keys(groups).some((g) => g !== '')

  async function handleRegister() {
    setError(null)
    setLoading(true)
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ factionId: factionId || null }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error || "Erreur lors de l'inscription")
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
        <div className="flex flex-col items-end gap-2">
          {safeFactions.length > 0 && (
            <select
              value={factionId}
              onChange={(e) => setFactionId(e.target.value)}
              className="bg-gray-900 border border-gray-700 text-sm text-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500"
            >
              <option value="">— Choisir une faction —</option>
              {hasGroups
                ? Object.entries(groups).map(([group, items]) => (
                    <optgroup key={group} label={group || 'Autres'}>
                      {items.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name}
                        </option>
                      ))}
                    </optgroup>
                  ))
                : safeFactions.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
            </select>
          )}
          <Button
            className="bg-orange-600 hover:bg-orange-700"
            onClick={handleRegister}
            disabled={isFull || loading}
          >
            {loading ? '...' : isFull ? fullLabel : registerLabel}
          </Button>
        </div>
      )}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
