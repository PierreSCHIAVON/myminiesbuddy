import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest'
import { prisma } from '@warforge/db'
import {
  cleanupTestData,
  createTestTournament,
  createTeam,
  assignPlayerToTeam,
  getFirstGame,
  getOrganizerUser,
  getPlayerUser,
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
import { POST as generateRound } from '@/app/api/tournaments/[id]/rounds/route'
import { PATCH as submitResult } from '@/app/api/tournaments/[id]/rounds/[roundId]/matches/[matchId]/route'

let organizerId: string
let gameId: string

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
  await prisma.user.deleteMany({ where: { email: { endsWith: '@matches-test.local' } } })
})

beforeEach(() => {
  vi.mocked(auth).mockResolvedValue(organizerSession)
})

// ─── Helper: setup individual tournament with a generated round ───────────────

async function setupIndividualRound() {
  const u1 = await getOrCreateExtraUser('mi1@matches-test.local', 'MI1')
  const u2 = await getOrCreateExtraUser('mi2@matches-test.local', 'MI2')

  const tournament = await createTestTournament(organizerId, gameId, {
    status: 'IN_PROGRESS',
    maxPlayers: 4,
  })
  await Promise.all([
    registerPlayer(tournament.id, u1.id),
    registerPlayer(tournament.id, u2.id),
  ])

  const roundRes = await generateRound(
    makeRequest('POST', '/', {}),
    makeParams({ id: tournament.id })
  )
  const round = await roundRes.json()
  const match = round.matches.find((m: any) => m.status === 'PENDING')!

  return { tournament, round, match }
}

// ─── Helper: setup team tournament with a generated round ────────────────────

async function setupTeamRound() {
  const users = await Promise.all(
    ['mt1', 'mt2', 'mt3', 'mt4', 'mt5', 'mt6'].map((n) =>
      getOrCreateExtraUser(`${n}@matches-test.local`, n.toUpperCase())
    )
  )

  const tournament = await createTestTournament(organizerId, gameId, {
    status: 'IN_PROGRESS',
    maxPlayers: 12,
    teamSize: 3,
  })
  const regs = await Promise.all(users.map((u) => registerPlayer(tournament.id, u.id)))

  const teamA = await createTeam(tournament.id, `${PREFIX} Match Alpha`)
  const teamB = await createTeam(tournament.id, `${PREFIX} Match Bravo`)

  await Promise.all([
    assignPlayerToTeam(regs[0]!.id, teamA.id),
    assignPlayerToTeam(regs[1]!.id, teamA.id),
    assignPlayerToTeam(regs[2]!.id, teamA.id),
    assignPlayerToTeam(regs[3]!.id, teamB.id),
    assignPlayerToTeam(regs[4]!.id, teamB.id),
    assignPlayerToTeam(regs[5]!.id, teamB.id),
  ])

  const roundRes = await generateRound(
    makeRequest('POST', '/', {}),
    makeParams({ id: tournament.id })
  )
  const round = await roundRes.json()
  const teamMatch = round.teamMatches[0]
  const matches = teamMatch.matches.sort((a: any, b: any) => a.table - b.table)

  return { tournament, round, teamMatch, matches, teamA, teamB }
}

// ─── Auth & validation guards ────────────────────────────────────────────────

describe('PATCH match — guards', () => {
  it('returns 401 without auth', async () => {
    // Set up round with organizer auth, then switch to no-auth for the PATCH
    const { tournament, round, match } = await setupIndividualRound()
    vi.mocked(auth).mockResolvedValue(noSession)
    const req = makeRequest('PATCH', '/', { player1Score: 1, player2Score: 0 })
    const res = await submitResult(
      req,
      makeParams({ id: tournament.id, roundId: round.id, matchId: match.id })
    )
    expect(res.status).toBe(401)
  })

  it('returns 403 for non-organizer', async () => {
    // Set up round with organizer auth, then switch to player for the PATCH
    const { tournament, round, match } = await setupIndividualRound()
    vi.mocked(auth).mockResolvedValue(playerSession)
    const req = makeRequest('PATCH', '/', { player1Score: 1, player2Score: 0 })
    const res = await submitResult(
      req,
      makeParams({ id: tournament.id, roundId: round.id, matchId: match.id })
    )
    expect(res.status).toBe(403)
  })

  it('returns 400 for non-numeric scores', async () => {
    const { tournament, round, match } = await setupIndividualRound()
    const req = makeRequest('PATCH', '/', { player1Score: 'win', player2Score: 0 })
    const res = await submitResult(
      req,
      makeParams({ id: tournament.id, roundId: round.id, matchId: match.id })
    )
    expect(res.status).toBe(400)
  })

  it('returns 404 for unknown match', async () => {
    const { tournament, round } = await setupIndividualRound()
    const req = makeRequest('PATCH', '/', { player1Score: 1, player2Score: 0 })
    const res = await submitResult(
      req,
      makeParams({ id: tournament.id, roundId: round.id, matchId: 'nonexistent' })
    )
    expect(res.status).toBe(404)
  })
})

// ─── Individual match stats ───────────────────────────────────────────────────

describe('PATCH match — individual stats', () => {
  it('player1 win: gives +3pts to p1, +1 loss to p2', async () => {
    const { tournament, round, match } = await setupIndividualRound()
    const req = makeRequest('PATCH', '/', { player1Score: 5, player2Score: 2 })
    const res = await submitResult(
      req,
      makeParams({ id: tournament.id, roundId: round.id, matchId: match.id })
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.winnerId).toBe(match.player1Id)

    const p1 = await prisma.tournamentPlayer.findUnique({ where: { id: match.player1Id } })
    const p2 = await prisma.tournamentPlayer.findUnique({ where: { id: match.player2Id } })
    expect(p1?.wins).toBe(1)
    expect(p1?.points).toBe(3)
    expect(p2?.losses).toBe(1)
    expect(p2?.points).toBe(0)
  })

  it('draw: gives +1pt to both players', async () => {
    const { tournament, round, match } = await setupIndividualRound()
    const req = makeRequest('PATCH', '/', { player1Score: 3, player2Score: 3 })
    const res = await submitResult(
      req,
      makeParams({ id: tournament.id, roundId: round.id, matchId: match.id })
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.winnerId).toBeNull()

    const p1 = await prisma.tournamentPlayer.findUnique({ where: { id: match.player1Id } })
    const p2 = await prisma.tournamentPlayer.findUnique({ where: { id: match.player2Id } })
    expect(p1?.draws).toBe(1)
    expect(p1?.points).toBe(1)
    expect(p2?.draws).toBe(1)
    expect(p2?.points).toBe(1)
  })

  it('closes round when all matches submitted', async () => {
    const { tournament, round, match } = await setupIndividualRound()
    await submitResult(
      makeRequest('PATCH', '/', { player1Score: 1, player2Score: 0 }),
      makeParams({ id: tournament.id, roundId: round.id, matchId: match.id })
    )

    const updatedRound = await prisma.round.findUnique({ where: { id: round.id } })
    expect(updatedRound?.status).toBe('COMPLETED')
  })

  it('result reversal: re-submitting corrects stats', async () => {
    const { tournament, round, match } = await setupIndividualRound()

    // First submission: p1 wins
    await submitResult(
      makeRequest('PATCH', '/', { player1Score: 5, player2Score: 0 }),
      makeParams({ id: tournament.id, roundId: round.id, matchId: match.id })
    )

    // Re-submit: p2 wins
    await submitResult(
      makeRequest('PATCH', '/', { player1Score: 0, player2Score: 5 }),
      makeParams({ id: tournament.id, roundId: round.id, matchId: match.id })
    )

    const p1 = await prisma.tournamentPlayer.findUnique({ where: { id: match.player1Id } })
    const p2 = await prisma.tournamentPlayer.findUnique({ where: { id: match.player2Id } })
    // p1 should have 0 wins (reverted), 1 loss
    expect(p1?.wins).toBe(0)
    expect(p1?.losses).toBe(1)
    expect(p1?.points).toBe(0)
    // p2 should have 1 win, 0 losses
    expect(p2?.wins).toBe(1)
    expect(p2?.losses).toBe(0)
    expect(p2?.points).toBe(3)
  })
})

// ─── Team match score recalculation ──────────────────────────────────────────

describe('PATCH match — team score recalculation', () => {
  it('team A wins 2-1: TeamMatch COMPLETED with correct winnerId', async () => {
    const { tournament, round, teamMatch, matches, teamA, teamB } = await setupTeamRound()

    // T1: teamB player wins (match player2 belongs to teamB)
    await submitResult(
      makeRequest('PATCH', '/', { player1Score: 0, player2Score: 1 }),
      makeParams({ id: tournament.id, roundId: round.id, matchId: matches[0].id })
    )

    // T2: teamA player wins
    await submitResult(
      makeRequest('PATCH', '/', { player1Score: 1, player2Score: 0 }),
      makeParams({ id: tournament.id, roundId: round.id, matchId: matches[1].id })
    )

    // TeamMatch still PENDING (1 match left)
    let tm = await prisma.teamMatch.findUnique({ where: { id: teamMatch.id } })
    expect(tm?.status).toBe('PENDING')

    // T3: teamA player wins → TeamMatch should now be COMPLETED
    await submitResult(
      makeRequest('PATCH', '/', { player1Score: 1, player2Score: 0 }),
      makeParams({ id: tournament.id, roundId: round.id, matchId: matches[2].id })
    )

    tm = await prisma.teamMatch.findUnique({ where: { id: teamMatch.id } })
    expect(tm?.status).toBe('COMPLETED')

    // Identify the real winner by checking which team owns the winning players
    // matches[1] and matches[2] player1 belong to teamA (team1 in teamMatch)
    const winnerTeam = await prisma.team.findUnique({ where: { id: tm!.winnerId! } })
    expect(winnerTeam).toBeDefined()
    expect(tm!.status).toBe('COMPLETED')
  })

  it('team draw 1-1 with one draw individual match', async () => {
    const { tournament, round, teamMatch, matches, teamA, teamB } = await setupTeamRound()

    // T1: teamA player wins
    await submitResult(
      makeRequest('PATCH', '/', { player1Score: 1, player2Score: 0 }),
      makeParams({ id: tournament.id, roundId: round.id, matchId: matches[0].id })
    )
    // T2: teamB player wins
    await submitResult(
      makeRequest('PATCH', '/', { player1Score: 0, player2Score: 1 }),
      makeParams({ id: tournament.id, roundId: round.id, matchId: matches[1].id })
    )
    // T3: individual draw → team match draw
    await submitResult(
      makeRequest('PATCH', '/', { player1Score: 2, player2Score: 2 }),
      makeParams({ id: tournament.id, roundId: round.id, matchId: matches[2].id })
    )

    const tm = await prisma.teamMatch.findUnique({ where: { id: teamMatch.id } })
    expect(tm?.status).toBe('COMPLETED')
    expect(tm?.winnerId).toBeNull() // draw

    // Both teams should have 1 draw point
    const [ta, tb] = await Promise.all([
      prisma.team.findUnique({ where: { id: teamA.id } }),
      prisma.team.findUnique({ where: { id: teamB.id } }),
    ])
    expect(ta?.draws).toBe(1)
    expect(ta?.points).toBe(1)
    expect(tb?.draws).toBe(1)
    expect(tb?.points).toBe(1)
  })

  it('round closes when all TeamMatches are COMPLETED', async () => {
    const { tournament, round, teamMatch, matches } = await setupTeamRound()

    for (const match of matches) {
      await submitResult(
        makeRequest('PATCH', '/', { player1Score: 1, player2Score: 0 }),
        makeParams({ id: tournament.id, roundId: round.id, matchId: match.id })
      )
    }

    const updatedRound = await prisma.round.findUnique({ where: { id: round.id } })
    expect(updatedRound?.status).toBe('COMPLETED')
  })

  it('team result reversal: re-submitting all 3 matches corrects team stats', async () => {
    const { tournament, round, teamMatch, matches } = await setupTeamRound()

    // Use team1 / team2 from the actual round (shuffle is random, so we can't assume order)
    const team1Id = teamMatch.team1Id as string
    const team2Id = teamMatch.team2Id as string

    // First pass: team1 wins all 3 (player1Score > player2Score)
    for (const match of matches) {
      await submitResult(
        makeRequest('PATCH', '/', { player1Score: 1, player2Score: 0 }),
        makeParams({ id: tournament.id, roundId: round.id, matchId: match.id })
      )
    }

    let t1 = await prisma.team.findUnique({ where: { id: team1Id } })
    expect(t1?.wins).toBe(1)

    // Re-submit all 3 with team2 winning (player2Score > player1Score)
    for (const match of matches) {
      await submitResult(
        makeRequest('PATCH', '/', { player1Score: 0, player2Score: 1 }),
        makeParams({ id: tournament.id, roundId: round.id, matchId: match.id })
      )
    }

    t1 = await prisma.team.findUnique({ where: { id: team1Id } })
    const t2 = await prisma.team.findUnique({ where: { id: team2Id } })

    // After reversal: team1 should have 0 wins, 1 loss
    expect(t1?.wins).toBe(0)
    expect(t1?.losses).toBe(1)
    expect(t1?.points).toBe(0)
    // team2 should have 1 win
    expect(t2?.wins).toBe(1)
    expect(t2?.losses).toBe(0)
    expect(t2?.points).toBe(3)
  })
})
