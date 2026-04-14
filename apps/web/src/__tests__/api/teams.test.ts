import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest'
import {
  cleanupTestData,
  createTestTournament,
  createTeam,
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
import { GET as getTeams, POST as createTeamRoute } from '@/app/api/tournaments/[id]/teams/route'
import {
  PATCH as patchTeam,
  DELETE as deleteTeam,
} from '@/app/api/tournaments/[id]/teams/[teamId]/route'

let organizerId: string
let playerId: string
let gameId: string

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
})

beforeEach(() => {
  vi.mocked(auth).mockResolvedValue(organizerSession)
})

// ─── GET /api/tournaments/[id]/teams ────────────────────────────────────────

describe('GET /api/tournaments/[id]/teams', () => {
  it('returns empty list for tournament with no teams', async () => {
    const tournament = await createTestTournament(organizerId, gameId, { teamSize: 3 })
    const req = makeRequest('GET', `/api/tournaments/${tournament.id}/teams`)
    const res = await getTeams(req, makeParams({ id: tournament.id }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
    expect(body).toHaveLength(0)
  })

  it('returns teams with players', async () => {
    const tournament = await createTestTournament(organizerId, gameId, { teamSize: 3 })
    await createTeam(tournament.id, `${PREFIX} Équipe A`)
    const req = makeRequest('GET', `/api/tournaments/${tournament.id}/teams`)
    const res = await getTeams(req, makeParams({ id: tournament.id }))
    const body = await res.json()
    expect(body).toHaveLength(1)
    expect(body[0].name).toBe(`${PREFIX} Équipe A`)
    expect(body[0].players).toBeDefined()
  })
})

// ─── POST /api/tournaments/[id]/teams ───────────────────────────────────────

describe('POST /api/tournaments/[id]/teams', () => {
  it('returns 401 without auth', async () => {
    vi.mocked(auth).mockResolvedValue(noSession)
    const tournament = await createTestTournament(organizerId, gameId, { teamSize: 3 })
    const req = makeRequest('POST', `/api/tournaments/${tournament.id}/teams`, { name: 'Alpha' })
    const res = await createTeamRoute(req, makeParams({ id: tournament.id }))
    expect(res.status).toBe(401)
  })

  it('returns 403 for non-organizer', async () => {
    vi.mocked(auth).mockResolvedValue(playerSession)
    const tournament = await createTestTournament(organizerId, gameId, { teamSize: 3 })
    const req = makeRequest('POST', `/api/tournaments/${tournament.id}/teams`, { name: 'Alpha' })
    const res = await createTeamRoute(req, makeParams({ id: tournament.id }))
    expect(res.status).toBe(403)
  })

  it('returns 400 for non-team tournament', async () => {
    const tournament = await createTestTournament(organizerId, gameId) // teamSize = null
    const req = makeRequest('POST', `/api/tournaments/${tournament.id}/teams`, { name: 'Alpha' })
    const res = await createTeamRoute(req, makeParams({ id: tournament.id }))
    expect(res.status).toBe(400)
  })

  it('returns 400 for empty name', async () => {
    const tournament = await createTestTournament(organizerId, gameId, { teamSize: 3 })
    const req = makeRequest('POST', `/api/tournaments/${tournament.id}/teams`, { name: '   ' })
    const res = await createTeamRoute(req, makeParams({ id: tournament.id }))
    expect(res.status).toBe(400)
  })

  it('creates team successfully', async () => {
    const tournament = await createTestTournament(organizerId, gameId, { teamSize: 3 })
    const req = makeRequest('POST', `/api/tournaments/${tournament.id}/teams`, { name: `${PREFIX} Alpha` })
    const res = await createTeamRoute(req, makeParams({ id: tournament.id }))
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.name).toBe(`${PREFIX} Alpha`)
    expect(body.players).toEqual([])
  })

  it('returns 409 for duplicate team name', async () => {
    const tournament = await createTestTournament(organizerId, gameId, { teamSize: 3 })
    await createTeam(tournament.id, `${PREFIX} Bravo`)
    const req = makeRequest('POST', `/api/tournaments/${tournament.id}/teams`, { name: `${PREFIX} Bravo` })
    const res = await createTeamRoute(req, makeParams({ id: tournament.id }))
    expect(res.status).toBe(409)
  })
})

// ─── PATCH /api/tournaments/[id]/teams/[teamId] ──────────────────────────────

describe('PATCH /api/tournaments/[id]/teams/[teamId]', () => {
  it('returns 401 without auth', async () => {
    vi.mocked(auth).mockResolvedValue(noSession)
    const tournament = await createTestTournament(organizerId, gameId, { teamSize: 3 })
    const team = await createTeam(tournament.id, `${PREFIX} T1`)
    const req = makeRequest('PATCH', `/api/tournaments/${tournament.id}/teams/${team.id}`, { name: 'Renamed' })
    const res = await patchTeam(req, makeParams({ id: tournament.id, teamId: team.id }))
    expect(res.status).toBe(401)
  })

  it('renames team successfully', async () => {
    const tournament = await createTestTournament(organizerId, gameId, { teamSize: 3 })
    const team = await createTeam(tournament.id, `${PREFIX} Old Name`)
    const req = makeRequest('PATCH', `/api/tournaments/${tournament.id}/teams/${team.id}`, { name: `${PREFIX} New Name` })
    const res = await patchTeam(req, makeParams({ id: tournament.id, teamId: team.id }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.name).toBe(`${PREFIX} New Name`)
  })

  it('assigns player to team', async () => {
    const tournament = await createTestTournament(organizerId, gameId, { teamSize: 3 })
    const team = await createTeam(tournament.id, `${PREFIX} Assign Test`)
    const registration = await registerPlayer(tournament.id, playerId)

    const req = makeRequest('PATCH', `/api/tournaments/${tournament.id}/teams/${team.id}`, {
      addPlayerId: registration.id,
    })
    const res = await patchTeam(req, makeParams({ id: tournament.id, teamId: team.id }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.players).toHaveLength(1)
    expect(body.players[0].user.id).toBe(playerId)
  })

  it('returns 409 when player already in a team', async () => {
    const tournament = await createTestTournament(organizerId, gameId, { teamSize: 3 })
    const team1 = await createTeam(tournament.id, `${PREFIX} T1a`)
    const team2 = await createTeam(tournament.id, `${PREFIX} T2a`)
    const registration = await registerPlayer(tournament.id, playerId)

    // Assign to team1 first
    await patchTeam(
      makeRequest('PATCH', '/', { addPlayerId: registration.id }),
      makeParams({ id: tournament.id, teamId: team1.id })
    )

    // Try to assign to team2
    const req = makeRequest('PATCH', '/', { addPlayerId: registration.id })
    const res = await patchTeam(req, makeParams({ id: tournament.id, teamId: team2.id }))
    expect(res.status).toBe(409)
  })

  it('removes player from team', async () => {
    const tournament = await createTestTournament(organizerId, gameId, { teamSize: 3 })
    const team = await createTeam(tournament.id, `${PREFIX} Remove Test`)
    const registration = await registerPlayer(tournament.id, playerId)

    // Assign first
    await patchTeam(
      makeRequest('PATCH', '/', { addPlayerId: registration.id }),
      makeParams({ id: tournament.id, teamId: team.id })
    )

    // Remove
    const req = makeRequest('PATCH', '/', { removePlayerId: registration.id })
    const res = await patchTeam(req, makeParams({ id: tournament.id, teamId: team.id }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.players).toHaveLength(0)
  })

  it('returns 400 for no valid operation', async () => {
    const tournament = await createTestTournament(organizerId, gameId, { teamSize: 3 })
    const team = await createTeam(tournament.id, `${PREFIX} Noop`)
    const req = makeRequest('PATCH', '/', { unknown: 'field' })
    const res = await patchTeam(req, makeParams({ id: tournament.id, teamId: team.id }))
    expect(res.status).toBe(400)
  })
})

// ─── DELETE /api/tournaments/[id]/teams/[teamId] ─────────────────────────────

describe('DELETE /api/tournaments/[id]/teams/[teamId]', () => {
  it('returns 401 without auth', async () => {
    vi.mocked(auth).mockResolvedValue(noSession)
    const tournament = await createTestTournament(organizerId, gameId, { teamSize: 3 })
    const team = await createTeam(tournament.id, `${PREFIX} Del 401`)
    const req = makeRequest('DELETE', '/')
    const res = await deleteTeam(req, makeParams({ id: tournament.id, teamId: team.id }))
    expect(res.status).toBe(401)
  })

  it('deletes team and unassigns players', async () => {
    const tournament = await createTestTournament(organizerId, gameId, { teamSize: 3 })
    const team = await createTeam(tournament.id, `${PREFIX} Del Team`)
    const registration = await registerPlayer(tournament.id, playerId)

    // Assign player
    await patchTeam(
      makeRequest('PATCH', '/', { addPlayerId: registration.id }),
      makeParams({ id: tournament.id, teamId: team.id })
    )

    // Delete team
    const req = makeRequest('DELETE', '/')
    const res = await deleteTeam(req, makeParams({ id: tournament.id, teamId: team.id }))
    expect(res.status).toBe(200)

    // Verify player is unassigned (teamId = null)
    const { prisma } = await import('@warforge/db')
    const updated = await prisma.tournamentPlayer.findUnique({ where: { id: registration.id } })
    expect(updated?.teamId).toBeNull()
  })

  it('returns 404 for unknown team', async () => {
    const tournament = await createTestTournament(organizerId, gameId, { teamSize: 3 })
    const req = makeRequest('DELETE', '/')
    const res = await deleteTeam(req, makeParams({ id: tournament.id, teamId: 'nonexistent' }))
    expect(res.status).toBe(404)
  })
})
