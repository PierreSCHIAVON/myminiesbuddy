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

export async function Navbar({ locale }: { locale: 'fr' | 'en' }) {
  const session = await auth()
  const t = await getTranslations({ locale, namespace: 'nav' })

  return (
    <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href={`/${locale}`} className="flex items-center gap-2">
            <span className="text-xl font-bold text-orange-600 tracking-tight">
              ⚔ WarForge
            </span>
          </Link>

          {/* Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link href={`/${locale}/tournois`} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {t('tournaments')}
            </Link>
            <Link href={`/${locale}/jeux`} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {t('games')}
            </Link>
            <Link href={`/${locale}/rankings`} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {t('rankings')}
            </Link>
          </div>

          {/* Auth */}
          <div className="flex items-center gap-3">
            {session?.user && <NotificationBell locale={locale} />}
            {session?.user ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="relative h-9 w-9 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-600">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={session.user.image ?? ''} alt={session.user.name ?? ''} />
                    <AvatarFallback className="bg-orange-600 text-white text-sm font-semibold">
                      {session.user.name?.[0]?.toUpperCase() ?? 'U'}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{session.user.name}</p>
                    <p className="text-xs text-muted-foreground">{session.user.email}</p>
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
              <form action={async () => { 'use server'; await signIn(undefined, { redirectTo: `/${locale}` }) }}>
                <Button type="submit" size="sm" className="bg-orange-600 hover:bg-orange-700">
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


