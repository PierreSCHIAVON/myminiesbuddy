import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { auth, signIn, signOut } from '@/auth'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { NotificationBell } from '@/components/notification-bell'
import { NavLink } from '@/components/nav-link'

export async function Navbar({ locale }: { locale: 'fr' | 'en' }) {
  const session = await auth()
  const t = await getTranslations({ locale, namespace: 'nav' })

  return (
    <nav className="border-b border-border/60 bg-background/95 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href={`/${locale}`} className="flex items-center gap-2 shrink-0">
            <span className="text-base font-bold tracking-tight">
              <span className="text-orange-500">⚔</span>
              <span className="ml-1.5 text-foreground">WarForge</span>
            </span>
          </Link>

          {/* Navigation */}
          <div className="hidden md:flex items-center gap-7">
            <NavLink href={`/${locale}/tournois`}>{t('tournaments')}</NavLink>
            <NavLink href={`/${locale}/jeux`}>{t('games')}</NavLink>
            <NavLink href={`/${locale}/rankings`}>{t('rankings')}</NavLink>
            <NavLink href={`/${locale}/equipes`}>{t('teams')}</NavLink>
          </div>

          {/* Auth */}
          <div className="flex items-center gap-3">
            {session?.user && <NotificationBell locale={locale} />}
            {session?.user ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="relative h-8 w-8 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={session.user.image ?? ''} alt={session.user.name ?? ''} />
                    <AvatarFallback className="bg-orange-600 text-white text-xs font-semibold">
                      {session.user.name?.[0]?.toUpperCase() ?? 'U'}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{session.user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{session.user.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem render={<Link href={`/${locale}/dashboard`} />}>
                    {t('dashboard')}
                  </DropdownMenuItem>
                  <DropdownMenuItem render={<Link href={`/${locale}/profil`} />}>
                    {t('profile')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive">
                    <form action={async () => { 'use server'; await signOut({ redirectTo: `/${locale}` }) }} className="w-full">
                      <button type="submit" className="w-full text-left">
                        {t('signOut')}
                      </button>
                    </form>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <form action={async () => {
                'use server'
                const provider = process.env.KEYCLOAK_ISSUER ? 'keycloak' : undefined
                await signIn(provider, { redirectTo: `/${locale}` })
              }}>
                <Button type="submit" size="sm" className="bg-orange-600 hover:bg-orange-700 h-8 text-xs font-medium">
                  {t('signIn')}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
