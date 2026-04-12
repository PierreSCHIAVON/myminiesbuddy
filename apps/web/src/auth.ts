import NextAuth from 'next-auth'
import { prisma } from '@warforge/db'
import { authConfig } from './auth.config'

// Config complète — Node.js uniquement (avec Prisma)
// Utilisée par les Server Components et les Route Handlers
export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  callbacks: {
    // Appelé après chaque login réussi
    async signIn({ profile }) {
      // Skip DB sync for mock/development auth
      if (!profile?.sub) return true

      try {
        if (!profile?.email) return true

        // Synchronise l'utilisateur dans notre BDD au premier login
        await prisma.user.upsert({
          where: { keycloakId: profile.sub },
          create: {
            keycloakId: profile.sub,
            email: profile.email as string,
            name: profile.name as string | undefined,
            image: (profile as Record<string, unknown>).picture as string | undefined,
          },
          update: {
            email: profile.email as string,
            name: profile.name as string | undefined,
            image: (profile as Record<string, unknown>).picture as string | undefined,
          },
        })
      } catch (error) {
        // Database not configured - allow login anyway for development
        console.log('Database sync skipped (development mode)')
      }

      return true
    },

    // Enrichit le JWT avec l'id interne et le rôle depuis notre BDD
    async jwt({ token, profile }) {
      if (profile?.sub) {
        // Keycloak login — lookup by keycloakId
        try {
          const user = await prisma.user.findUnique({
            where: { keycloakId: profile.sub },
            select: { id: true, role: true },
          })
          if (user) {
            token.userId = user.id
            token.role = user.role
          }
        } catch {
          token.userId = profile.sub
          token.role = 'user'
        }
      } else if (!token.userId && token.email) {
        // Credentials login — lookup by email
        try {
          const user = await prisma.user.findFirst({
            where: { email: token.email },
            select: { id: true, role: true },
          })
          if (user) {
            token.userId = user.id
            token.role = user.role
          }
        } catch {
          // DB not available
        }
      }
      return token
    },

    // Reprend le callback session de la config de base
    ...authConfig.callbacks,
  },
})
