import { getTranslations } from 'next-intl/server'
import { prisma } from '@warforge/db'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { auth } from '@/auth'

export default async function ClubsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const session = await auth()

  let clubs: any[] = []
  let myMemberships: string[] = []

  try {
    clubs = await prisma.club.findMany({
      include: {
        captain: { select: { id: true, name: true } },
        _count: { select: { members: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    if (session?.user) {
      const me = await prisma.user.findFirst({ where: { email: session.user.email! } })
      if (me) {
        const memberships = await prisma.clubMember.findMany({
          where: { userId: me.id },
          select: { clubId: true },
        })
        myMemberships = memberships.map((m) => m.clubId)
      }
    }
  } catch { /* DB not available */ }

  return (
    <div className="container mx-auto px-4 py-12">
      <section className="mb-10 flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tighter mb-2">Équipes</h1>
          <p className="text-gray-400">Rejoins une équipe ou crée la tienne.</p>
        </div>
        {session?.user && (
          <Link
            href={`/${locale}/equipes/nouveau`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium transition-colors"
          >
            + Créer une équipe
          </Link>
        )}
      </section>

      {clubs.length === 0 ? (
        <div className="border border-dashed border-gray-700 rounded-xl py-16 text-center">
          <p className="text-gray-400 mb-4">Aucune équipe pour l'instant.</p>
          {session?.user && (
            <Link
              href={`/${locale}/equipes/nouveau`}
              className="text-orange-400 hover:text-orange-300 text-sm underline"
            >
              Sois le premier à en créer une →
            </Link>
          )}
        </div>
      ) : (
        <Card>
          <div className="divide-y divide-gray-800/60">
            {clubs.map((club) => {
              const isMember = myMemberships.includes(club.id)
              return (
                <div key={club.id} className="px-4 py-3 flex items-center gap-4 hover:bg-gray-800/30 transition-colors">
                  {/* Avatar */}
                  <div className="h-10 w-10 rounded-full bg-orange-600/20 border border-orange-600/30 flex items-center justify-center text-orange-400 font-bold text-sm shrink-0">
                    {club.name[0].toUpperCase()}
                  </div>

                  {/* Infos */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/${locale}/equipes/${club.slug}`}
                        className="font-semibold hover:text-orange-400 transition-colors truncate"
                      >
                        {club.name}
                      </Link>
                      {isMember && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-orange-600/20 text-orange-400 shrink-0">
                          Membre
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Cap. {club.captain.name ?? '—'} · {club._count.members} membre{club._count.members > 1 ? 's' : ''}
                    </p>
                  </div>

                  <Link
                    href={`/${locale}/equipes/${club.slug}`}
                    className="text-xs text-gray-500 hover:text-gray-300 transition-colors shrink-0"
                  >
                    Voir →
                  </Link>
                </div>
              )
            })}
          </div>
        </Card>
      )}
    </div>
  )
}
