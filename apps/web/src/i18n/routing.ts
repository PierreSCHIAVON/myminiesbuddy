import { defineRouting } from 'next-intl/routing'
import { locales, defaultLocale } from './config'

export const routing = defineRouting({
  locales,
  defaultLocale,
  // /fr/... → affiche le préfixe FR aussi
  // /en/... → affiche le préfixe EN
  localePrefix: 'as-needed', // FR n'a pas de préfixe (URL propre), EN aura /en/
})
