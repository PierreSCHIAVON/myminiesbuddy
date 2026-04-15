'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface Props {
  clubId: string
  invitationId: string
  locale: string
}

export function ClubInvitationActions({ clubId, invitationId, locale }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<'accept' | 'decline' | null>(null)
  const [done, setDone] = useState(false)

  async function handle(action: 'accept' | 'decline') {
    setLoading(action)
    try {
      const res = await fetch(`/api/clubs/${clubId}/invitations/${invitationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      if (res.ok) {
        setDone(true)
        router.refresh()
      }
    } finally {
      setLoading(null)
    }
  }

  if (done) return null

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        className="bg-orange-600 hover:bg-orange-700"
        disabled={loading !== null}
        onClick={() => handle('accept')}
      >
        {loading === 'accept' ? 'Acceptation...' : 'Accepter'}
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={loading !== null}
        onClick={() => handle('decline')}
      >
        {loading === 'decline' ? 'Refus...' : 'Décliner'}
      </Button>
    </div>
  )
}
