'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { COUNTRIES, flagEmoji } from '@/lib/countries'

interface Game {
  id: string
  name: string
  slug: string
}

interface Props {
  games: Game[]
  locale: string
}

const FORMATS = [
  { value: 'SWISS', label: 'Swiss (appairage suisse)' },
  { value: 'ROUND_ROBIN', label: 'Round Robin (tout le monde)' },
  { value: 'ELIMINATION', label: 'Élimination directe' },
]

export function CreateTournamentForm({ games, locale }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [minDate, setMinDate] = useState('')
  const [isTeamTournament, setIsTeamTournament] = useState(false)

  useEffect(() => {
    setMinDate(new Date().toISOString().slice(0, 16))
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const form = new FormData(e.currentTarget)
    const teamSizeRaw = form.get('teamSize')
    const data = {
      name: form.get('name'),
      description: form.get('description'),
      gameId: form.get('gameId'),
      date: form.get('date'),
      venueName: form.get('venueName') || null,
      address: form.get('address') || null,
      postalCode: form.get('postalCode') || null,
      city: form.get('city') || null,
      country: form.get('country') || null,
      maxPlayers: form.get('maxPlayers'),
      format: form.get('format'),
      pointsLimit: form.get('pointsLimit') || null,
      teamSize: isTeamTournament && teamSizeRaw ? parseInt(teamSizeRaw as string) : null,
    }

    try {
      const res = await fetch('/api/tournaments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const json = await res.json()
      if (!res.ok) {
        setError(json.error || 'Une erreur est survenue')
        return
      }

      router.push(`/${locale}/tournois/${json.id}`)
      router.refresh()
    } catch {
      setError('Une erreur réseau est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nom */}
          <div className="space-y-2">
            <Label htmlFor="name">Nom du tournoi *</Label>
            <Input
              id="name"
              name="name"
              required
              placeholder="ex: Clash of Champions 2026"
              className="bg-gray-900 border-gray-700"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              name="description"
              rows={3}
              placeholder="Décris ton tournoi..."
              className="w-full px-3 py-2 rounded-md bg-gray-900 border border-gray-700 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-orange-600 resize-none"
            />
          </div>

          {/* Jeu */}
          <div className="space-y-2">
            <Label htmlFor="gameId">Jeu *</Label>
            <select
              id="gameId"
              name="gameId"
              required
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-orange-600"
            >
              <option value="">Sélectionner un jeu</option>
              {games.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date">Date et heure *</Label>
            <Input
              id="date"
              name="date"
              type="datetime-local"
              required
              min={minDate}
              className="bg-gray-900 border-gray-700"
            />
          </div>

          {/* Adresse structurée */}
          <div className="space-y-3 rounded-lg border border-gray-700/50 bg-gray-900/40 p-4">
            <p className="text-sm font-medium text-gray-300">Lieu de l'événement</p>

            <div className="space-y-2">
              <Label htmlFor="venueName">Nom du lieu</Label>
              <Input
                id="venueName"
                name="venueName"
                placeholder="ex: Forges de Lumière"
                className="bg-gray-900 border-gray-700"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Adresse</Label>
              <Input
                id="address"
                name="address"
                placeholder="ex: 1 place Clémence Isaure"
                className="bg-gray-900 border-gray-700"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="postalCode">Code postal</Label>
                <Input
                  id="postalCode"
                  name="postalCode"
                  placeholder="31320"
                  className="bg-gray-900 border-gray-700"
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="city">Ville</Label>
                <Input
                  id="city"
                  name="city"
                  placeholder="Castanet Tolosan"
                  className="bg-gray-900 border-gray-700"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Pays</Label>
              <select
                id="country"
                name="country"
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-orange-600"
              >
                <option value="">Sélectionner un pays</option>
                {[...COUNTRIES].sort((a, b) => a.fr.localeCompare(b.fr)).map((c) => (
                  <option key={c.code} value={c.code}>
                    {flagEmoji(c.code)} {c.fr}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Format + Nb joueurs */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="format">Format</Label>
              <select
                id="format"
                name="format"
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-orange-600"
              >
                {FORMATS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxPlayers">Nombre de joueurs max *</Label>
              <Input
                id="maxPlayers"
                name="maxPlayers"
                type="number"
                required
                min={2}
                max={256}
                defaultValue={16}
                className="bg-gray-900 border-gray-700"
              />
            </div>
          </div>

          {/* Points limite (optionnel) */}
          <div className="space-y-2">
            <Label htmlFor="pointsLimit">Limite de points (optionnel)</Label>
            <Input
              id="pointsLimit"
              name="pointsLimit"
              type="number"
              min={0}
              placeholder="ex: 2000"
              className="bg-gray-900 border-gray-700"
            />
          </div>

          {/* Tournoi par équipes */}
          <div className="space-y-3 rounded-lg border border-gray-700/50 bg-gray-900/40 p-4">
            <div className="flex items-center gap-3">
              <input
                id="isTeamTournament"
                type="checkbox"
                checked={isTeamTournament}
                onChange={(e) => setIsTeamTournament(e.target.checked)}
                className="h-4 w-4 rounded border-gray-700 bg-gray-900 accent-orange-600"
              />
              <Label htmlFor="isTeamTournament" className="cursor-pointer">
                Tournoi par équipes
              </Label>
            </div>
            {isTeamTournament && (
              <div className="space-y-2 pl-7">
                <Label htmlFor="teamSize">Taille des équipes *</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="teamSize"
                    name="teamSize"
                    type="number"
                    required={isTeamTournament}
                    min={2}
                    max={10}
                    defaultValue={3}
                    className="bg-gray-900 border-gray-700 w-24"
                  />
                  <span className="text-sm text-gray-400">joueurs par équipe (ex: 3 pour du 3v3)</span>
                </div>
              </div>
            )}
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/30 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              className="bg-orange-600 hover:bg-orange-700 flex-1"
              disabled={loading}
            >
              {loading ? 'Création...' : 'Créer le tournoi'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
