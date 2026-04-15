import { prisma } from '@warforge/db'
import { NextResponse } from 'next/server'
import { auth } from '@/auth'

// PATCH /api/clubs/[id] — modifier le club (capitaine seulement)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id: clubId } = await params
    const body = await request.json()
    const { name, description, logoUrl } = body

    const me = await prisma.user.findFirst({ where: { email: session.user.email! } })
    if (!me) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const club = await prisma.club.findUnique({ where: { id: clubId } })
    if (!club) return NextResponse.json({ error: 'Club introuvable' }, { status: 404 })
    if (club.captainId !== me.id) {
      return NextResponse.json({ error: 'Seul le capitaine peut modifier le club' }, { status: 403 })
    }

    const data: Record<string, any> = {}

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length < 2) {
        return NextResponse.json({ error: 'Nom invalide (minimum 2 caractères)' }, { status: 400 })
      }
      data.name = name.trim()
    }

    if (description !== undefined) {
      data.description = description?.trim() || null
    }

    if (logoUrl !== undefined) {
      data.logoUrl = logoUrl?.trim() || null
    }

    const updated = await prisma.club.update({ where: { id: clubId }, data })
    return NextResponse.json(updated)
  } catch (err) {
    console.error('[PATCH /api/clubs/[id]]', err)
    return NextResponse.json({ error: 'Failed to update club' }, { status: 500 })
  }
}
