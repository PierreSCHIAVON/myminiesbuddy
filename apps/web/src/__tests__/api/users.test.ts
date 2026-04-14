import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest'
import { prisma } from '@warforge/db'
import {
  cleanupTestData,
  createTestTournament,
  getFirstGame,
  getOrganizerUser,
  getPlayerUser,
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
import { PATCH as updateMe } from '@/app/api/users/me/route'
import { GET as searchUsers } from '@/app/api/users/search/route'
import { GET as getNotifications, PATCH as markRead } from '@/app/api/notifications/route'

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
  // Use real organizer ID so user.update() finds the record in the DB
  vi.mocked(auth).mockResolvedValue({
    ...organizerSession,
    user: { ...organizerSession.user, id: organizerId },
  } as any)
})

// ─── PATCH /api/users/me ─────────────────────────────────────────────────────

describe('PATCH /api/users/me', () => {
  it('returns 401 without auth', async () => {
    vi.mocked(auth).mockResolvedValue(noSession)
    const req = makeRequest('PATCH', '/api/users/me', { name: 'New Name' })
    const res = await updateMe(req)
    expect(res.status).toBe(401)
  })

  it('returns 400 for name shorter than 2 chars', async () => {
    const req = makeRequest('PATCH', '/api/users/me', { name: 'A' })
    const res = await updateMe(req)
    expect(res.status).toBe(400)
  })

  it('updates user name', async () => {
    const req = makeRequest('PATCH', '/api/users/me', { name: 'Updated Name' })
    const res = await updateMe(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.name).toBe('Updated Name')
    // Restore original name
    await prisma.user.update({
      where: { id: organizerId },
      data: { name: 'Tournament Organizer' },
    })
  })
})

// ─── GET /api/users/search ───────────────────────────────────────────────────

describe('GET /api/users/search', () => {
  it('returns 401 without auth', async () => {
    vi.mocked(auth).mockResolvedValue(noSession)
    const req = makeRequest('GET', '/api/users/search?q=test')
    const res = await searchUsers(req)
    expect(res.status).toBe(401)
  })

  it('returns 403 for PLAYER role', async () => {
    vi.mocked(auth).mockResolvedValue(playerSession)
    const req = makeRequest('GET', '/api/users/search?q=test')
    const res = await searchUsers(req)
    expect(res.status).toBe(403)
  })

  it('returns empty array for short query', async () => {
    const req = makeRequest('GET', '/api/users/search?q=a')
    const res = await searchUsers(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual([])
  })

  it('returns matching users', async () => {
    const req = makeRequest('GET', '/api/users/search?q=organizer')
    const res = await searchUsers(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.length).toBeGreaterThan(0)
    expect(body[0]).toHaveProperty('id')
    expect(body[0]).toHaveProperty('email')
  })

  it('excludes already registered players when tournamentId is provided', async () => {
    const tournament = await createTestTournament(organizerId, gameId)
    await registerPlayer(tournament.id, playerId)

    // Search for demo user (who is now registered)
    const req = makeRequest(
      'GET',
      `/api/users/search?q=demo&tournamentId=${tournament.id}`
    )
    const res = await searchUsers(req)
    const body = await res.json()
    const found = body.find((u: any) => u.id === playerId)
    expect(found).toBeUndefined()
  })
})

// ─── GET /api/notifications ──────────────────────────────────────────────────

describe('GET /api/notifications', () => {
  it('returns 401 without auth', async () => {
    vi.mocked(auth).mockResolvedValue(noSession)
    const req = makeRequest('GET', '/api/notifications')
    const res = await getNotifications(req)
    expect(res.status).toBe(401)
  })

  it('returns notification list for authenticated user', async () => {
    const req = makeRequest('GET', '/api/notifications')
    const res = await getNotifications(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
  })
})

// ─── PATCH /api/notifications ────────────────────────────────────────────────

describe('PATCH /api/notifications', () => {
  it('returns 401 without auth', async () => {
    vi.mocked(auth).mockResolvedValue(noSession)
    const req = makeRequest('PATCH', '/api/notifications', {})
    const res = await markRead(req)
    expect(res.status).toBe(401)
  })

  it('marks all notifications as read', async () => {
    // Create a notification for organizer first
    const organizer = await getOrganizerUser()
    await prisma.notification.create({
      data: {
        userId: organizer.id,
        type: 'NEW_REGISTRATION',
        title: `${PREFIX} Test notif`,
        body: 'Test',
        link: '/test',
        read: false,
      },
    })

    const req = makeRequest('PATCH', '/api/notifications', {})
    const res = await markRead(req)
    expect(res.status).toBe(200)

    // Verify read
    const unread = await prisma.notification.count({
      where: { userId: organizer.id, read: false, title: { contains: PREFIX } },
    })
    expect(unread).toBe(0)
  })
})
