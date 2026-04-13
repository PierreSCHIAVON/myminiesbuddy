import { prisma } from '@warforge/db'
import { NextResponse } from 'next/server'
import { auth } from '@/auth'

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
    const { factionId } = body

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
      include: { _count: { select: { players: true } } },
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
      },
    })

    return NextResponse.json(registration, { status: 201 })
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'Already registered' }, { status: 409 })
    }
    console.error('Error registering:', error)
    return NextResponse.json({ error: 'Failed to register' }, { status: 500 })
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
