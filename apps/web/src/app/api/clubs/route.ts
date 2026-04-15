import { prisma } from '@warforge/db'
import { NextResponse } from 'next/server'
import { auth } from '@/auth'

// GET /api/clubs — liste publique
export async function GET() {
  try {
    const clubs = await prisma.club.findMany({
      include: {
        captain: { select: { id: true, name: true } },
        _count: { select: { members: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(clubs)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch clubs' }, { status: 500 })
  }
}

// POST /api/clubs — créer un club
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { name, description } = await request.json()
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json({ error: 'Nom invalide (minimum 2 caractères)' }, { status: 400 })
    }

    const user = await prisma.user.findFirst({ where: { email: session.user.email! } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // Vérifier que l'utilisateur n'est pas déjà capitaine d'un club
    const existing = await prisma.club.findFirst({ where: { captainId: user.id } })
    if (existing) {
      return NextResponse.json({ error: 'Tu es déjà capitaine d\'un club' }, { status: 400 })
    }

    const slug = name.trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      + '-' + Date.now()

    const club = await prisma.club.create({
      data: {
        name: name.trim(),
        slug,
        description: description?.trim() || null,
        captainId: user.id,
        members: {
          create: { userId: user.id, role: 'CAPTAIN' },
        },
      },
      include: {
        captain: { select: { id: true, name: true } },
        _count: { select: { members: true } },
      },
    })

    return NextResponse.json(club, { status: 201 })
  } catch (err) {
    console.error('[POST /api/clubs]', err)
    return NextResponse.json({ error: 'Failed to create club' }, { status: 500 })
  }
}
