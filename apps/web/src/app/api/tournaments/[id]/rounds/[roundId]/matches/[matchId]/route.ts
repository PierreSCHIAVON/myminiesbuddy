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

      // Mettre à jour les stats individuelles des joueurs
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

      // ── Recalcul du TeamMatch si applicable ───────────────────────────────
      if (match.teamMatchId) {
        const allMatchesInTeamMatch = await tx.match.findMany({
          where: { teamMatchId: match.teamMatchId },
        })

        // Recalcul avec le nouveau résultat du match courant
        const updatedMatches = allMatchesInTeamMatch.map((m) =>
          m.id === matchId ? { ...m, winnerId, status: 'COMPLETED' as const } : m
        )

        const allDone = updatedMatches.every(
          (m) => m.status === 'COMPLETED' || m.status === 'BYE'
        )

        if (allDone) {
          const teamMatch = await tx.teamMatch.findUnique({
            where: { id: match.teamMatchId },
          })
          if (!teamMatch) return

          // Compter les tables remportées par chaque équipe
          // On identifie team1/team2 via les joueurs appartenant aux équipes
          // Récupération des joueurs de chaque équipe
          const team1Players = await tx.tournamentPlayer.findMany({
            where: { teamId: teamMatch.team1Id },
            select: { id: true },
          })
          const team1PlayerIds = new Set(team1Players.map((p) => p.id))

          let team1TableWins = 0
          let team2TableWins = 0
          let team1TableLosses = 0
          let team2TableLosses = 0

          for (const m of updatedMatches) {
            if (m.status === 'BYE') continue // BYE individuel ne compte pas dans le score équipe
            if (!m.winnerId) {
              // Draw individuel — on ne l'attribue à aucune équipe
              continue
            }
            if (team1PlayerIds.has(m.winnerId)) {
              team1TableWins++
              team2TableLosses++
            } else {
              team2TableWins++
              team1TableLosses++
            }
          }

          // Déterminer le gagnant du match d'équipe
          let teamWinnerId: string | null = null
          if (team1TableWins > team2TableWins) teamWinnerId = teamMatch.team1Id
          else if (team2TableWins > team1TableWins) teamWinnerId = teamMatch.team2Id ?? null

          const isTeamDraw = team1TableWins === team2TableWins

          // Annuler l'ancien résultat d'équipe si le TeamMatch était déjà terminé
          if (teamMatch.status === 'COMPLETED') {
            if (teamMatch.winnerId === teamMatch.team1Id) {
              await tx.team.update({
                where: { id: teamMatch.team1Id },
                data: { wins: { decrement: 1 }, points: { decrement: 3 } },
              })
              if (teamMatch.team2Id) {
                await tx.team.update({
                  where: { id: teamMatch.team2Id },
                  data: { losses: { decrement: 1 } },
                })
              }
            } else if (teamMatch.winnerId === teamMatch.team2Id && teamMatch.team2Id) {
              await tx.team.update({
                where: { id: teamMatch.team2Id },
                data: { wins: { decrement: 1 }, points: { decrement: 3 } },
              })
              await tx.team.update({
                where: { id: teamMatch.team1Id },
                data: { losses: { decrement: 1 } },
              })
            } else if (!teamMatch.winnerId && teamMatch.team2Id) {
              // ancien draw
              await tx.team.update({
                where: { id: teamMatch.team1Id },
                data: { draws: { decrement: 1 }, points: { decrement: 1 } },
              })
              await tx.team.update({
                where: { id: teamMatch.team2Id },
                data: { draws: { decrement: 1 }, points: { decrement: 1 } },
              })
            }
          }

          // Mettre à jour le TeamMatch
          await tx.teamMatch.update({
            where: { id: match.teamMatchId },
            data: {
              team1TableWins,
              team2TableWins,
              winnerId: teamWinnerId,
              status: 'COMPLETED',
            },
          })

          // Mettre à jour les stats des équipes
          if (teamWinnerId === teamMatch.team1Id) {
            await tx.team.update({
              where: { id: teamMatch.team1Id },
              data: { wins: { increment: 1 }, points: { increment: 3 } },
            })
            if (teamMatch.team2Id) {
              await tx.team.update({
                where: { id: teamMatch.team2Id },
                data: { losses: { increment: 1 } },
              })
            }
          } else if (teamWinnerId === teamMatch.team2Id && teamMatch.team2Id) {
            await tx.team.update({
              where: { id: teamMatch.team2Id },
              data: { wins: { increment: 1 }, points: { increment: 3 } },
            })
            await tx.team.update({
              where: { id: teamMatch.team1Id },
              data: { losses: { increment: 1 } },
            })
          } else if (isTeamDraw && teamMatch.team2Id) {
            await tx.team.update({
              where: { id: teamMatch.team1Id },
              data: { draws: { increment: 1 }, points: { increment: 1 } },
            })
            await tx.team.update({
              where: { id: teamMatch.team2Id },
              data: { draws: { increment: 1 }, points: { increment: 1 } },
            })
          }
        }
      }

      // ── Clôture de la ronde ───────────────────────────────────────────────
      // Tournoi par équipes : la ronde se ferme quand tous les TeamMatch sont COMPLETED
      // Tournoi individuel : la ronde se ferme quand tous les Match sont COMPLETED/BYE
      const round = await tx.round.findUnique({
        where: { id: roundId },
        include: { teamMatches: true, matches: true },
      })

      if (round) {
        let allRoundDone: boolean
        if (round.teamMatches.length > 0) {
          // Tournoi équipe : vérifier les TeamMatch (le TeamMatch courant vient d'être mis à jour dans la TX)
          const updatedTeamMatches = await tx.teamMatch.findMany({ where: { roundId } })
          allRoundDone = updatedTeamMatches.every((tm) => tm.status === 'COMPLETED')
        } else {
          // Tournoi individuel
          const allMatches = await tx.match.findMany({ where: { roundId } })
          allRoundDone = allMatches.every(
            (m) => m.status === 'COMPLETED' || m.status === 'BYE'
          )
        }

        if (allRoundDone) {
          await tx.round.update({
            where: { id: roundId },
            data: { status: 'COMPLETED' },
          })
        }
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
