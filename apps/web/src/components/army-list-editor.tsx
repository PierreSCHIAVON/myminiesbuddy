'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Props {
  tournamentId: string
  currentList: string | null
  pointsLimit: number | null
  labels: {
    armyList: string
    armyListPlaceholder: string
    armyListOptional: string
    armyListEdit: string
    armyListSave: string
    armyListCancel: string
    armyListSaved: string
    armyListError: string
    armyListEmpty: string
    armyListPointsLimit: string
  }
}

export function ArmyListEditor({ tournamentId, currentList, pointsLimit, labels }: Props) {
  const router = useRouter()
  const [editing, setEditing] = useState(!currentList)
  const [value, setValue] = useState(currentList ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  async function handleSave() {
    setError(null)
    setLoading(true)
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/register`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listNotes: value }),
      })
      if (!res.ok) {
        setError(labels.armyListError)
        return
      }
      setSaved(true)
      setEditing(false)
      setTimeout(() => setSaved(false), 3000)
      router.refresh()
    } catch {
      setError(labels.armyListError)
    } finally {
      setLoading(false)
    }
  }

  const charCount = value.length
  const limitLabel = pointsLimit ? labels.armyListPointsLimit : null

  return (
    <Card className="border-gray-700/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-gray-300">
            {labels.armyList}
            {limitLabel && (
              <span className="ml-2 text-xs text-orange-400 font-normal">{limitLabel}</span>
            )}
          </CardTitle>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="text-xs text-gray-500 hover:text-orange-400 transition-colors underline"
            >
              {labels.armyListEdit}
            </button>
          )}
        </div>
        <p className="text-xs text-gray-500">{labels.armyListOptional}</p>
      </CardHeader>
      <CardContent>
        {editing ? (
          <div className="space-y-3">
            <textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={labels.armyListPlaceholder}
              rows={10}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-orange-600/60 resize-y font-mono"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">{charCount} caractères</span>
              <div className="flex gap-2">
                {currentList !== null && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => { setValue(currentList); setEditing(false) }}
                    disabled={loading}
                  >
                    {labels.armyListCancel}
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={loading}
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                >
                  {loading ? '...' : labels.armyListSave}
                </Button>
              </div>
            </div>
            {error && <p className="text-xs text-red-400">{error}</p>}
          </div>
        ) : (
          <div>
            {value ? (
              <pre className="text-sm text-gray-300 font-mono whitespace-pre-wrap wrap-break-word bg-gray-900/50 rounded-lg p-3 max-h-64 overflow-y-auto">
                {value}
              </pre>
            ) : (
              <p className="text-sm text-gray-500 italic">{labels.armyListEmpty}</p>
            )}
            {saved && <p className="text-xs text-green-400 mt-2">✓ {labels.armyListSaved}</p>}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
