import { vi } from 'vitest'

// next/server, next/headers, next/navigation are aliased to mock files in vitest.config.ts
// — no vi.mock() needed for those.

// ── Mock next-auth so it never tries to import next/server internally ────────
vi.mock('next-auth', () => ({
  default: vi.fn(() => ({
    handlers: { GET: vi.fn(), POST: vi.fn() },
    auth: vi.fn().mockResolvedValue(null),
    signIn: vi.fn(),
    signOut: vi.fn(),
  })),
}))

vi.mock('next-auth/providers/credentials', () => ({ default: vi.fn() }))
vi.mock('next-auth/providers/keycloak', () => ({ default: vi.fn() }))
