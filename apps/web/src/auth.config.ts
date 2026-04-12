import type { NextAuthConfig } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Keycloak from 'next-auth/providers/keycloak'

// Config légère — Edge-compatible (pas de Prisma, pas de Node.js APIs)
// Utilisée par le middleware qui tourne dans l'Edge Runtime
export const authConfig: NextAuthConfig = {
  providers: [
    // Mock auth for development/testing
    process.env.NODE_ENV === 'development' ? Credentials({
      name: 'Demo Account',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'demo@example.com' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        const devAccounts: Record<string, { id: string; name: string; email: string; image: string }> = {
          'demo@example.com': {
            id: 'demo-001',
            name: 'Demo User',
            email: 'demo@example.com',
            image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo',
          },
          'organizer@example.com': {
            id: 'test-organizer-001',
            name: 'Tournament Master',
            email: 'organizer@example.com',
            image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=organizer',
          },
        }
        const email = credentials?.email as string
        const password = credentials?.password as string
        if (password === 'demo123' && devAccounts[email]) {
          return devAccounts[email]
        }
        return null
      }
    }) : undefined,
    // Keycloak (when properly configured in production)
    process.env.KEYCLOAK_ISSUER ? Keycloak({
      clientId: process.env.KEYCLOAK_CLIENT_ID!,
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET!,
      issuer: process.env.KEYCLOAK_ISSUER!,
    }) : undefined,
  ].filter(Boolean) as any,

  session: { strategy: 'jwt' },

  callbacks: {
    // Expose id et rôle dans la session (sans accès BDD)
    async session({ session, token }) {
      session.user.id = token.userId as string
      session.user.role = token.role as string
      return session
    },
  },
}

