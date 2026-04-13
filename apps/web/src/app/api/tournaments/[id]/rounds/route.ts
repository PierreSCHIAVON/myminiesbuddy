import { prisma } from '@warforge/db'
import { NextResponse } from 'next/server'
import { auth } from '@/auth'

// Génère les appairages Swiss pour la prochaine ronde
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
        players: {
          include: {
            matchesAsPlayer1: { select: { player2Id: true } },
            matchesAsPlayer2: { select: { player1Id: true } },
          },
          orderBy: [{ points: 'desc' }, { sos: 'desc' }],
        },
        rounds: {
          include: { matches: true },
          orderBy: { number: 'asc' },
        },
      },
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

    if (tournament.status !== 'IN_PROGRESS') {
      return NextResponse.json(
        { error: 'Tournament must be IN_PROGRESS to generate rounds' },
        { status: 400 }
      )
    }

    // Vérifier que la dernière ronde est terminée (si elle existe)
    const lastRound = tournament.rounds[tournament.rounds.length - 1]
    if (lastRound && lastRound.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'Current round must be completed before generating a new one' },
        { status: 400 }
      )
    }

    // Lire les absents depuis le body
    const body = await request.json().catch(() => ({}))
    const absentPlayerIds: string[] = Array.isArray(body.absentPlayerIds)
      ? body.absentPlayerIds
      : []

    // Valider que les IDs absents appartiennent bien à ce tournoi
    const validPlayerIds = new Set(tournament.players.map((p) => p.id))
    const absentSet = new Set(absentPlayerIds.filter((id) => validPlayerIds.has(id)))

    const activePlayers = tournament.players.filter((p) => !absentSet.has(p.id))
    const absentPlayers = tournament.players.filter((p) => absentSet.has(p.id))

    if (activePlayers.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 active players are required to generate a round' },
        { status: 400 }
      )
    }

    const nextRoundNumber = (lastRound?.number ?? 0) + 1
    const players = [...activePlayers]

    // --- Algorithme Swiss ---
    // Ronde 1 : mélange aléatoire
    // Rondes suivantes : tri par points (déjà fait par Prisma)
    if (nextRoundNumber === 1) {
      // Fisher-Yates shuffle
      for (let i = players.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        const tmp = players[i]!
        players[i] = players[j]!
        players[j] = tmp
      }
    }

    // Construire la liste des adversaires déjà joués par joueur
    const played = new Map<string, Set<string>>()
    for (const p of tournament.players) {
      const opponents = new Set<string>()
      for (const m of p.matchesAsPlayer1) {
        if (m.player2Id) opponents.add(m.player2Id)
      }
      for (const m of p.matchesAsPlayer2) {
        opponents.add(m.player1Id)
      }
      played.set(p.id, opponents)
    }

    // Appairage greedy avec fallback rematch
    const paired = new Set<string>()
    // type: 'match' | 'earned_bye' — distinct de l'absence
    const pairs: Array<{ p1: string; p2: string | null; type: 'match' | 'earned_bye' }> = []

    for (let i = 0; i < players.length; i++) {
      const p1 = players[i]
      if (!p1 || paired.has(p1.id)) continue

      let matched = false
      for (let j = i + 1; j < players.length; j++) {
        const p2 = players[j]
        if (!p2 || paired.has(p2.id)) continue
        if (played.get(p1.id)?.has(p2.id)) continue // rematch — skip

        pairs.push({ p1: p1.id, p2: p2.id, type: 'match' })
        paired.add(p1.id)
        paired.add(p2.id)
        matched = true
        break
      }

      if (!matched) {
        // Fallback : rematch accepté si aucun autre choix
        const remaining = players.filter((p) => !paired.has(p.id) && p.id !== p1.id)
        const next = remaining[0]
        if (next) {
          pairs.push({ p1: p1.id, p2: next.id, type: 'match' })
          paired.add(p1.id)
          paired.add(next.id)
        } else {
          // BYE gagné (nombre impair de joueurs actifs) → victoire
          pairs.push({ p1: p1.id, p2: null, type: 'earned_bye' })
          paired.add(p1.id)
        }
      }
    }

    // Créer la ronde et tous les matchs en transaction
    const round = await prisma.$transaction(async (tx) => {
      const newRound = await tx.round.create({
        data: {
          tournamentId,
          number: nextRoundNumber,
          status: 'IN_PROGRESS',
        },
      })

      // Matchs normaux + BYE gagnés
      await tx.match.createMany({
        data: pairs.map(({ p1, p2, type }, idx) => ({
          roundId: newRound.id,
          player1Id: p1,
          player2Id: p2 ?? undefined,
          // BYE gagné : winnerId = p1 ; match normal : pending
          winnerId: type === 'earned_bye' ? p1 : undefined,
          status: p2 === null ? 'BYE' : 'PENDING',
          table: idx + 1,
        })),
      })

      // BYE gagné → victoire (+3 pts)
      const earnedByes = pairs.filter((p) => p.type === 'earned_bye')
      for (const { p1 } of earnedByes) {
        await tx.tournamentPlayer.update({
          where: { id: p1 },
          data: { wins: { increment: 1 }, points: { increment: 3 } },
        })
      }

      // Absents → défaite (table null pour les distinguer visuellement)
      if (absentPlayers.length > 0) {
        await tx.match.createMany({
          data: absentPlayers.map(({ id }) => ({
            roundId: newRound.id,
            player1Id: id,
            player2Id: undefined,
            winnerId: undefined, // null = absent (pas de gagnant → défaite pour p1)
            status: 'BYE' as const,
            table: undefined,
          })),
        })

        for (const { id } of absentPlayers) {
          await tx.tournamentPlayer.update({
            where: { id },
            data: { losses: { increment: 1 } },
          })
        }
      }

      return tx.round.findUnique({
        where: { id: newRound.id },
        include: {
          matches: {
            include: {
              player1: { include: { user: { select: { name: true } } } },
              player2: { include: { user: { select: { name: true } } } },
            },
          },
        },
      })
    })

    return NextResponse.json(round, { status: 201 })
  } catch (error) {
    console.error('Error generating round:', error)
    return NextResponse.json({ error: 'Failed to generate round' }, { status: 500 })
  }
}
