import { prisma } from '@warforge/db'
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { advanceWinner } from '../route'

// ─── PATCH /api/tournaments/[id]/bracket/[matchId] ───────────────────────────
// Body : { player1Score: number, player2Score: number }
// Détermine le gagnant, met à jour le BracketMatch, avance le gagnant au round suivant.

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; matchId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: tournamentId, matchId } = await params

    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: { organizer: { select: { id: true, email: true } } },
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

    const match = await prisma.bracketMatch.findUnique({
      where: { id: matchId },
    })

    if (!match || match.tournamentId !== tournamentId) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 })
    }

    if (match.status === 'BYE') {
      return NextResponse.json({ error: 'Cannot submit result for a BYE match' }, { status: 400 })
    }

    const body = await request.json().catch(() => ({}))
    const { player1Score, player2Score } = body

    if (typeof player1Score !== 'number' || typeof player2Score !== 'number') {
      return NextResponse.json(
        { error: 'player1Score and player2Score must be numbers' },
        { status: 400 }
      )
    }

    if (player1Score === player2Score) {
      return NextResponse.json(
        { error: 'Bracket matches cannot end in a draw' },
        { status: 400 }
      )
    }

    // Déterminer le gagnant
    const isTeam = match.team1Id != null || match.team2Id != null
    let winnerId: string

    if (player1Score > player2Score) {
      winnerId = (isTeam ? match.team1Id : match.player1Id) as string
    } else {
      winnerId = (isTeam ? match.team2Id : match.player2Id) as string
    }

    if (!winnerId) {
      return NextResponse.json({ error: 'Winner could not be determined' }, { status: 400 })
    }

    // Mettre à jour le match
    const updated = await prisma.bracketMatch.update({
      where: { id: matchId },
      data: {
        player1Score,
        player2Score,
        winnerId,
        status: 'COMPLETED',
      },
      include: {
        player1: { include: { user: { select: { id: true, name: true } } } },
        player2: { include: { user: { select: { id: true, name: true } } } },
        team1: true,
        team2: true,
      },
    })

    // Avancer le gagnant au match suivant (sauf si c'est la finale)
    if (match.roundOf > 2) {
      await advanceWinner(tournamentId, match.roundOf, match.position, winnerId)
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error submitting bracket result:', error)
    return NextResponse.json({ error: 'Failed to submit result' }, { status: 500 })
  }
}
