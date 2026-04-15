import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest'
import { prisma } from '@warforge/db'
import {
  cleanupTestData,
  createTestTournament,
  createTeam,
  assignPlayerToTeam,
  getFirstGame,
  getOrganizerUser,
  makeParams,
  makeRequest,
  PREFIX,
  registerPlayer,
} from '../helpers/db'
import { organizerSession, playerSession, noSession } from '../helpers/auth'

vi.mock('@/auth', () => ({ auth: vi.fn() }))
vi.mock('@/lib/notifications', () => ({
  createNotification: vi.fn(),
  createNotifications: vi.fn(),
}))

import { auth } from '@/auth'
import { GET as getBracket, POST as generateBracket } from '@/app/api/tournaments/[id]/bracket/route'
import { PATCH as submitBracketResult } from '@/app/api/tournaments/[id]/bracket/[matchId]/route'

let organizerId: string
let gameId: string

// ─── Extra users pour les tests ───────────────────────────────────────────────

async function getOrCreateExtraUser(email: string, name: string) {
  return prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, name, role: 'PLAYER', keycloakId: `test-${email}` },
  })
}

beforeAll(async () => {
  const [organizer, game] = await Promise.all([getOrganizerUser(), getFirstGame()])
  organizerId = organizer.id
  gameId = game.id
})

afterAll(async () => {
  await cleanupTestData()
  await prisma.user.deleteMany({ where: { email: { endsWith: '@bracket-test.local' } } })
})

beforeEach(() => {
  vi.mocked(auth).mockResolvedValue(organizerSession)
})

// ─── Helper : crée un tournoi IN_PROGRESS avec N joueurs seedés ───────────────
// Les joueurs sont créés avec des points décroissants (seed 1 = plus de points)

async function setupTournamentWithPlayers(count: number) {
  const users = await Promise.all(
    Array.from({ length: count }, (_, i) =>
      getOrCreateExtraUser(`p${i + 1}@bracket-test.local`, `BracketP${i + 1}`)
    )
  )

  const tournament = await createTestTournament(organizerId, gameId, {
    status: 'IN_PROGRESS',
    maxPlayers: 16,
  })

  const registrations = await Promise.all(users.map((u) => registerPlayer(tournament.id, u.id)))

  // Assigner des points décroissants pour un seeding déterministe
  await Promise.all(
    registrations.map((reg, i) =>
      prisma.tournamentPlayer.update({
        where: { id: reg.id },
        data: { points: (count - i) * 3, wins: count - i },
      })
    )
  )

  // Recharger avec l'ordre correct
  const players = await prisma.tournamentPlayer.findMany({
    where: { tournamentId: tournament.id },
    orderBy: [{ points: 'desc' }, { sos: 'desc' }, { wins: 'desc' }],
  })

  return { tournament, players, users }
}

// ─── Helper : crée un tournoi par équipes IN_PROGRESS avec N équipes ──────────

async function setupTeamTournament(teamCount: number, teamSize = 2) {
  const allUsers = await Promise.all(
    Array.from({ length: teamCount * teamSize }, (_, i) =>
      getOrCreateExtraUser(`t${i + 1}@bracket-test.local`, `BracketT${i + 1}`)
    )
  )

  const tournament = await createTestTournament(organizerId, gameId, {
    status: 'IN_PROGRESS',
    maxPlayers: 32,
    teamSize,
  })

  const regs = await Promise.all(allUsers.map((u) => registerPlayer(tournament.id, u.id)))

  const teams = await Promise.all(
    Array.from({ length: teamCount }, (_, i) =>
      createTeam(tournament.id, `${PREFIX} Bracket Team ${i + 1}`)
    )
  )

  // Assigner les joueurs aux équipes
  for (let t = 0; t < teamCount; t++) {
    for (let p = 0; p < teamSize; p++) {
      await assignPlayerToTeam(regs[t * teamSize + p]!.id, teams[t]!.id)
    }
  }

  // Donner des points décroissants aux équipes
  await Promise.all(
    teams.map((team, i) =>
      prisma.team.update({
        where: { id: team.id },
        data: { points: (teamCount - i) * 3, wins: teamCount - i },
      })
    )
  )

  const orderedTeams = await prisma.team.findMany({
    where: { tournamentId: tournament.id },
    orderBy: [{ points: 'desc' }, { wins: 'desc' }],
  })

  return { tournament, teams: orderedTeams }
}

// ─── GET /api/tournaments/[id]/bracket ───────────────────────────────────────

describe('GET /api/tournaments/[id]/bracket', () => {
  it('returns empty array when no bracket exists', async () => {
    const tournament = await createTestTournament(organizerId, gameId, { status: 'IN_PROGRESS' })
    const res = await getBracket(makeRequest('GET', '/'), makeParams({ id: tournament.id }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
    expect(body).toHaveLength(0)
  })

  it('returns bracket matches after generation', async () => {
    const { tournament } = await setupTournamentWithPlayers(4)
    await generateBracket(
      makeRequest('POST', '/', { topCutSize: 4 }),
      makeParams({ id: tournament.id })
    )

    const res = await getBracket(makeRequest('GET', '/'), makeParams({ id: tournament.id }))
    expect(res.status).toBe(200)
    const body = await res.json()
    // Top 4 : 2 SF + 1 finale = 3 matchs
    expect(body.length).toBeGreaterThanOrEqual(3)
  })
})

// ─── POST /api/tournaments/[id]/bracket — guards ─────────────────────────────

describe('POST /api/tournaments/[id]/bracket — guards', () => {
  it('returns 401 without auth', async () => {
    const tournament = await createTestTournament(organizerId, gameId, { status: 'IN_PROGRESS' })
    vi.mocked(auth).mockResolvedValue(noSession)
    const res = await generateBracket(
      makeRequest('POST', '/', { topCutSize: 4 }),
      makeParams({ id: tournament.id })
    )
    expect(res.status).toBe(401)
  })

  it('returns 403 for non-organizer', async () => {
    const tournament = await createTestTournament(organizerId, gameId, { status: 'IN_PROGRESS' })
    vi.mocked(auth).mockResolvedValue(playerSession)
    const res = await generateBracket(
      makeRequest('POST', '/', { topCutSize: 4 }),
      makeParams({ id: tournament.id })
    )
    expect(res.status).toBe(403)
  })

  it('returns 400 when tournament is not IN_PROGRESS', async () => {
    const tournament = await createTestTournament(organizerId, gameId, { status: 'OPEN' })
    const res = await generateBracket(
      makeRequest('POST', '/', { topCutSize: 4 }),
      makeParams({ id: tournament.id })
    )
    expect(res.status).toBe(400)
  })

  it('returns 400 for invalid topCutSize', async () => {
    const tournament = await createTestTournament(organizerId, gameId, { status: 'IN_PROGRESS' })
    const res = await generateBracket(
      makeRequest('POST', '/', { topCutSize: 5 }),
      makeParams({ id: tournament.id })
    )
    expect(res.status).toBe(400)
  })

  it('returns 409 when bracket already exists', async () => {
    const { tournament } = await setupTournamentWithPlayers(4)
    await generateBracket(
      makeRequest('POST', '/', { topCutSize: 4 }),
      makeParams({ id: tournament.id })
    )
    const res = await generateBracket(
      makeRequest('POST', '/', { topCutSize: 4 }),
      makeParams({ id: tournament.id })
    )
    expect(res.status).toBe(409)
  })
})

// ─── POST /api/tournaments/[id]/bracket — génération individuelle ─────────────

describe('POST /api/tournaments/[id]/bracket — individual', () => {
  it('top 4 : génère 2 SF + 1 finale (3 matchs)', async () => {
    const { tournament } = await setupTournamentWithPlayers(4)
    const res = await generateBracket(
      makeRequest('POST', '/', { topCutSize: 4 }),
      makeParams({ id: tournament.id })
    )
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
    // roundOf 4 : 2 matchs, roundOf 2 : 1 match
    const sf = body.filter((m: any) => m.roundOf === 4)
    const final = body.filter((m: any) => m.roundOf === 2)
    expect(sf).toHaveLength(2)
    expect(final).toHaveLength(1)
  })

  it('top 8 : génère 4 QF + 2 SF + 1 finale (7 matchs)', async () => {
    const { tournament } = await setupTournamentWithPlayers(8)
    const res = await generateBracket(
      makeRequest('POST', '/', { topCutSize: 8 }),
      makeParams({ id: tournament.id })
    )
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.filter((m: any) => m.roundOf === 8)).toHaveLength(4)
    expect(body.filter((m: any) => m.roundOf === 4)).toHaveLength(2)
    expect(body.filter((m: any) => m.roundOf === 2)).toHaveLength(1)
    expect(body).toHaveLength(7)
  })

  it('seeding correct : position 1 a le seed 1 (plus de points) en player1', async () => {
    const { tournament, players } = await setupTournamentWithPlayers(4)
    const res = await generateBracket(
      makeRequest('POST', '/', { topCutSize: 4 }),
      makeParams({ id: tournament.id })
    )
    const body = await res.json()
    // SF position 1 : seed 1 vs seed 4
    const sf1 = body.find((m: any) => m.roundOf === 4 && m.position === 1)
    expect(sf1).toBeDefined()
    expect(sf1.player1Id).toBe(players[0]!.id) // seed 1
    expect(sf1.player2Id).toBe(players[3]!.id) // seed 4
  })

  it('seeding correct : SF position 2 a seed 2 vs seed 3', async () => {
    const { tournament, players } = await setupTournamentWithPlayers(4)
    const res = await generateBracket(
      makeRequest('POST', '/', { topCutSize: 4 }),
      makeParams({ id: tournament.id })
    )
    const body = await res.json()
    const sf2 = body.find((m: any) => m.roundOf === 4 && m.position === 2)
    expect(sf2).toBeDefined()
    expect(sf2.player1Id).toBe(players[1]!.id) // seed 2
    expect(sf2.player2Id).toBe(players[2]!.id) // seed 3
  })

  it('les rounds suivants sont créés à vide (players null)', async () => {
    const { tournament } = await setupTournamentWithPlayers(4)
    const res = await generateBracket(
      makeRequest('POST', '/', { topCutSize: 4 }),
      makeParams({ id: tournament.id })
    )
    const body = await res.json()
    const finale = body.find((m: any) => m.roundOf === 2)
    expect(finale.player1Id).toBeNull()
    expect(finale.player2Id).toBeNull()
    expect(finale.status).toBe('PENDING')
  })

  it('BYE automatique si moins de participants que topCutSize', async () => {
    // 3 joueurs, top 4 → position 2 (seed 4 absent) → BYE pour seed 3
    const { tournament } = await setupTournamentWithPlayers(3)
    const res = await generateBracket(
      makeRequest('POST', '/', { topCutSize: 4 }),
      makeParams({ id: tournament.id })
    )
    expect(res.status).toBe(201)
    const body = await res.json()
    const bye = body.find((m: any) => m.status === 'BYE')
    expect(bye).toBeDefined()
    expect(bye.winnerId).toBeDefined() // gagnant du BYE est set
  })

  it('topCutSize plus grand que les participants : bracket réduit à la puissance de 2 inférieure', async () => {
    // 5 joueurs, top 8 → bracket de 8 mais seulement 5 seedés (3 BYEs)
    const { tournament } = await setupTournamentWithPlayers(5)
    const res = await generateBracket(
      makeRequest('POST', '/', { topCutSize: 8 }),
      makeParams({ id: tournament.id })
    )
    expect(res.status).toBe(201)
    const body = await res.json()
    const byeMatches = body.filter((m: any) => m.status === 'BYE')
    expect(byeMatches.length).toBeGreaterThan(0)
  })

  it('met à jour topCutSize sur le tournoi', async () => {
    const { tournament } = await setupTournamentWithPlayers(4)
    await generateBracket(
      makeRequest('POST', '/', { topCutSize: 4 }),
      makeParams({ id: tournament.id })
    )
    const updated = await prisma.tournament.findUnique({ where: { id: tournament.id } })
    expect(updated?.topCutSize).toBe(4)
  })
})

// ─── POST /api/tournaments/[id]/bracket — génération équipes ─────────────────

describe('POST /api/tournaments/[id]/bracket — teams', () => {
  it('top 4 équipes : génère 2 SF + 1 finale avec team1/team2', async () => {
    const { tournament, teams } = await setupTeamTournament(4, 2)
    const res = await generateBracket(
      makeRequest('POST', '/', { topCutSize: 4 }),
      makeParams({ id: tournament.id })
    )
    expect(res.status).toBe(201)
    const body = await res.json()
    const sf = body.filter((m: any) => m.roundOf === 4)
    expect(sf).toHaveLength(2)
    // Vérifie que les équipes sont assignées (pas de players)
    expect(sf[0].team1Id).toBeDefined()
    expect(sf[0].player1Id).toBeNull()
    // Seeding : position 1 a l'équipe avec le plus de points
    const sf1 = body.find((m: any) => m.roundOf === 4 && m.position === 1)
    expect(sf1.team1Id).toBe(teams[0]!.id) // team seed 1
    expect(sf1.team2Id).toBe(teams[3]!.id) // team seed 4
  })
})

// ─── PATCH /api/tournaments/[id]/bracket/[matchId] — guards ──────────────────

describe('PATCH bracket match — guards', () => {
  it('returns 401 without auth', async () => {
    const { tournament } = await setupTournamentWithPlayers(4)
    const genRes = await generateBracket(
      makeRequest('POST', '/', { topCutSize: 4 }),
      makeParams({ id: tournament.id })
    )
    const matches = await genRes.json()
    const sf1 = matches.find((m: any) => m.roundOf === 4 && m.position === 1)

    vi.mocked(auth).mockResolvedValue(noSession)
    const res = await submitBracketResult(
      makeRequest('PATCH', '/', { player1Score: 1, player2Score: 0 }),
      makeParams({ id: tournament.id, matchId: sf1.id })
    )
    expect(res.status).toBe(401)
  })

  it('returns 403 for non-organizer', async () => {
    const { tournament } = await setupTournamentWithPlayers(4)
    const genRes = await generateBracket(
      makeRequest('POST', '/', { topCutSize: 4 }),
      makeParams({ id: tournament.id })
    )
    const matches = await genRes.json()
    const sf1 = matches.find((m: any) => m.roundOf === 4 && m.position === 1)

    vi.mocked(auth).mockResolvedValue(playerSession)
    const res = await submitBracketResult(
      makeRequest('PATCH', '/', { player1Score: 1, player2Score: 0 }),
      makeParams({ id: tournament.id, matchId: sf1.id })
    )
    expect(res.status).toBe(403)
  })

  it('returns 404 for unknown match', async () => {
    const { tournament } = await setupTournamentWithPlayers(4)
    const res = await submitBracketResult(
      makeRequest('PATCH', '/', { player1Score: 1, player2Score: 0 }),
      makeParams({ id: tournament.id, matchId: 'nonexistent' })
    )
    expect(res.status).toBe(404)
  })

  it('returns 400 for non-numeric scores', async () => {
    const { tournament } = await setupTournamentWithPlayers(4)
    const genRes = await generateBracket(
      makeRequest('POST', '/', { topCutSize: 4 }),
      makeParams({ id: tournament.id })
    )
    const matches = await genRes.json()
    const sf1 = matches.find((m: any) => m.roundOf === 4 && m.position === 1)

    const res = await submitBracketResult(
      makeRequest('PATCH', '/', { player1Score: 'win', player2Score: 0 }),
      makeParams({ id: tournament.id, matchId: sf1.id })
    )
    expect(res.status).toBe(400)
  })

  it('returns 400 for a draw (scores égaux)', async () => {
    const { tournament } = await setupTournamentWithPlayers(4)
    const genRes = await generateBracket(
      makeRequest('POST', '/', { topCutSize: 4 }),
      makeParams({ id: tournament.id })
    )
    const matches = await genRes.json()
    const sf1 = matches.find((m: any) => m.roundOf === 4 && m.position === 1)

    const res = await submitBracketResult(
      makeRequest('PATCH', '/', { player1Score: 3, player2Score: 3 }),
      makeParams({ id: tournament.id, matchId: sf1.id })
    )
    expect(res.status).toBe(400)
  })
})

// ─── PATCH bracket match — résultats et avancement ───────────────────────────

describe('PATCH bracket match — résultats', () => {
  it('player1 gagne : winnerId = player1Id, status COMPLETED', async () => {
    const { tournament } = await setupTournamentWithPlayers(4)
    const genRes = await generateBracket(
      makeRequest('POST', '/', { topCutSize: 4 }),
      makeParams({ id: tournament.id })
    )
    const matches = await genRes.json()
    const sf1 = matches.find((m: any) => m.roundOf === 4 && m.position === 1)

    const res = await submitBracketResult(
      makeRequest('PATCH', '/', { player1Score: 5, player2Score: 2 }),
      makeParams({ id: tournament.id, matchId: sf1.id })
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.status).toBe('COMPLETED')
    expect(body.winnerId).toBe(sf1.player1Id)
    expect(body.player1Score).toBe(5)
    expect(body.player2Score).toBe(2)
  })

  it('player2 gagne : winnerId = player2Id', async () => {
    const { tournament } = await setupTournamentWithPlayers(4)
    const genRes = await generateBracket(
      makeRequest('POST', '/', { topCutSize: 4 }),
      makeParams({ id: tournament.id })
    )
    const matches = await genRes.json()
    const sf1 = matches.find((m: any) => m.roundOf === 4 && m.position === 1)

    const res = await submitBracketResult(
      makeRequest('PATCH', '/', { player1Score: 1, player2Score: 5 }),
      makeParams({ id: tournament.id, matchId: sf1.id })
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.winnerId).toBe(sf1.player2Id)
  })

  it('gagnant SF position 1 (impair) → player1 de la finale', async () => {
    const { tournament } = await setupTournamentWithPlayers(4)
    const genRes = await generateBracket(
      makeRequest('POST', '/', { topCutSize: 4 }),
      makeParams({ id: tournament.id })
    )
    const matches = await genRes.json()
    const sf1 = matches.find((m: any) => m.roundOf === 4 && m.position === 1)

    await submitBracketResult(
      makeRequest('PATCH', '/', { player1Score: 5, player2Score: 0 }),
      makeParams({ id: tournament.id, matchId: sf1.id })
    )

    // Vérifier que le gagnant est en player1 de la finale (position 1, roundOf 2)
    const finale = await prisma.bracketMatch.findFirst({
      where: { tournamentId: tournament.id, roundOf: 2, position: 1 },
    })
    expect(finale?.player1Id).toBe(sf1.player1Id)
    expect(finale?.player2Id).toBeNull() // SF2 pas encore jouée
  })

  it('gagnant SF position 2 (pair) → player2 de la finale', async () => {
    const { tournament } = await setupTournamentWithPlayers(4)
    const genRes = await generateBracket(
      makeRequest('POST', '/', { topCutSize: 4 }),
      makeParams({ id: tournament.id })
    )
    const matches = await genRes.json()
    const sf2 = matches.find((m: any) => m.roundOf === 4 && m.position === 2)

    await submitBracketResult(
      makeRequest('PATCH', '/', { player1Score: 5, player2Score: 0 }),
      makeParams({ id: tournament.id, matchId: sf2.id })
    )

    const finale = await prisma.bracketMatch.findFirst({
      where: { tournamentId: tournament.id, roundOf: 2, position: 1 },
    })
    expect(finale?.player2Id).toBe(sf2.player1Id)
    expect(finale?.player1Id).toBeNull() // SF1 pas encore jouée
  })

  it('finale : le gagnant ne crée pas de match suivant', async () => {
    const { tournament } = await setupTournamentWithPlayers(4)
    const genRes = await generateBracket(
      makeRequest('POST', '/', { topCutSize: 4 }),
      makeParams({ id: tournament.id })
    )
    const allMatches = await genRes.json()

    // Jouer SF1 et SF2
    const sf1 = allMatches.find((m: any) => m.roundOf === 4 && m.position === 1)
    const sf2 = allMatches.find((m: any) => m.roundOf === 4 && m.position === 2)

    await submitBracketResult(
      makeRequest('PATCH', '/', { player1Score: 5, player2Score: 0 }),
      makeParams({ id: tournament.id, matchId: sf1.id })
    )
    await submitBracketResult(
      makeRequest('PATCH', '/', { player1Score: 5, player2Score: 0 }),
      makeParams({ id: tournament.id, matchId: sf2.id })
    )

    // Jouer la finale
    const finale = await prisma.bracketMatch.findFirst({
      where: { tournamentId: tournament.id, roundOf: 2 },
    })
    const res = await submitBracketResult(
      makeRequest('PATCH', '/', { player1Score: 5, player2Score: 2 }),
      makeParams({ id: tournament.id, matchId: finale!.id })
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.status).toBe('COMPLETED')
    expect(body.winnerId).toBeDefined()

    // Pas de nouveau match créé (toujours 3 matchs total)
    const total = await prisma.bracketMatch.count({ where: { tournamentId: tournament.id } })
    expect(total).toBe(3)
  })

  it('top 8 : parcours complet QF → SF → Finale', async () => {
    const { tournament } = await setupTournamentWithPlayers(8)
    const genRes = await generateBracket(
      makeRequest('POST', '/', { topCutSize: 8 }),
      makeParams({ id: tournament.id })
    )
    const allMatches = await genRes.json()
    const qfs = allMatches.filter((m: any) => m.roundOf === 8).sort((a: any, b: any) => a.position - b.position)

    // Jouer tous les QF (player1 gagne)
    for (const qf of qfs) {
      await submitBracketResult(
        makeRequest('PATCH', '/', { player1Score: 3, player2Score: 1 }),
        makeParams({ id: tournament.id, matchId: qf.id })
      )
    }

    // Les SF doivent maintenant avoir leurs participants
    const sfs = await prisma.bracketMatch.findMany({
      where: { tournamentId: tournament.id, roundOf: 4 },
    })
    expect(sfs.every((m) => m.player1Id && m.player2Id)).toBe(true)

    // Jouer les SF
    for (const sf of sfs) {
      await submitBracketResult(
        makeRequest('PATCH', '/', { player1Score: 3, player2Score: 1 }),
        makeParams({ id: tournament.id, matchId: sf.id })
      )
    }

    // La finale doit avoir ses deux participants
    const finale = await prisma.bracketMatch.findFirst({
      where: { tournamentId: tournament.id, roundOf: 2 },
    })
    expect(finale?.player1Id).toBeDefined()
    expect(finale?.player2Id).toBeDefined()

    // Jouer la finale
    const res = await submitBracketResult(
      makeRequest('PATCH', '/', { player1Score: 5, player2Score: 3 }),
      makeParams({ id: tournament.id, matchId: finale!.id })
    )
    expect(res.status).toBe(200)
    const finalBody = await res.json()
    expect(finalBody.status).toBe('COMPLETED')
    expect(finalBody.winnerId).toBe(finale!.player1Id)
  })
})
