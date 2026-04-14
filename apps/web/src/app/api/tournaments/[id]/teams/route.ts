import { prisma } from '@warforge/db'
import { NextResponse } from 'next/server'
import { auth } from '@/auth'

// GET /api/tournaments/[id]/teams — liste les équipes avec leurs joueurs
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tournamentId } = await params

    const teams = await prisma.team.findMany({
      where: { tournamentId },
      include: {
        players: {
          include: { user: { select: { id: true, name: true, email: true } } },
          orderBy: { registeredAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json(teams)
  } catch (error) {
    console.error('Error fetching teams:', error)
    return NextResponse.json({ error: 'Failed to fetch teams' }, { status: 500 })
  }
}

// POST /api/tournaments/[id]/teams — crée une équipe
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: tournamentId } = await params

    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: { organizer: { select: { id: true, email: true } } },
    })

    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 })
    }

    const userId = session.user.id as string
    const isOrganizer =
      userId === tournament.organizer.id ||
      session.user.email === tournament.organizer.email ||
      (session.user.role as string) === 'ADMIN'

    if (!isOrganizer) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (tournament.teamSize == null) {
      return NextResponse.json(
        { error: 'This tournament is not a team tournament' },
        { status: 400 }
      )
    }

    const { name } = await request.json()

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Team name is required' }, { status: 400 })
    }

    const team = await prisma.team.create({
      data: {
        name: name.trim(),
        tournamentId,
      },
      include: {
        players: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
      },
    })

    return NextResponse.json(team, { status: 201 })
  } catch (error: unknown) {
    if ((error as { code?: string }).code === 'P2002') {
      return NextResponse.json(
        { error: 'Une équipe avec ce nom existe déjà dans ce tournoi' },
        { status: 409 }
      )
    }
    console.error('Error creating team:', error)
    return NextResponse.json({ error: 'Failed to create team' }, { status: 500 })
  }
}
