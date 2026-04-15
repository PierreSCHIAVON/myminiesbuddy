import { prisma } from '@warforge/db'
import { NextResponse } from 'next/server'
import { auth } from '@/auth'

export async function PATCH(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, country } = body

    const data: Record<string, unknown> = {}

    if (name !== undefined) {
      if (!name || typeof name !== 'string' || name.trim().length < 2) {
        return NextResponse.json(
          { error: 'Name must be at least 2 characters' },
          { status: 400 }
        )
      }
      data.name = name.trim()
    }

    if (country !== undefined) {
      // Accept a valid 2-letter ISO code or null to clear
      if (country !== null && (typeof country !== 'string' || !/^[A-Z]{2}$/.test(country))) {
        return NextResponse.json({ error: 'Invalid country code' }, { status: 400 })
      }
      data.country = country
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
    }

    const userId = session.user.id as string

    const updated = await prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, name: true, email: true, country: true },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
