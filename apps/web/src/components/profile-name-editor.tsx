'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Props {
  currentName: string
  labels: {
    name: string
    edit: string
    save: string
    cancel: string
    editSuccess: string
    editError: string
    nameTooShort: string
  }
}

export function ProfileNameEditor({ currentName, labels }: Props) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(currentName)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  function handleCancel() {
    setValue(currentName)
    setError(null)
    setEditing(false)
  }

  async function handleSave() {
    if (value.trim().length < 2) {
      setError(labels.nameTooShort)
      return
    }
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: value.trim() }),
      })
      if (!res.ok) {
        setError(labels.editError)
        return
      }
      setSuccess(true)
      setEditing(false)
      setTimeout(() => setSuccess(false), 3000)
      router.refresh()
    } catch {
      setError(labels.editError)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <label className="text-sm font-medium text-gray-400">{labels.name}</label>
      <div className="mt-1">
        {editing ? (
          <div className="flex items-center gap-2">
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave()
                if (e.key === 'Escape') handleCancel()
              }}
              className="bg-gray-900 border-gray-700 max-w-xs"
              autoFocus
            />
            <Button
              size="sm"
              onClick={handleSave}
              disabled={loading}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              {loading ? '...' : labels.save}
            </Button>
            <Button size="sm" variant="ghost" onClick={handleCancel} disabled={loading}>
              {labels.cancel}
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <p className="text-lg font-medium">{value}</p>
            <button
              onClick={() => { setEditing(true); setSuccess(false) }}
              className="text-xs text-gray-500 hover:text-orange-400 transition-colors underline"
            >
              {labels.edit}
            </button>
          </div>
        )}
        {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
        {success && <p className="text-xs text-green-400 mt-1">✓ {labels.editSuccess}</p>}
      </div>
    </div>
  )
}
