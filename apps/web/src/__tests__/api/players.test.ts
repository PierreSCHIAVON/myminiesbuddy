import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest'
import {
  cleanupTestData,
  createTestTournament,
  getFirstGame,
  getOrganizerUser,
  getPlayerUser,
  makeParams,
  makeRequest,
  PREFIX,
  registerPlayer,
} from '../helpers/db'
import { organizerSession, playerSession, noSession, makeSession } from '../helpers/auth'

vi.mock('@/auth', () => ({ auth: vi.fn() }))
vi.mock('@/lib/notifications', () => ({
  createNotification: vi.fn(),
  createNotifications: vi.fn(),
}))

import { auth } from '@/auth'
import { POST as addPlayer } from '@/app/api/tournaments/[id]/players/route'
import {
  POST as registerSelf,
  PATCH as updateRegistration,
  DELETE as unregister,
} from '@/app/api/tournaments/[id]/register/route'

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

// ─── POST /api/tournaments/[id]/players (organisateur ajoute un joueur) ──────

describe('POST /api/tournaments/[id]/players', () => {
  it('returns 401 without auth', async () => {
    vi.mocked(auth).mockResolvedValue(noSession)
    const tournament = await createTestTournament(organizerId, gameId)
    const req = makeRequest('POST', `/api/tournaments/${tournament.id}/players`, { userId: playerId })
    const res = await addPlayer(req, makeParams({ id: tournament.id }))
    expect(res.status).toBe(401)
  })

  it('returns 403 for non-organizer', async () => {
    vi.mocked(auth).mockResolvedValue(playerSession)
    const tournament = await createTestTournament(organizerId, gameId)
    const req = makeRequest('POST', `/api/tournaments/${tournament.id}/players`, { userId: playerId })
    const res = await addPlayer(req, makeParams({ id: tournament.id }))
    expect(res.status).toBe(403)
  })

  it('returns 400 when tournament is not OPEN', async () => {
    const tournament = await createTestTournament(organizerId, gameId, { status: 'IN_PROGRESS' })
    const req = makeRequest('POST', `/api/tournaments/${tournament.id}/players`, { userId: playerId })
    const res = await addPlayer(req, makeParams({ id: tournament.id }))
    expect(res.status).toBe(400)
  })

  it('adds player successfully', async () => {
    const tournament = await createTestTournament(organizerId, gameId)
    const req = makeRequest('POST', `/api/tournaments/${tournament.id}/players`, { userId: playerId })
    const res = await addPlayer(req, makeParams({ id: tournament.id }))
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.userId).toBe(playerId)
    expect(body.tournamentId).toBe(tournament.id)
  })

  it('returns 409 when player already registered', async () => {
    const tournament = await createTestTournament(organizerId, gameId)
    await registerPlayer(tournament.id, playerId)
    const req = makeRequest('POST', `/api/tournaments/${tournament.id}/players`, { userId: playerId })
    const res = await addPlayer(req, makeParams({ id: tournament.id }))
    expect(res.status).toBe(409)
  })

  it('returns 400 when tournament is full', async () => {
    const tournament = await createTestTournament(organizerId, gameId, { maxPlayers: 1 })
    await registerPlayer(tournament.id, organizerId)
    const req = makeRequest('POST', `/api/tournaments/${tournament.id}/players`, { userId: playerId })
    const res = await addPlayer(req, makeParams({ id: tournament.id }))
    expect(res.status).toBe(400)
  })
})

// ─── POST /api/tournaments/[id]/register (auto-inscription joueur) ───────────

describe('POST /api/tournaments/[id]/register', () => {
  it('returns 401 without auth', async () => {
    vi.mocked(auth).mockResolvedValue(noSession)
    const tournament = await createTestTournament(organizerId, gameId)
    const req = makeRequest('POST', `/api/tournaments/${tournament.id}/register`, {})
    const res = await registerSelf(req, makeParams({ id: tournament.id }))
    expect(res.status).toBe(401)
  })

  it('registers player successfully', async () => {
    vi.mocked(auth).mockResolvedValue(playerSession)
    const tournament = await createTestTournament(organizerId, gameId)
    const req = makeRequest('POST', `/api/tournaments/${tournament.id}/register`, {})
    const res = await registerSelf(req, makeParams({ id: tournament.id }))
    expect(res.status).toBe(201)
  })

  it('returns 400 when tournament is not OPEN', async () => {
    vi.mocked(auth).mockResolvedValue(playerSession)
    const tournament = await createTestTournament(organizerId, gameId, { status: 'IN_PROGRESS' })
    const req = makeRequest('POST', `/api/tournaments/${tournament.id}/register`, {})
    const res = await registerSelf(req, makeParams({ id: tournament.id }))
    expect(res.status).toBe(400)
  })

  it('returns 409 on duplicate registration', async () => {
    vi.mocked(auth).mockResolvedValue(playerSession)
    const tournament = await createTestTournament(organizerId, gameId)
    await registerPlayer(tournament.id, playerId)
    const req = makeRequest('POST', `/api/tournaments/${tournament.id}/register`, {})
    const res = await registerSelf(req, makeParams({ id: tournament.id }))
    expect(res.status).toBe(409)
  })
})

// ─── PATCH /api/tournaments/[id]/register (update liste) ────────────────────

describe('PATCH /api/tournaments/[id]/register', () => {
  it('returns 401 without auth', async () => {
    vi.mocked(auth).mockResolvedValue(noSession)
    const tournament = await createTestTournament(organizerId, gameId)
    const req = makeRequest('PATCH', `/api/tournaments/${tournament.id}/register`, { listNotes: 'Ma liste' })
    const res = await updateRegistration(req, makeParams({ id: tournament.id }))
    expect(res.status).toBe(401)
  })

  it('updates army list for registered player', async () => {
    vi.mocked(auth).mockResolvedValue(playerSession)
    const tournament = await createTestTournament(organizerId, gameId)
    await registerPlayer(tournament.id, playerId)
    const req = makeRequest('PATCH', `/api/tournaments/${tournament.id}/register`, { listNotes: 'Ma super liste' })
    const res = await updateRegistration(req, makeParams({ id: tournament.id }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.listNotes).toBe('Ma super liste')
  })

  it('returns 404 for non-registered player', async () => {
    vi.mocked(auth).mockResolvedValue(playerSession)
    const tournament = await createTestTournament(organizerId, gameId)
    const req = makeRequest('PATCH', `/api/tournaments/${tournament.id}/register`, { listNotes: 'Test' })
    const res = await updateRegistration(req, makeParams({ id: tournament.id }))
    expect(res.status).toBe(404)
  })
})

// ─── DELETE /api/tournaments/[id]/register (désinscription) ─────────────────

describe('DELETE /api/tournaments/[id]/register', () => {
  it('unregisters player successfully', async () => {
    vi.mocked(auth).mockResolvedValue(playerSession)
    const tournament = await createTestTournament(organizerId, gameId)
    await registerPlayer(tournament.id, playerId)
    const req = makeRequest('DELETE', `/api/tournaments/${tournament.id}/register`)
    const res = await unregister(req, makeParams({ id: tournament.id }))
    expect(res.status).toBe(200)
  })

  it('returns 404 when not registered', async () => {
    vi.mocked(auth).mockResolvedValue(playerSession)
    const tournament = await createTestTournament(organizerId, gameId)
    const req = makeRequest('DELETE', `/api/tournaments/${tournament.id}/register`)
    const res = await unregister(req, makeParams({ id: tournament.id }))
    expect(res.status).toBe(404)
  })
})
