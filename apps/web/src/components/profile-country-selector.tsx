'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { COUNTRIES, flagEmoji } from '@/lib/countries'

interface Props {
  currentCountry: string | null
  locale: string
  labels: {
    country: string
    edit: string
    save: string
    cancel: string
    noCountry: string
    saveSuccess: string
    saveError: string
  }
}

export function ProfileCountrySelector({ currentCountry, locale, labels }: Props) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(currentCountry ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const sortedCountries = [...COUNTRIES].sort((a, b) =>
    (locale === 'fr' ? a.fr : a.en).localeCompare(locale === 'fr' ? b.fr : b.en)
  )

  function handleCancel() {
    setValue(currentCountry ?? '')
    setError(null)
    setEditing(false)
  }

  async function handleSave() {
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ country: value || null }),
      })
      if (!res.ok) {
        setError(labels.saveError)
        return
      }
      setSuccess(true)
      setEditing(false)
      setTimeout(() => setSuccess(false), 3000)
      router.refresh()
    } catch {
      setError(labels.saveError)
    } finally {
      setLoading(false)
    }
  }

  const displayCountry = COUNTRIES.find((c) => c.code === (value || currentCountry))
  const displayName = displayCountry ? (locale === 'fr' ? displayCountry.fr : displayCountry.en) : null

  return (
    <div>
      <label className="text-sm font-medium text-gray-400">{labels.country}</label>
      <div className="mt-1">
        {editing ? (
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="bg-gray-900 border border-gray-700 text-sm text-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500"
              autoFocus
            >
              <option value="">{labels.noCountry}</option>
              {sortedCountries.map((c) => (
                <option key={c.code} value={c.code}>
                  {flagEmoji(c.code)} {locale === 'fr' ? c.fr : c.en}
                </option>
              ))}
            </select>
            <button
              onClick={handleSave}
              disabled={loading}
              className="text-xs px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white transition-colors disabled:opacity-50"
            >
              {loading ? '...' : labels.save}
            </button>
            <button
              onClick={handleCancel}
              disabled={loading}
              className="text-xs px-3 py-1.5 rounded-lg border border-gray-700 text-gray-400 hover:text-gray-200 transition-colors"
            >
              {labels.cancel}
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <p className="text-base">
              {displayName
                ? `${flagEmoji(displayCountry!.code)} ${displayName}`
                : <span className="text-gray-500 italic">{labels.noCountry}</span>
              }
            </p>
            <button
              onClick={() => { setEditing(true); setSuccess(false) }}
              className="text-xs text-gray-500 hover:text-orange-400 transition-colors underline"
            >
              {labels.edit}
            </button>
          </div>
        )}
        {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
        {success && <p className="text-xs text-green-400 mt-1">✓ {labels.saveSuccess}</p>}
      </div>
    </div>
  )
}
