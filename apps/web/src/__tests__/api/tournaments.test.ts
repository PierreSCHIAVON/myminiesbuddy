import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest'
import {
  cleanupTestData,
  createTestTournament,
  getFirstGame,
  getOrganizerUser,
  makeParams,
  makeRequest,
  PREFIX,
} from '../helpers/db'
import { organizerSession, playerSession, noSession } from '../helpers/auth'

vi.mock('@/auth', () => ({ auth: vi.fn() }))
vi.mock('@/lib/notifications', () => ({ createNotifications: vi.fn() }))

import { auth } from '@/auth'
import { GET as listTournaments, POST as createTournament } from '@/app/api/tournaments/route'
import { GET as getTournament, PATCH as patchTournament, DELETE as deleteTournament } from '@/app/api/tournaments/[id]/route'

let organizerId: string
let gameId: string

beforeAll(async () => {
  const [organizer, game] = await Promise.all([getOrganizerUser(), getFirstGame()])
  organizerId = organizer.id
  gameId = game.id
})

afterAll(async () => {
  await cleanupTestData()
})

beforeEach(() => {
  vi.mocked(auth).mockResolvedValue(organizerSession)
})

// ─── GET /api/tournaments ────────────────────────────────────────────────────

describe('GET /api/tournaments', () => {
  it('returns list of OPEN tournaments', async () => {
    const req = makeRequest('GET', '/api/tournaments')
    const res = await listTournaments(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
  })

  it('filters by search query', async () => {
    const name = `${PREFIX} SearchTest`
    await createTestTournament(organizerId, gameId, { name })

    const req = makeRequest('GET', `/api/tournaments?search=${PREFIX}+SearchTest`)
    const res = await listTournaments(req)
    const body = await res.json()
    expect(body.some((t: any) => t.name === name)).toBe(true)
  })
})

// ─── POST /api/tournaments ───────────────────────────────────────────────────

describe('POST /api/tournaments', () => {
  it('returns 401 when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue(noSession)
    const req = makeRequest('POST', '/api/tournaments', {
      name: 'Test', gameId, date: '2026-12-01',
    })
    const res = await createTournament(req)
    expect(res.status).toBe(401)
  })

  it('returns 400 when required fields are missing', async () => {
    const req = makeRequest('POST', '/api/tournaments', { name: 'Test' })
    const res = await createTournament(req)
    expect(res.status).toBe(400)
  })

  it('creates a tournament successfully', async () => {
    const req = makeRequest('POST', '/api/tournaments', {
      name: `${PREFIX} Created`,
      gameId,
      date: '2026-12-01',
      maxPlayers: 8,
      format: 'SWISS',
    })
    const res = await createTournament(req)
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.name).toBe(`${PREFIX} Created`)
    expect(body.status).toBe('OPEN')
  })

  it('creates a team tournament with teamSize', async () => {
    const req = makeRequest('POST', '/api/tournaments', {
      name: `${PREFIX} Team Created`,
      gameId,
      date: '2026-12-01',
      maxPlayers: 12,
      format: 'SWISS',
      teamSize: 3,
    })
    const res = await createTournament(req)
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.teamSize).toBe(3)
  })
})

// ─── GET /api/tournaments/[id] ───────────────────────────────────────────────

describe('GET /api/tournaments/[id]', () => {
  it('returns 404 for unknown tournament', async () => {
    const req = makeRequest('GET', '/api/tournaments/nonexistent')
    const res = await getTournament(req, makeParams({ id: 'nonexistent' }))
    expect(res.status).toBe(404)
  })

  it('returns tournament details', async () => {
    const tournament = await createTestTournament(organizerId, gameId)
    const req = makeRequest('GET', `/api/tournaments/${tournament.id}`)
    const res = await getTournament(req, makeParams({ id: tournament.id }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.id).toBe(tournament.id)
    expect(body.players).toBeDefined()
  })
})

// ─── PATCH /api/tournaments/[id] ────────────────────────────────────────────

describe('PATCH /api/tournaments/[id]', () => {
  it('returns 401 without auth', async () => {
    vi.mocked(auth).mockResolvedValue(noSession)
    const tournament = await createTestTournament(organizerId, gameId)
    const req = makeRequest('PATCH', `/api/tournaments/${tournament.id}`, { name: 'New' })
    const res = await patchTournament(req, makeParams({ id: tournament.id }))
    expect(res.status).toBe(401)
  })

  it('returns 403 for non-organizer', async () => {
    vi.mocked(auth).mockResolvedValue(playerSession)
    const tournament = await createTestTournament(organizerId, gameId)
    const req = makeRequest('PATCH', `/api/tournaments/${tournament.id}`, { status: 'IN_PROGRESS' })
    const res = await patchTournament(req, makeParams({ id: tournament.id }))
    expect(res.status).toBe(403)
  })

  it('transitions status OPEN → IN_PROGRESS', async () => {
    const tournament = await createTestTournament(organizerId, gameId)
    const req = makeRequest('PATCH', `/api/tournaments/${tournament.id}`, { status: 'IN_PROGRESS' })
    const res = await patchTournament(req, makeParams({ id: tournament.id }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.status).toBe('IN_PROGRESS')
  })

  it('transitions status IN_PROGRESS → COMPLETED', async () => {
    const tournament = await createTestTournament(organizerId, gameId, { status: 'IN_PROGRESS' })
    const req = makeRequest('PATCH', `/api/tournaments/${tournament.id}`, { status: 'COMPLETED' })
    const res = await patchTournament(req, makeParams({ id: tournament.id }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.status).toBe('COMPLETED')
  })
})

// ─── DELETE /api/tournaments/[id] ───────────────────────────────────────────

describe('DELETE /api/tournaments/[id]', () => {
  it('returns 401 without auth', async () => {
    vi.mocked(auth).mockResolvedValue(noSession)
    const tournament = await createTestTournament(organizerId, gameId)
    const req = makeRequest('DELETE', `/api/tournaments/${tournament.id}`)
    const res = await deleteTournament(req, makeParams({ id: tournament.id }))
    expect(res.status).toBe(401)
  })

  it('returns 403 for non-organizer', async () => {
    vi.mocked(auth).mockResolvedValue(playerSession)
    const tournament = await createTestTournament(organizerId, gameId)
    const req = makeRequest('DELETE', `/api/tournaments/${tournament.id}`)
    const res = await deleteTournament(req, makeParams({ id: tournament.id }))
    expect(res.status).toBe(403)
  })

  it('deletes tournament successfully', async () => {
    const tournament = await createTestTournament(organizerId, gameId)
    const req = makeRequest('DELETE', `/api/tournaments/${tournament.id}`)
    const res = await deleteTournament(req, makeParams({ id: tournament.id }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
  })
})
