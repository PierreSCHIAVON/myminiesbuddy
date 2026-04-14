import { prisma } from '@warforge/db'
import { randomUUID } from 'crypto'

// Unique prefix per test run — prevents collisions between parallel runs
export const RUN_ID = randomUUID().slice(0, 8)
export const PREFIX = `[T-${RUN_ID}]`

// ─── Lookup real users (demo accounts seeded in DB) ────────────────────────

export async function getOrganizerUser() {
  const user = await prisma.user.findFirst({ where: { email: 'organizer@example.com' } })
  if (!user) throw new Error('organizer@example.com not found in DB — run seed first')
  return user
}

export async function getPlayerUser() {
  const user = await prisma.user.findFirst({ where: { email: 'demo@example.com' } })
  if (!user) throw new Error('demo@example.com not found in DB — run seed first')
  return user
}

export async function getFirstGame() {
  const game = await prisma.game.findFirst({ orderBy: { name: 'asc' } })
  if (!game) throw new Error('No games found in DB — run seed first')
  return game
}

// ─── Factory helpers ────────────────────────────────────────────────────────

export async function createTestTournament(
  organizerId: string,
  gameId: string,
  overrides: Partial<{
    name: string
    status: string
    maxPlayers: number
    teamSize: number | null
  }> = {}
) {
  const name = overrides.name ?? `${PREFIX} Tournoi Test`
  const slug = `test-${RUN_ID}-${Date.now()}`
  return prisma.tournament.create({
    data: {
      name,
      slug,
      date: new Date('2026-12-01'),
      maxPlayers: overrides.maxPlayers ?? 8,
      format: 'SWISS',
      status: (overrides.status as any) ?? 'OPEN',
      teamSize: overrides.teamSize ?? null,
      gameId,
      organizerId,
    },
  })
}

export async function registerPlayer(tournamentId: string, userId: string) {
  return prisma.tournamentPlayer.create({
    data: { tournamentId, userId },
  })
}

export async function createTeam(tournamentId: string, name: string) {
  return prisma.team.create({ data: { tournamentId, name } })
}

export async function assignPlayerToTeam(playerId: string, teamId: string) {
  return prisma.tournamentPlayer.update({
    where: { id: playerId },
    data: { teamId },
  })
}

// ─── Cleanup ────────────────────────────────────────────────────────────────

export async function cleanupTestData() {
  // Find all tournaments created by this test run
  const tournaments = await prisma.tournament.findMany({
    where: { name: { contains: PREFIX } },
    select: { id: true },
  })
  const ids = tournaments.map((t) => t.id)
  if (ids.length === 0) return

  // Delete in dependency order
  await prisma.match.deleteMany({ where: { roundId: { in: (await prisma.round.findMany({ where: { tournamentId: { in: ids } }, select: { id: true } })).map(r => r.id) } } })
  await prisma.teamMatch.deleteMany({ where: { roundId: { in: (await prisma.round.findMany({ where: { tournamentId: { in: ids } }, select: { id: true } })).map(r => r.id) } } })
  await prisma.round.deleteMany({ where: { tournamentId: { in: ids } } })
  await prisma.tournamentPlayer.deleteMany({ where: { tournamentId: { in: ids } } })
  await prisma.team.deleteMany({ where: { tournamentId: { in: ids } } })
  await prisma.notification.deleteMany({ where: { link: { contains: `/${ids[0]}` } } }).catch(() => {})
  await prisma.tournament.deleteMany({ where: { id: { in: ids } } })
}

// ─── Request helpers ─────────────────────────────────────────────────────────

export function makeRequest(
  method: string,
  url: string,
  body?: unknown
): Request {
  return new Request(`http://localhost${url}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  })
}

export function makeParams<T extends object>(params: T): { params: Promise<T> } {
  return { params: Promise.resolve(params) }
}
