import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { cleanupTestData, createTestTournament, getFirstGame, getOrganizerUser, makeRequest } from '../helpers/db'

vi.mock('@/auth', () => ({ auth: vi.fn() }))
vi.mock('@/lib/notifications', () => ({ createNotifications: vi.fn() }))

import { GET as getGames } from '@/app/api/games/route'

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

// ─── GET /api/games ───────────────────────────────────────────────────────────

describe('GET /api/games', () => {
  it('returns 200 without authentication (public route)', async () => {
    const req = makeRequest('GET', '/api/games')
    const res = await getGames(req)
    expect(res.status).toBe(200)
  })

  it('returns an array of games', async () => {
    const req = makeRequest('GET', '/api/games')
    const res = await getGames(req)
    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
    expect(body.length).toBeGreaterThan(0)
  })

  it('each game has the expected shape', async () => {
    const req = makeRequest('GET', '/api/games')
    const res = await getGames(req)
    const body = await res.json()
    const game = body[0]
    expect(game).toHaveProperty('id')
    expect(game).toHaveProperty('name')
    expect(game).toHaveProperty('slug')
    expect(game).toHaveProperty('tournamentCount')
    expect(typeof game.tournamentCount).toBe('number')
  })

  it('games are sorted alphabetically by name (binary order, matching Postgres collation)', async () => {
    const req = makeRequest('GET', '/api/games')
    const res = await getGames(req)
    const body = await res.json()
    const names: string[] = body.map((g: any) => g.name)
    // Binary comparison matches PostgreSQL's default ORDER BY ASC behaviour
    const sorted = [...names].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
    expect(names).toEqual(sorted)
  })

  it('tournamentCount increases when a tournament is created for that game', async () => {
    const req1 = makeRequest('GET', '/api/games')
    const before = await (await getGames(req1)).json()
    const countBefore = before.find((g: any) => g.id === gameId)?.tournamentCount ?? 0

    await createTestTournament(organizerId, gameId)

    const req2 = makeRequest('GET', '/api/games')
    const after = await (await getGames(req2)).json()
    const countAfter = after.find((g: any) => g.id === gameId)?.tournamentCount ?? 0

    expect(countAfter).toBe(countBefore + 1)
  })
})
