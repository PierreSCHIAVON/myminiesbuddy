import { prisma } from '@warforge/db'
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createNotification } from '@/lib/notifications'

// POST — l'organisateur ajoute manuellement un joueur au tournoi
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
      include: {
        organizer: { select: { id: true, email: true } },
        _count: { select: { players: true } },
      },
    })

    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 })
    }

    // Seul l'organisateur ou un admin peut ajouter manuellement
    const isOrganizer =
      session.user.email === tournament.organizer.email ||
      (session.user.role as string) === 'ADMIN'
    if (!isOrganizer) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (tournament.status !== 'OPEN') {
      return NextResponse.json(
        { error: 'Tournament must be OPEN to add players' },
        { status: 400 }
      )
    }

    if (tournament._count.players >= tournament.maxPlayers) {
      return NextResponse.json({ error: 'Tournament is full' }, { status: 400 })
    }

    const { userId, factionId, pseudo, teamName } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    })
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const registration = await prisma.tournamentPlayer.create({
      data: {
        tournamentId,
        userId,
        factionId: factionId || null,
        pseudo: pseudo?.trim() || null,
        teamName: teamName?.trim() || null,
      },
    })

    // Notifier le joueur ajouté
    createNotification({
      userId,
      type: 'NEW_REGISTRATION',
      title: `Inscription confirmée : ${tournament.name}`,
      body: `L'organisateur vous a inscrit à ce tournoi.`,
      link: `/tournois/${tournamentId}`,
    })

    return NextResponse.json(registration, { status: 201 })
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'Player already registered' }, { status: 409 })
    }
    console.error('Error adding player:', error)
    return NextResponse.json({ error: 'Failed to add player' }, { status: 500 })
  }
}
