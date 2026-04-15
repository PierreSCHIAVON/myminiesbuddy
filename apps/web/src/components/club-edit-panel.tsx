'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Props {
  clubId: string
  initialName: string
  initialDescription: string | null
  initialLogoUrl: string | null
}

export function ClubEditPanel({ clubId, initialName, initialDescription, initialLogoUrl }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(initialName)
  const [description, setDescription] = useState(initialDescription ?? '')
  const [logoUrl, setLogoUrl] = useState(initialLogoUrl ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setLoading(true)
    try {
      const res = await fetch(`/api/clubs/${clubId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, logoUrl }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error || 'Erreur')
      } else {
        setSuccess(true)
        setOpen(false)
        router.refresh()
      }
    } catch {
      setError('Erreur réseau')
    } finally {
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-gray-500 hover:text-gray-300 transition-colors underline underline-offset-2"
      >
        Modifier les informations
      </button>
    )
  }

  return (
    <form onSubmit={handleSave} className="mt-4 p-4 rounded-xl border border-gray-800 bg-gray-900/50 space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="edit-name">Nom de l'équipe</Label>
        <Input
          id="edit-name"
          value={name}
          onChange={e => setName(e.target.value)}
          required
          minLength={2}
          className="bg-gray-900 border-gray-700"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="edit-desc">Description</Label>
        <textarea
          id="edit-desc"
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={3}
          placeholder="Quelques mots sur votre équipe..."
          className="w-full px-3 py-2 rounded-md bg-gray-900 border border-gray-700 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-orange-600 resize-none text-sm"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="edit-logo">URL du logo</Label>
        <Input
          id="edit-logo"
          type="url"
          value={logoUrl}
          onChange={e => setLogoUrl(e.target.value)}
          placeholder="https://example.com/logo.png"
          className="bg-gray-900 border-gray-700"
        />
        {logoUrl && (
          <div className="mt-2 flex items-center gap-3">
            <img
              src={logoUrl}
              alt="Aperçu"
              className="h-12 w-12 rounded-full object-cover border border-gray-700"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
            <span className="text-xs text-gray-500">Aperçu</span>
          </div>
        )}
      </div>
      {error && (
        <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/30 rounded-md px-3 py-2">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setOpen(false)}
          disabled={loading}
        >
          Annuler
        </Button>
        <Button
          type="submit"
          size="sm"
          className="bg-orange-600 hover:bg-orange-700"
          disabled={loading}
        >
          {loading ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
      </div>
    </form>
  )
}
