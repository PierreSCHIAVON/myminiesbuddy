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
          include: { matches: true, teamMatches: true },
          orderBy: { number: 'asc' },
        },
        teams: {
          orderBy: [{ points: 'desc' }, { wins: 'desc' }],
          include: {
            players: { orderBy: { registeredAt: 'asc' } },
          },
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

    const nextRoundNumber = (lastRound?.number ?? 0) + 1
    const body = await request.json().catch(() => ({}))

    // ── Tournoi par équipes ───────────────────────────────────────────────────
    if (tournament.teamSize != null) {
      return generateTeamRound(tournament, nextRoundNumber, body)
    }

    // ── Tournoi individuel (logique originale) ────────────────────────────────
    return generateIndividualRound(tournament, nextRoundNumber, body, tournamentId)
  } catch (error) {
    console.error('Error generating round:', error)
    return NextResponse.json({ error: 'Failed to generate round' }, { status: 500 })
  }
}

// ─────────────────────────────────────────────────────────────
// GÉNÉRATION INDIVIDUELLE (logique originale)
// ─────────────────────────────────────────────────────────────

async function generateIndividualRound(
  tournament: {
    id: string
    players: Array<{
      id: string
      points: number
      sos: number
      matchesAsPlayer1: { player2Id: string | null }[]
      matchesAsPlayer2: { player1Id: string }[]
    }>
  },
  nextRoundNumber: number,
  body: { absentPlayerIds?: string[] },
  tournamentId: string
) {
  const absentPlayerIds: string[] = Array.isArray(body.absentPlayerIds)
    ? body.absentPlayerIds
    : []

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

  const players = [...activePlayers]

  // Ronde 1 : mélange aléatoire
  if (nextRoundNumber === 1) {
    for (let i = players.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      const tmp = players[i]!
      players[i] = players[j]!
      players[j] = tmp
    }
  }

  // Construire la liste des adversaires déjà joués
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
  const pairs: Array<{ p1: string; p2: string | null; type: 'match' | 'earned_bye' }> = []

  for (let i = 0; i < players.length; i++) {
    const p1 = players[i]
    if (!p1 || paired.has(p1.id)) continue

    let matched = false
    for (let j = i + 1; j < players.length; j++) {
      const p2 = players[j]
      if (!p2 || paired.has(p2.id)) continue
      if (played.get(p1.id)?.has(p2.id)) continue

      pairs.push({ p1: p1.id, p2: p2.id, type: 'match' })
      paired.add(p1.id)
      paired.add(p2.id)
      matched = true
      break
    }

    if (!matched) {
      const remaining = players.filter((p) => !paired.has(p.id) && p.id !== p1.id)
      const next = remaining[0]
      if (next) {
        pairs.push({ p1: p1.id, p2: next.id, type: 'match' })
        paired.add(p1.id)
        paired.add(next.id)
      } else {
        pairs.push({ p1: p1.id, p2: null, type: 'earned_bye' })
        paired.add(p1.id)
      }
    }
  }

  const round = await prisma.$transaction(async (tx) => {
    const newRound = await tx.round.create({
      data: { tournamentId, number: nextRoundNumber, status: 'IN_PROGRESS' },
    })

    await tx.match.createMany({
      data: pairs.map(({ p1, p2, type }, idx) => ({
        roundId: newRound.id,
        player1Id: p1,
        player2Id: p2 ?? undefined,
        winnerId: type === 'earned_bye' ? p1 : undefined,
        status: p2 === null ? 'BYE' : 'PENDING',
        table: idx + 1,
      })),
    })

    const earnedByes = pairs.filter((p) => p.type === 'earned_bye')
    for (const { p1 } of earnedByes) {
      await tx.tournamentPlayer.update({
        where: { id: p1 },
        data: { wins: { increment: 1 }, points: { increment: 3 } },
      })
    }

    if (absentPlayers.length > 0) {
      await tx.match.createMany({
        data: absentPlayers.map(({ id }) => ({
          roundId: newRound.id,
          player1Id: id,
          player2Id: undefined,
          winnerId: undefined,
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
}

// ─────────────────────────────────────────────────────────────
// GÉNÉRATION PAR ÉQUIPES
// ─────────────────────────────────────────────────────────────

async function generateTeamRound(
  tournament: {
    id: string
    teamSize: number | null
    teams: Array<{
      id: string
      name: string
      wins: number
      losses: number
      draws: number
      points: number
      players: Array<{ id: string }>
    }>
    rounds: Array<{
      teamMatches: Array<{ team1Id: string; team2Id: string | null }>
    }>
  },
  nextRoundNumber: number,
  body: { absentTeamIds?: string[] }
) {
  const teamSize = tournament.teamSize ?? 1
  const absentTeamIds: string[] = Array.isArray(body.absentTeamIds) ? body.absentTeamIds : []
  const absentSet = new Set(absentTeamIds)

  const activeTeams = tournament.teams.filter((t) => !absentSet.has(t.id))
  const absentTeams = tournament.teams.filter((t) => absentSet.has(t.id))

  if (activeTeams.length < 1) {
    return NextResponse.json(
      { error: 'At least 1 active team is required to generate a round' },
      { status: 400 }
    )
  }

  const teams = [...activeTeams]

  // Ronde 1 : mélange aléatoire
  if (nextRoundNumber === 1) {
    for (let i = teams.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      const tmp = teams[i]!
      teams[i] = teams[j]!
      teams[j] = tmp
    }
  }

  // Adversaires déjà joués (au niveau équipe)
  const playedTeams = new Map<string, Set<string>>()
  for (const t of tournament.teams) {
    const opponents = new Set<string>()
    for (const round of tournament.rounds) {
      for (const tm of round.teamMatches) {
        if (tm.team1Id === t.id && tm.team2Id) opponents.add(tm.team2Id)
        if (tm.team2Id === t.id) opponents.add(tm.team1Id)
      }
    }
    playedTeams.set(t.id, opponents)
  }

  // Appairage greedy Swiss niveau équipe
  const paired = new Set<string>()
  const teamPairs: Array<{ t1: string; t2: string | null; type: 'match' | 'earned_bye' }> = []

  for (let i = 0; i < teams.length; i++) {
    const t1 = teams[i]
    if (!t1 || paired.has(t1.id)) continue

    let matched = false
    for (let j = i + 1; j < teams.length; j++) {
      const t2 = teams[j]
      if (!t2 || paired.has(t2.id)) continue
      if (playedTeams.get(t1.id)?.has(t2.id)) continue

      teamPairs.push({ t1: t1.id, t2: t2.id, type: 'match' })
      paired.add(t1.id)
      paired.add(t2.id)
      matched = true
      break
    }

    if (!matched) {
      const remaining = teams.filter((t) => !paired.has(t.id) && t.id !== t1.id)
      const next = remaining[0]
      if (next) {
        teamPairs.push({ t1: t1.id, t2: next.id, type: 'match' })
        paired.add(t1.id)
        paired.add(next.id)
      } else {
        teamPairs.push({ t1: t1.id, t2: null, type: 'earned_bye' })
        paired.add(t1.id)
      }
    }
  }

  // Map pour retrouver les joueurs par équipe
  const playersByTeam = new Map(tournament.teams.map((t) => [t.id, t.players.map((p) => p.id)]))

  const round = await prisma.$transaction(async (tx) => {
    const newRound = await tx.round.create({
      data: { tournamentId: tournament.id, number: nextRoundNumber, status: 'IN_PROGRESS' },
    })

    let tableCounter = 1

    for (const { t1, t2, type } of teamPairs) {
      if (type === 'earned_bye') {
        // BYE équipe : victoire automatique, pas de matchs individuels
        const teamMatch = await tx.teamMatch.create({
          data: {
            roundId: newRound.id,
            team1Id: t1,
            team2Id: null,
            team1TableWins: teamSize,
            team2TableWins: 0,
            winnerId: t1,
            status: 'COMPLETED',
          },
        })

        // Créer des BYE individuels pour les joueurs de l'équipe
        const t1Players = playersByTeam.get(t1) ?? []
        for (const playerId of t1Players.slice(0, teamSize)) {
          await tx.match.create({
            data: {
              roundId: newRound.id,
              teamMatchId: teamMatch.id,
              player1Id: playerId,
              player2Id: undefined,
              winnerId: playerId,
              status: 'BYE',
              table: tableCounter++,
            },
          })
          await tx.tournamentPlayer.update({
            where: { id: playerId },
            data: { wins: { increment: 1 }, points: { increment: 3 } },
          })
        }

        // Victoire de l'équipe BYE
        await tx.team.update({
          where: { id: t1 },
          data: { wins: { increment: 1 }, points: { increment: 3 } },
        })
        continue
      }

      // Match d'équipe normal
      const teamMatch = await tx.teamMatch.create({
        data: {
          roundId: newRound.id,
          team1Id: t1,
          team2Id: t2,
          status: 'PENDING',
        },
      })

      const t1Players = playersByTeam.get(t1) ?? []
      const t2Players = playersByTeam.get(t2!) ?? []

      // Créer les matchs individuels : joueur i de l'équipe 1 vs joueur i de l'équipe 2
      const matchCount = Math.min(teamSize, t1Players.length, t2Players.length)
      for (let i = 0; i < matchCount; i++) {
        await tx.match.create({
          data: {
            roundId: newRound.id,
            teamMatchId: teamMatch.id,
            player1Id: t1Players[i]!,
            player2Id: t2Players[i]!,
            status: 'PENDING',
            table: tableCounter++,
          },
        })
      }
    }

    // Absences d'équipe → défaite sans matchs
    for (const absentTeam of absentTeams) {
      await tx.team.update({
        where: { id: absentTeam.id },
        data: { losses: { increment: 1 } },
      })
      // Défaite individuelle pour chaque joueur absent
      const absentPlayerIds = absentTeam.players.slice(0, teamSize).map((p) => p.id)
      for (const playerId of absentPlayerIds) {
        await tx.tournamentPlayer.update({
          where: { id: playerId },
          data: { losses: { increment: 1 } },
        })
      }
    }

    return tx.round.findUnique({
      where: { id: newRound.id },
      include: {
        teamMatches: {
          include: {
            team1: true,
            team2: true,
            matches: {
              include: {
                player1: { include: { user: { select: { name: true } } } },
                player2: { include: { user: { select: { name: true } } } },
              },
              orderBy: { table: 'asc' },
            },
          },
        },
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
}
