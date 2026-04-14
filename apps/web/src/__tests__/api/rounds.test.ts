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

let organizerId: string
let playerId: string
let gameId: string

// Extra users for multi-player tests
async function getOrCreateExtraUser(email: string, name: string) {
  return prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, name, role: 'PLAYER', keycloakId: `test-${email}` },
  })
}

beforeAll(async () => {
  const [organizer, player, game] = await Promise.all([
    getOrganizerUser(),
    getPlayerUser(),
    getFirstGame(),
  ])
  organizerId = organizer.id
  playerId = player.id
  gameId = game.id
})

afterAll(async () => {
  await cleanupTestData()
  // Clean extra test users
  await prisma.user.deleteMany({
    where: { email: { endsWith: '@rounds-test.local' } },
  })
})

beforeEach(() => {
  vi.mocked(auth).mockResolvedValue(organizerSession)
})

// ─── Auth & access guards ────────────────────────────────────────────────────

describe('POST /api/tournaments/[id]/rounds — guards', () => {
  it('returns 401 without auth', async () => {
    vi.mocked(auth).mockResolvedValue(noSession)
    const tournament = await createTestTournament(organizerId, gameId, { status: 'IN_PROGRESS' })
    const req = makeRequest('POST', '/', {})
    const res = await generateRound(req, makeParams({ id: tournament.id }))
    expect(res.status).toBe(401)
  })

  it('returns 403 for non-organizer', async () => {
    vi.mocked(auth).mockResolvedValue(playerSession)
    const tournament = await createTestTournament(organizerId, gameId, { status: 'IN_PROGRESS' })
    const req = makeRequest('POST', '/', {})
    const res = await generateRound(req, makeParams({ id: tournament.id }))
    expect(res.status).toBe(403)
  })

  it('returns 400 when tournament not IN_PROGRESS', async () => {
    const tournament = await createTestTournament(organizerId, gameId, { status: 'OPEN' })
    const req = makeRequest('POST', '/', {})
    const res = await generateRound(req, makeParams({ id: tournament.id }))
    expect(res.status).toBe(400)
  })
})

// ─── Individual Swiss round generation ──────────────────────────────────────

describe('POST /api/tournaments/[id]/rounds — individual Swiss', () => {
  it('generates round 1 with correct number of matches for even players', async () => {
    const u1 = await getOrCreateExtraUser('p1@rounds-test.local', 'P1')
    const u2 = await getOrCreateExtraUser('p2@rounds-test.local', 'P2')
    const u3 = await getOrCreateExtraUser('p3@rounds-test.local', 'P3')
    const u4 = await getOrCreateExtraUser('p4@rounds-test.local', 'P4')

    const tournament = await createTestTournament(organizerId, gameId, {
      status: 'IN_PROGRESS',
      maxPlayers: 8,
    })
    await Promise.all([
      registerPlayer(tournament.id, u1.id),
      registerPlayer(tournament.id, u2.id),
      registerPlayer(tournament.id, u3.id),
      registerPlayer(tournament.id, u4.id),
    ])

    const req = makeRequest('POST', '/', {})
    const res = await generateRound(req, makeParams({ id: tournament.id }))
    expect(res.status).toBe(201)

    const body = await res.json()
    expect(body.number).toBe(1)
    expect(body.status).toBe('IN_PROGRESS')
    // 4 players → 2 matches
    expect(body.matches).toHaveLength(2)
    expect(body.matches.every((m: any) => m.status === 'PENDING')).toBe(true)
  })

  it('generates BYE for odd number of players', async () => {
    const u1 = await getOrCreateExtraUser('odd1@rounds-test.local', 'Odd1')
    const u2 = await getOrCreateExtraUser('odd2@rounds-test.local', 'Odd2')
    const u3 = await getOrCreateExtraUser('odd3@rounds-test.local', 'Odd3')

    const tournament = await createTestTournament(organizerId, gameId, {
      status: 'IN_PROGRESS',
      maxPlayers: 8,
    })
    await Promise.all([
      registerPlayer(tournament.id, u1.id),
      registerPlayer(tournament.id, u2.id),
      registerPlayer(tournament.id, u3.id),
    ])

    const req = makeRequest('POST', '/', {})
    const res = await generateRound(req, makeParams({ id: tournament.id }))
    expect(res.status).toBe(201)

    const body = await res.json()
    // 3 players → 1 match + 1 BYE
    expect(body.matches).toHaveLength(2)
    const bye = body.matches.find((m: any) => m.status === 'BYE')
    expect(bye).toBeDefined()
    expect(bye.winnerId).toBeDefined() // earned BYE gives a win
  })

  it('marks absent players with loss BYE', async () => {
    const u1 = await getOrCreateExtraUser('abs1@rounds-test.local', 'Abs1')
    const u2 = await getOrCreateExtraUser('abs2@rounds-test.local', 'Abs2')
    const u3 = await getOrCreateExtraUser('abs3@rounds-test.local', 'Abs3')
    const u4 = await getOrCreateExtraUser('abs4@rounds-test.local', 'Abs4')

    const tournament = await createTestTournament(organizerId, gameId, {
      status: 'IN_PROGRESS',
      maxPlayers: 8,
    })
    const [reg1, reg2, reg3, reg4] = await Promise.all([
      registerPlayer(tournament.id, u1.id),
      registerPlayer(tournament.id, u2.id),
      registerPlayer(tournament.id, u3.id),
      registerPlayer(tournament.id, u4.id),
    ])

    const req = makeRequest('POST', '/', { absentPlayerIds: [reg4.id] })
    const res = await generateRound(req, makeParams({ id: tournament.id }))
    expect(res.status).toBe(201)

    const body = await res.json()
    // 3 active → 1 match + 1 earned BYE; 1 absent → 1 absent BYE = 3 total
    const absent = body.matches.find(
      (m: any) => m.status === 'BYE' && m.player1Id === reg4.id && !m.winnerId
    )
    expect(absent).toBeDefined()

    // Verify absent player got a loss
    const absentPlayer = await prisma.tournamentPlayer.findUnique({ where: { id: reg4.id } })
    expect(absentPlayer?.losses).toBe(1)
  })

  it('returns 400 when fewer than 2 active players', async () => {
    const u1 = await getOrCreateExtraUser('lone1@rounds-test.local', 'Lone1')
    const tournament = await createTestTournament(organizerId, gameId, {
      status: 'IN_PROGRESS',
      maxPlayers: 4,
    })
    const reg = await registerPlayer(tournament.id, u1.id)
    const req = makeRequest('POST', '/', { absentPlayerIds: [] })
    const res = await generateRound(req, makeParams({ id: tournament.id }))
    // 1 player → needs 2
    expect(res.status).toBe(400)
  })

  it('returns 400 when current round is not COMPLETED', async () => {
    const u1 = await getOrCreateExtraUser('nr1@rounds-test.local', 'NR1')
    const u2 = await getOrCreateExtraUser('nr2@rounds-test.local', 'NR2')
    const tournament = await createTestTournament(organizerId, gameId, {
      status: 'IN_PROGRESS',
      maxPlayers: 4,
    })
    await Promise.all([
      registerPlayer(tournament.id, u1.id),
      registerPlayer(tournament.id, u2.id),
    ])

    // Generate round 1
    await generateRound(makeRequest('POST', '/', {}), makeParams({ id: tournament.id }))

    // Try to generate round 2 without closing round 1
    const req = makeRequest('POST', '/', {})
    const res = await generateRound(req, makeParams({ id: tournament.id }))
    expect(res.status).toBe(400)
  })
})

// ─── Team Swiss round generation ─────────────────────────────────────────────

describe('POST /api/tournaments/[id]/rounds — team Swiss', () => {
  it('generates 1 TeamMatch + 3 individual matches for 2 teams of 3', async () => {
    const users = await Promise.all([
      getOrCreateExtraUser('ta1@rounds-test.local', 'TA1'),
      getOrCreateExtraUser('ta2@rounds-test.local', 'TA2'),
      getOrCreateExtraUser('ta3@rounds-test.local', 'TA3'),
      getOrCreateExtraUser('tb1@rounds-test.local', 'TB1'),
      getOrCreateExtraUser('tb2@rounds-test.local', 'TB2'),
      getOrCreateExtraUser('tb3@rounds-test.local', 'TB3'),
    ])

    const tournament = await createTestTournament(organizerId, gameId, {
      status: 'IN_PROGRESS',
      maxPlayers: 12,
      teamSize: 3,
    })
    const regs = await Promise.all(users.map((u) => registerPlayer(tournament.id, u.id)))

    const teamA = await createTeam(tournament.id, `${PREFIX} Alpha`)
    const teamB = await createTeam(tournament.id, `${PREFIX} Bravo`)

    await Promise.all([
      assignPlayerToTeam(regs[0]!.id, teamA.id),
      assignPlayerToTeam(regs[1]!.id, teamA.id),
      assignPlayerToTeam(regs[2]!.id, teamA.id),
      assignPlayerToTeam(regs[3]!.id, teamB.id),
      assignPlayerToTeam(regs[4]!.id, teamB.id),
      assignPlayerToTeam(regs[5]!.id, teamB.id),
    ])

    const req = makeRequest('POST', '/', {})
    const res = await generateRound(req, makeParams({ id: tournament.id }))
    expect(res.status).toBe(201)

    const body = await res.json()
    expect(body.teamMatches).toHaveLength(1)
    expect(body.teamMatches[0].status).toBe('PENDING')
    expect(body.teamMatches[0].matches).toHaveLength(3)
    // Tables T1, T2, T3
    const tables = body.teamMatches[0].matches.map((m: any) => m.table).sort()
    expect(tables).toEqual([1, 2, 3])
  })

  it('returns 400 when no active teams remain (all absent)', async () => {
    const u1 = await getOrCreateExtraUser('lone-t1@rounds-test.local', 'LoneT1')
    const u2 = await getOrCreateExtraUser('lone-t2@rounds-test.local', 'LoneT2')
    const u3 = await getOrCreateExtraUser('lone-t3@rounds-test.local', 'LoneT3')

    const tournament = await createTestTournament(organizerId, gameId, {
      status: 'IN_PROGRESS',
      maxPlayers: 8,
      teamSize: 3,
    })
    const regs = await Promise.all([
      registerPlayer(tournament.id, u1.id),
      registerPlayer(tournament.id, u2.id),
      registerPlayer(tournament.id, u3.id),
    ])
    const teamA = await createTeam(tournament.id, `${PREFIX} Solo Team`)
    await Promise.all(regs.map((r) => assignPlayerToTeam(r.id, teamA.id)))

    // Mark the only team as absent → 0 active teams → 400
    const req = makeRequest('POST', '/', { absentTeamIds: [teamA.id] })
    const res = await generateRound(req, makeParams({ id: tournament.id }))
    expect(res.status).toBe(400)
  })

  it('handles absent team — gives opponent a BYE win', async () => {
    const users = await Promise.all([
      getOrCreateExtraUser('bye-ta1@rounds-test.local', 'ByeTA1'),
      getOrCreateExtraUser('bye-ta2@rounds-test.local', 'ByeTA2'),
      getOrCreateExtraUser('bye-ta3@rounds-test.local', 'ByeTA3'),
      getOrCreateExtraUser('bye-tb1@rounds-test.local', 'ByeTB1'),
      getOrCreateExtraUser('bye-tb2@rounds-test.local', 'ByeTB2'),
      getOrCreateExtraUser('bye-tb3@rounds-test.local', 'ByeTB3'),
    ])

    const tournament = await createTestTournament(organizerId, gameId, {
      status: 'IN_PROGRESS',
      maxPlayers: 12,
      teamSize: 3,
    })
    const regs = await Promise.all(users.map((u) => registerPlayer(tournament.id, u.id)))

    const teamA = await createTeam(tournament.id, `${PREFIX} BYE Alpha`)
    const teamB = await createTeam(tournament.id, `${PREFIX} BYE Bravo`)

    await Promise.all([
      assignPlayerToTeam(regs[0]!.id, teamA.id),
      assignPlayerToTeam(regs[1]!.id, teamA.id),
      assignPlayerToTeam(regs[2]!.id, teamA.id),
      assignPlayerToTeam(regs[3]!.id, teamB.id),
      assignPlayerToTeam(regs[4]!.id, teamB.id),
      assignPlayerToTeam(regs[5]!.id, teamB.id),
    ])

    // Bravo is absent → Alpha gets BYE win
    const req = makeRequest('POST', '/', { absentTeamIds: [teamB.id] })
    const res = await generateRound(req, makeParams({ id: tournament.id }))
    expect(res.status).toBe(201)

    const body = await res.json()
    // 1 active team → BYE
    expect(body.teamMatches).toHaveLength(1)
    expect(body.teamMatches[0].status).toBe('COMPLETED')
    expect(body.teamMatches[0].winnerId).toBe(teamA.id)

    // Alpha team should have 1 win
    const alphaTeam = await prisma.team.findUnique({ where: { id: teamA.id } })
    expect(alphaTeam?.wins).toBe(1)
    expect(alphaTeam?.points).toBe(3)
  })
})
