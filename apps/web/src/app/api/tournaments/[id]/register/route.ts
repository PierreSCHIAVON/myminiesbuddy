import { prisma } from '@warforge/db'
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createNotification } from '@/lib/notifications'

// POST — s'inscrire au tournoi
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
    const body = await request.json().catch(() => ({}))
    const { factionId, listNotes, pseudo, teamName } = body

    // Trouver l'utilisateur en base
    const user = await prisma.user.findFirst({
      where: { email: session.user.email! },
    })
    if (!user) {
      return NextResponse.json(
        { error: 'User not found — please sign in again' },
        { status: 404 }
      )
    }

    // Vérifier que le tournoi existe et est ouvert
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        _count: { select: { players: true } },
        organizer: { select: { id: true, name: true } },
      },
    })
    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 })
    }
    if (tournament.status !== 'OPEN') {
      return NextResponse.json({ error: 'Tournament is not open for registration' }, { status: 400 })
    }
    if (tournament._count.players >= tournament.maxPlayers) {
      return NextResponse.json({ error: 'Tournament is full' }, { status: 400 })
    }

    // Créer l'inscription (unique constraint gère les doublons)
    const registration = await prisma.tournamentPlayer.create({
      data: {
        tournamentId,
        userId: user.id,
        factionId: factionId || null,
        listNotes: listNotes || null,
        pseudo: pseudo?.trim() || null,
        teamName: teamName?.trim() || null,
      },
    })

    // Notifier l'organisateur (fire & forget)
    if (tournament.organizerId !== user.id) {
      createNotification({
        userId: tournament.organizerId,
        type: 'NEW_REGISTRATION',
        title: `Nouvelle inscription : ${tournament.name}`,
        body: `${user.name ?? user.email} vient de s'inscrire à votre tournoi.`,
        link: `/tournois/${tournamentId}`,
      })
    }

    return NextResponse.json(registration, { status: 201 })
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'Already registered' }, { status: 409 })
    }
    console.error('Error registering:', error)
    return NextResponse.json({ error: 'Failed to register' }, { status: 500 })
  }
}

// PATCH — mettre à jour la liste d'armée (et/ou la faction)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: tournamentId } = await params
    const { listNotes, factionId, pseudo, teamName } = await request.json().catch(() => ({}))

    const user = await prisma.user.findFirst({
      where: { email: session.user.email! },
    })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const updated = await prisma.tournamentPlayer.update({
      where: { tournamentId_userId: { tournamentId, userId: user.id } },
      data: {
        ...(listNotes !== undefined && { listNotes: listNotes || null }),
        ...(factionId !== undefined && { factionId: factionId || null }),
        ...(pseudo !== undefined && { pseudo: pseudo?.trim() || null }),
        ...(teamName !== undefined && { teamName: teamName?.trim() || null }),
      },
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Not registered' }, { status: 404 })
    }
    console.error('Error updating registration:', error)
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}

// DELETE — se désinscrire du tournoi
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: tournamentId } = await params

    const user = await prisma.user.findFirst({
      where: { email: session.user.email! },
    })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    await prisma.tournamentPlayer.delete({
      where: {
        tournamentId_userId: { tournamentId, userId: user.id },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Not registered' }, { status: 404 })
    }
    console.error('Error unregistering:', error)
    return NextResponse.json({ error: 'Failed to unregister' }, { status: 500 })
  }
}
