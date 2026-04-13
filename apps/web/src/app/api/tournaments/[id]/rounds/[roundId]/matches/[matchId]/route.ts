import { prisma } from '@warforge/db'
import { NextResponse } from 'next/server'
import { auth } from '@/auth'

// PATCH /api/tournaments/[id]/rounds/[roundId]/matches/[matchId]
// Soumet le résultat d'un match
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; roundId: string; matchId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: tournamentId, roundId, matchId } = await params

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

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { player1: true, player2: true },
    })

    if (!match || match.roundId !== roundId) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 })
    }

    const { player1Score, player2Score } = await request.json()

    if (typeof player1Score !== 'number' || typeof player2Score !== 'number') {
      return NextResponse.json({ error: 'Scores must be numbers' }, { status: 400 })
    }

    // Déterminer le gagnant
    let winnerId: string | null = null
    if (player1Score > player2Score) winnerId = match.player1Id
    else if (player2Score > player1Score) winnerId = match.player2Id ?? null

    const isDraw = player1Score === player2Score

    await prisma.$transaction(async (tx) => {
      // Annuler l'ancien résultat si le match était déjà soumis
      if (match.status === 'COMPLETED') {
        const oldWinner = match.winnerId
        const wasDrawn = !oldWinner && match.player1Score !== null

        if (oldWinner === match.player1Id) {
          await tx.tournamentPlayer.update({
            where: { id: match.player1Id },
            data: { wins: { decrement: 1 }, points: { decrement: 3 } },
          })
          if (match.player2Id) {
            await tx.tournamentPlayer.update({
              where: { id: match.player2Id },
              data: { losses: { decrement: 1 } },
            })
          }
        } else if (oldWinner === match.player2Id && match.player2Id) {
          await tx.tournamentPlayer.update({
            where: { id: match.player2Id },
            data: { wins: { decrement: 1 }, points: { decrement: 3 } },
          })
          await tx.tournamentPlayer.update({
            where: { id: match.player1Id },
            data: { losses: { decrement: 1 } },
          })
        } else if (wasDrawn) {
          await tx.tournamentPlayer.update({
            where: { id: match.player1Id },
            data: { draws: { decrement: 1 }, points: { decrement: 1 } },
          })
          if (match.player2Id) {
            await tx.tournamentPlayer.update({
              where: { id: match.player2Id },
              data: { draws: { decrement: 1 }, points: { decrement: 1 } },
            })
          }
        }
      }

      // Enregistrer le nouveau résultat sur le match
      await tx.match.update({
        where: { id: matchId },
        data: {
          player1Score,
          player2Score,
          winnerId,
          status: 'COMPLETED',
        },
      })

      // Mettre à jour les stats des joueurs
      if (winnerId === match.player1Id) {
        await tx.tournamentPlayer.update({
          where: { id: match.player1Id },
          data: { wins: { increment: 1 }, points: { increment: 3 } },
        })
        if (match.player2Id) {
          await tx.tournamentPlayer.update({
            where: { id: match.player2Id },
            data: { losses: { increment: 1 } },
          })
        }
      } else if (winnerId === match.player2Id && match.player2Id) {
        await tx.tournamentPlayer.update({
          where: { id: match.player2Id },
          data: { wins: { increment: 1 }, points: { increment: 3 } },
        })
        await tx.tournamentPlayer.update({
          where: { id: match.player1Id },
          data: { losses: { increment: 1 } },
        })
      } else if (isDraw) {
        await tx.tournamentPlayer.update({
          where: { id: match.player1Id },
          data: { draws: { increment: 1 }, points: { increment: 1 } },
        })
        if (match.player2Id) {
          await tx.tournamentPlayer.update({
            where: { id: match.player2Id },
            data: { draws: { increment: 1 }, points: { increment: 1 } },
          })
        }
      }

      // Si tous les matchs de la ronde sont terminés, clore la ronde
      const allMatches = await tx.match.findMany({ where: { roundId } })
      const allDone = allMatches.every(
        (m) => m.status === 'COMPLETED' || m.status === 'BYE'
      )
      if (allDone) {
        await tx.round.update({
          where: { id: roundId },
          data: { status: 'COMPLETED' },
        })
      }
    })

    const updatedMatch = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        player1: { include: { user: { select: { name: true } } } },
        player2: { include: { user: { select: { name: true } } } },
      },
    })

    return NextResponse.json(updatedMatch)
  } catch (error) {
    console.error('Error submitting match result:', error)
    return NextResponse.json({ error: 'Failed to submit result' }, { status: 500 })
  }
}
