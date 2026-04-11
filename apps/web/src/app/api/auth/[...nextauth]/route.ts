import { handlers } from '@/auth'

// Auth.js gère GET (redirect vers Keycloak) et POST (callback avec le code)
export const { GET, POST } = handlers
