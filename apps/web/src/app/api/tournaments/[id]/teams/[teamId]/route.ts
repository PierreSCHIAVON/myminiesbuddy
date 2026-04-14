import { prisma } from '@warforge/db'
import { NextResponse } from 'next/server'
import { auth } from '@/auth'

async function getOrganizerCheck(
  tournamentId: string,
  userId: string,
  userEmail: string | null | undefined,
  userRole: string | undefined
) {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: { organizer: { select: { id: true, email: true } } },
  })
  if (!tournament) return null
  const isOrganizer =
    userId === tournament.organizer.id ||
    userEmail === tournament.organizer.email ||
    userRole === 'ADMIN'
  return isOrganizer ? tournament : null
}

// PATCH /api/tournaments/[id]/teams/[teamId]
// Body options :
//   { name }           → renomme l'équipe
//   { addPlayerId }    → assigne un joueur inscrit à cette équipe
//   { removePlayerId } → retire un joueur de cette équipe
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; teamId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: tournamentId, teamId } = await params

    const tournament = await getOrganizerCheck(
      tournamentId,
      session.user.id as string,
      session.user.email,
      session.user.role as string | undefined
    )
    if (!tournament) {
      return NextResponse.json({ error: 'Forbidden or not found' }, { status: 403 })
    }

    const team = await prisma.team.findUnique({
      where: { id: teamId },
    })
    if (!team || team.tournamentId !== tournamentId) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    const body = await request.json()

    // Renommage
    if (body.name !== undefined) {
      const updated = await prisma.team.update({
        where: { id: teamId },
        data: { name: body.name.trim() },
        include: {
          players: {
            include: { user: { select: { id: true, name: true, email: true } } },
          },
        },
      })
      return NextResponse.json(updated)
    }

    // Assigner un joueur
    if (body.addPlayerId !== undefined) {
      // Vérifier que le joueur est inscrit à ce tournoi
      const player = await prisma.tournamentPlayer.findUnique({
        where: { id: body.addPlayerId },
      })
      if (!player || player.tournamentId !== tournamentId) {
        return NextResponse.json({ error: 'Player not found in this tournament' }, { status: 404 })
      }
      if (player.teamId !== null) {
        return NextResponse.json(
          { error: 'Player is already in a team' },
          { status: 409 }
        )
      }
      await prisma.tournamentPlayer.update({
        where: { id: body.addPlayerId },
        data: { teamId },
      })
      const updated = await prisma.team.findUnique({
        where: { id: teamId },
        include: {
          players: {
            include: { user: { select: { id: true, name: true, email: true } } },
          },
        },
      })
      return NextResponse.json(updated)
    }

    // Retirer un joueur
    if (body.removePlayerId !== undefined) {
      const player = await prisma.tournamentPlayer.findUnique({
        where: { id: body.removePlayerId },
      })
      if (!player || player.teamId !== teamId) {
        return NextResponse.json({ error: 'Player not in this team' }, { status: 404 })
      }
      await prisma.tournamentPlayer.update({
        where: { id: body.removePlayerId },
        data: { teamId: null },
      })
      const updated = await prisma.team.findUnique({
        where: { id: teamId },
        include: {
          players: {
            include: { user: { select: { id: true, name: true, email: true } } },
          },
        },
      })
      return NextResponse.json(updated)
    }

    return NextResponse.json({ error: 'No valid operation provided' }, { status: 400 })
  } catch (error: unknown) {
    if ((error as { code?: string }).code === 'P2002') {
      return NextResponse.json(
        { error: 'Une équipe avec ce nom existe déjà dans ce tournoi' },
        { status: 409 }
      )
    }
    console.error('Error updating team:', error)
    return NextResponse.json({ error: 'Failed to update team' }, { status: 500 })
  }
}

// DELETE /api/tournaments/[id]/teams/[teamId]
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; teamId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: tournamentId, teamId } = await params

    const tournament = await getOrganizerCheck(
      tournamentId,
      session.user.id as string,
      session.user.email,
      session.user.role as string | undefined
    )
    if (!tournament) {
      return NextResponse.json({ error: 'Forbidden or not found' }, { status: 403 })
    }

    const team = await prisma.team.findUnique({ where: { id: teamId } })
    if (!team || team.tournamentId !== tournamentId) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    await prisma.$transaction(async (tx) => {
      // Détacher tous les joueurs de l'équipe
      await tx.tournamentPlayer.updateMany({
        where: { teamId },
        data: { teamId: null },
      })
      // Supprimer l'équipe
      await tx.team.delete({ where: { id: teamId } })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting team:', error)
    return NextResponse.json({ error: 'Failed to delete team' }, { status: 500 })
  }
}
