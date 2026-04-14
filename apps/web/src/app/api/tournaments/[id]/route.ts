import { prisma } from '@warforge/db'
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createNotifications } from '@/lib/notifications'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        game: {
          include: {
            factions: {
              orderBy: [{ group: 'asc' }, { name: 'asc' }],
            },
          },
        },
        organizer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        players: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            factionRef: {
              select: { id: true, name: true },
            },
          },
        },
        rounds: {
          include: {
            matches: true,
          },
        },
      },
    })

    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(tournament)
  } catch (error) {
    console.error('Error fetching tournament:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tournament' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: { organizer: { select: { email: true } } },
    })

    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 })
    }

    // Seul l'organisateur ou un admin peut modifier
    if (tournament.organizer.email !== session.user.email && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { name, description, date, location, maxPlayers, format, pointsLimit, status } = body

    const updated = await prisma.tournament.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(date && { date: new Date(date) }),
        ...(location !== undefined && { location }),
        ...(maxPlayers && { maxPlayers: parseInt(maxPlayers) }),
        ...(format && { format }),
        ...(pointsLimit !== undefined && { pointsLimit: pointsLimit ? parseInt(pointsLimit) : null }),
        ...(status && { status }),
      },
      include: {
        game: true,
        players: { select: { userId: true } },
      },
    })

    // Notifier tous les joueurs inscrits quand le tournoi démarre
    if (status === 'IN_PROGRESS' && tournament.status !== 'IN_PROGRESS') {
      const playerNotifications = updated.players
        .filter((p) => p.userId !== tournament.organizerId)
        .map((p) => ({
          userId: p.userId,
          type: 'TOURNAMENT_START' as const,
          title: `Le tournoi commence : ${updated.name}`,
          body: 'La première ronde vient d\'être lancée. Bonne chance !',
          link: `/tournois/${id}`,
        }))
      createNotifications(playerNotifications)
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating tournament:', error)
    return NextResponse.json({ error: 'Failed to update tournament' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: { organizer: { select: { email: true } } },
    })

    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 })
    }

    if (tournament.organizer.email !== session.user.email && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.tournament.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting tournament:', error)
    return NextResponse.json({ error: 'Failed to delete tournament' }, { status: 500 })
  }
}
