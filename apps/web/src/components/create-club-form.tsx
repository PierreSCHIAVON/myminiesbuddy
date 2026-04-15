'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'

export function CreateClubForm({ locale }: { locale: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const form = new FormData(e.currentTarget)
    try {
      const res = await fetch('/api/clubs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.get('name'),
          description: form.get('description') || null,
        }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error || 'Erreur'); return }
      router.push(`/${locale}/equipes/${json.slug}`)
      router.refresh()
    } catch {
      setError('Erreur réseau')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name">Nom de l'équipe *</Label>
            <Input
              id="name"
              name="name"
              required
              minLength={2}
              placeholder="ex: Les Chevaliers de la Mer"
              className="bg-gray-900 border-gray-700"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              name="description"
              rows={3}
              placeholder="Quelques mots sur votre équipe..."
              className="w-full px-3 py-2 rounded-md bg-gray-900 border border-gray-700 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-orange-600 resize-none"
            />
          </div>
          {error && (
            <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/30 rounded-md px-3 py-2">
              {error}
            </p>
          )}
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
              Annuler
            </Button>
            <Button type="submit" className="bg-orange-600 hover:bg-orange-700 flex-1" disabled={loading}>
              {loading ? 'Création...' : 'Créer l\'équipe'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
