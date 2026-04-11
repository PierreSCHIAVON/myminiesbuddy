import type { DefaultSession } from 'next-auth'

// Étend les types Auth.js pour ajouter nos champs custom
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: string
    } & DefaultSession['user']
  }
}
