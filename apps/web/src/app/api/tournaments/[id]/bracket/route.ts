import { prisma } from '@warforge/db'
import { NextResponse } from 'next/server'
import { auth } from '@/auth'

// ─── Algo de seeding bracket standard ────────────────────────────────────────
// Pour N participants, retourne l'ordre des seeds dans le bracket :
// getBracketOrder(8) → [1,8,4,5,2,7,3,6]
// Positions consécutives = paires : (seeds[0] vs seeds[1]), (seeds[2] vs seeds[3])…
function getBracketOrder(n: number): number[] {
  if (n === 1) return [1]
  const prev = getBracketOrder(n / 2)
  return prev.flatMap((s) => [s, n + 1 - s])
}

// ─── GET /api/tournaments/[id]/bracket ───────────────────────────────────────

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tournamentId } = await params

    const matches = await prisma.bracketMatch.findMany({
      where: { tournamentId },
      include: {
        player1: { include: { user: { select: { id: true, name: true } } } },
        player2: { include: { user: { select: { id: true, name: true } } } },
        team1: true,
        team2: true,
      },
      orderBy: [{ roundOf: 'desc' }, { position: 'asc' }],
    })

    return NextResponse.json(matches)
  } catch (error) {
    console.error('Error fetching bracket:', error)
    return NextResponse.json({ error: 'Failed to fetch bracket' }, { status: 500 })
  }
}

// ─── POST /api/tournaments/[id]/bracket ──────────────────────────────────────
// Body : { topCutSize: 4 | 8 | 16 }

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
          orderBy: [{ points: 'desc' }, { sos: 'desc' }, { wins: 'desc' }],
        },
        teams: {
          orderBy: [{ points: 'desc' }, { wins: 'desc' }],
        },
        bracketMatches: { select: { id: true } },
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
        { error: 'Tournament must be IN_PROGRESS to start top-cut' },
        { status: 400 }
      )
    }

    if (tournament.bracketMatches.length > 0) {
      return NextResponse.json(
        { error: 'Bracket already exists for this tournament' },
        { status: 409 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const topCutSize = Number(body.topCutSize)

    if (![2, 4, 8, 16].includes(topCutSize)) {
      return NextResponse.json(
        { error: 'topCutSize must be 2, 4, 8, or 16' },
        { status: 400 }
      )
    }

    const isTeam = tournament.teamSize != null
    const participants = isTeam ? tournament.teams : tournament.players

    if (participants.length < 2) {
      return NextResponse.json(
        { error: 'Not enough participants to generate a bracket' },
        { status: 400 }
      )
    }

    // Les N premiers selon le classement Swiss
    const seeded = participants.slice(0, topCutSize)
    const actualSize = seeded.length // peut être < topCutSize

    // Taille effective = puissance de 2 >= actualSize
    let bracketSize = 2
    while (bracketSize < actualSize) bracketSize *= 2
    // Si moins de participants que la taille demandée, on réduit la taille du bracket
    if (bracketSize > topCutSize) bracketSize = topCutSize

    const seedOrder = getBracketOrder(bracketSize)
    // seedOrder est une liste de seeds 1-based ; seedOrder[i] = seed du slot i

    // Précréer tous les matchs de tous les rounds (avec joueurs null sauf premier round)
    const bracketData: Array<{
      tournamentId: string
      roundOf: number
      position: number
      player1Id?: string
      player2Id?: string
      team1Id?: string
      team2Id?: string
      status: 'PENDING' | 'BYE'
      winnerId?: string
    }> = []

    // Premier round : roundOf = bracketSize
    for (let pos = 1; pos <= bracketSize / 2; pos++) {
      const slot1 = seedOrder[(pos - 1) * 2]! - 1  // index 0-based
      const slot2 = seedOrder[(pos - 1) * 2 + 1]! - 1

      const p1 = seeded[slot1]
      const p2 = seeded[slot2]

      const matchData: (typeof bracketData)[number] = {
        tournamentId,
        roundOf: bracketSize,
        position: pos,
      }

      if (isTeam) {
        if (p1) matchData.team1Id = p1.id
        if (p2) matchData.team2Id = p2.id
      } else {
        if (p1) matchData.player1Id = p1.id
        if (p2) matchData.player2Id = p2.id
      }

      // BYE si un des slots est vide (moins de participants que la taille du bracket)
      if (!p2) {
        matchData.status = 'BYE'
        matchData.winnerId = p1?.id
      } else {
        matchData.status = 'PENDING'
      }

      bracketData.push(matchData)
    }

    // Rounds suivants : tous vides (joueurs remplis au fur et à mesure des résultats)
    let r = bracketSize / 2
    while (r >= 2) {
      for (let pos = 1; pos <= r / 2; pos++) {
        bracketData.push({
          tournamentId,
          roundOf: r,
          position: pos,
          status: 'PENDING',
        })
      }
      r = r / 2
    }
    // Finale
    if (bracketSize > 1) {
      bracketData.push({
        tournamentId,
        roundOf: 2,
        position: 1,
        status: 'PENDING',
      })
    }

    // Déduplique (la boucle ci-dessus génère la finale deux fois si bracketSize = 4)
    const seen = new Set<string>()
    const deduped = bracketData.filter((m) => {
      const key = `${m.roundOf}-${m.position}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

    const [, matches] = await prisma.$transaction([
      prisma.tournament.update({
        where: { id: tournamentId },
        data: { topCutSize: bracketSize },
      }),
      prisma.bracketMatch.createManyAndReturn({
        data: deduped,
      }),
    ])

    // Avancer automatiquement les BYEs du premier round
    const byeMatches = matches.filter((m) => m.status === 'BYE' && m.winnerId)
    for (const bye of byeMatches) {
      await advanceWinner(tournamentId, bye.roundOf, bye.position, bye.winnerId!)
    }

    const finalMatches = await prisma.bracketMatch.findMany({
      where: { tournamentId },
      include: {
        player1: { include: { user: { select: { id: true, name: true } } } },
        player2: { include: { user: { select: { id: true, name: true } } } },
        team1: true,
        team2: true,
      },
      orderBy: [{ roundOf: 'desc' }, { position: 'asc' }],
    })

    return NextResponse.json(finalMatches, { status: 201 })
  } catch (error) {
    console.error('Error generating bracket:', error)
    return NextResponse.json({ error: 'Failed to generate bracket' }, { status: 500 })
  }
}

// ─── Utilitaire : avance le gagnant au match suivant ─────────────────────────
export async function advanceWinner(
  tournamentId: string,
  roundOf: number,
  position: number,
  winnerId: string
) {
  const nextRoundOf = roundOf / 2
  if (nextRoundOf < 1) return // déjà en finale

  const nextPosition = Math.ceil(position / 2)
  const isOdd = position % 2 === 1 // odd → player1 du match suivant, even → player2

  const nextMatch = await prisma.bracketMatch.findUnique({
    where: { tournamentId_roundOf_position: { tournamentId, roundOf: nextRoundOf, position: nextPosition } },
  })

  if (!nextMatch) return

  // Déterminer si c'est un mode équipe (team1Id/team2Id) ou individuel (player1Id/player2Id)
  const currentMatch = await prisma.bracketMatch.findUnique({
    where: { tournamentId_roundOf_position: { tournamentId, roundOf, position } },
  })
  const isTeam = currentMatch?.team1Id != null || currentMatch?.team2Id != null

  const updateData: Record<string, string> = isTeam
    ? isOdd
      ? { team1Id: winnerId }
      : { team2Id: winnerId }
    : isOdd
    ? { player1Id: winnerId }
    : { player2Id: winnerId }

  await prisma.bracketMatch.update({
    where: { id: nextMatch.id },
    data: updateData,
  })
}
