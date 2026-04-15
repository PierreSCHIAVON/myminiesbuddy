'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname()
  // Actif si le pathname commence par le href (ex: /fr/tournois/... → actif pour /fr/tournois)
  const isActive = pathname === href || pathname.startsWith(href + '/')

  return (
    <Link
      href={href}
      className={`relative text-sm py-1 transition-colors ${
        isActive
          ? 'text-foreground font-medium'
          : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      {children}
      {isActive && (
        <span className="absolute -bottom-[1px] left-0 right-0 h-px bg-orange-500" />
      )}
    </Link>
  )
}
