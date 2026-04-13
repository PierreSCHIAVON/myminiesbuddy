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
  armyListLabel?: string
  armyListPlaceholder?: string
  armyListOptional?: string
  pseudoLabel?: string
  pseudoPlaceholder?: string
  pseudoOptional?: string
  teamNameLabel?: string
  teamNamePlaceholder?: string
  teamNameOptional?: string
}

export function RegisterButton({
  tournamentId,
  isRegistered,
  isFull,
  factions,
  registerLabel,
  unregisterLabel,
  fullLabel,
  armyListLabel,
  armyListPlaceholder,
  armyListOptional,
  pseudoLabel,
  pseudoPlaceholder,
  pseudoOptional,
  teamNameLabel,
  teamNamePlaceholder,
  teamNameOptional,
}: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [factionId, setFactionId] = useState<string>('')
  const [listNotes, setListNotes] = useState<string>('')
  const [pseudo, setPseudo] = useState<string>('')
  const [teamName, setTeamName] = useState<string>('')

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
        body: JSON.stringify({
          factionId: factionId || null,
          listNotes: listNotes || null,
          pseudo: pseudo.trim() || null,
          teamName: teamName.trim() || null,
        }),
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
        <div className="flex flex-col items-end gap-2 w-full">
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
          {pseudoLabel && (
            <div className="w-full">
              <label className="text-xs text-gray-400 mb-1 block">
                {pseudoLabel}
                {pseudoOptional && <span className="text-gray-600 ml-1">— {pseudoOptional}</span>}
              </label>
              <input
                type="text"
                value={pseudo}
                onChange={(e) => setPseudo(e.target.value)}
                placeholder={pseudoPlaceholder}
                maxLength={50}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-orange-600/60"
              />
            </div>
          )}
          {teamNameLabel && (
            <div className="w-full">
              <label className="text-xs text-gray-400 mb-1 block">
                {teamNameLabel}
                {teamNameOptional && <span className="text-gray-600 ml-1">— {teamNameOptional}</span>}
              </label>
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder={teamNamePlaceholder}
                maxLength={50}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-orange-600/60"
              />
            </div>
          )}
          {armyListLabel && (
            <div className="w-full">
              <label className="text-xs text-gray-400 mb-1 block">
                {armyListLabel}
                {armyListOptional && (
                  <span className="text-gray-600 ml-1">— {armyListOptional}</span>
                )}
              </label>
              <textarea
                value={listNotes}
                onChange={(e) => setListNotes(e.target.value)}
                placeholder={armyListPlaceholder}
                rows={4}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-orange-600/60 resize-y font-mono"
              />
            </div>
          )}
          <Button
            className="bg-orange-600 hover:bg-orange-700 self-end"
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
