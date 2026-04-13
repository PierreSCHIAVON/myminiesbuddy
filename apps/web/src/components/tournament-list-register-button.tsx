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
  factions: Faction[]
  label: string
}

export function TournamentListRegisterButton({ tournamentId, factions = [], label }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [factionId, setFactionId] = useState<string>('')
  const [showSelect, setShowSelect] = useState(false)

  const groups = factions.reduce<Record<string, Faction[]>>((acc, f) => {
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
      if (!res.ok) {
        const json = await res.json()
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

  function handleClick() {
    if (factions.length > 0 && !showSelect) {
      setShowSelect(true)
      return
    }
    handleRegister()
  }

  return (
    <div className="flex flex-col items-end gap-1">
      {showSelect && factions.length > 0 && (
        <select
          value={factionId}
          onChange={(e) => setFactionId(e.target.value)}
          className="bg-gray-900 border border-gray-700 text-xs text-gray-300 rounded-md px-2 py-1.5 focus:outline-none focus:border-orange-500 w-full"
        >
          <option value="">— Faction —</option>
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
            : factions.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
        </select>
      )}
      <Button
        size="sm"
        className="bg-orange-600 hover:bg-orange-700"
        onClick={handleClick}
        disabled={loading}
      >
        {loading ? '...' : showSelect ? 'Confirmer' : label}
      </Button>
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  )
}
