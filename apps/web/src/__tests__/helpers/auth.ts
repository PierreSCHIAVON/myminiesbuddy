import { vi } from 'vitest'
import type { Session } from 'next-auth'

// Call this BEFORE importing route handlers in your test file
// Usage: mockAuth() returns the mock function so you can .mockResolvedValue(session)

export function makeSession(overrides: {
  id?: string
  email?: string
  name?: string
  role?: string
} = {}): Session {
  return {
    user: {
      id: overrides.id ?? 'user-test-organizer',
      email: overrides.email ?? 'organizer@example.com',
      name: overrides.name ?? 'Test Organizer',
      role: overrides.role ?? 'ORGANIZER',
    },
    expires: new Date(Date.now() + 86400_000).toISOString(),
  } as Session
}

export const organizerSession = makeSession()

export const playerSession = makeSession({
  id: 'user-test-player',
  email: 'demo@example.com',
  name: 'Test Player',
  role: 'PLAYER',
})

export const adminSession = makeSession({
  id: 'user-test-admin',
  email: 'admin@example.com',
  name: 'Test Admin',
  role: 'ADMIN',
})

export const noSession = null
