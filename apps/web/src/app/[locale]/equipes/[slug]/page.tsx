import { prisma } from '@warforge/db'
import { notFound } from 'next/navigation'
import { auth } from '@/auth'
import { Card } from '@/components/ui/card'
import Link from 'next/link'
import { ClubInvitePanel } from '@/components/club-invite-panel'
import { ClubInvitationActions } from '@/components/club-invitation-actions'
import { ClubEditPanel } from '@/components/club-edit-panel'

export default async function ClubDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  const session = await auth()

  let club: any = null
  let me: any = null
  let myInvitation: any = null

  try {
    club = await prisma.club.findUnique({
      where: { slug },
      include: {
        captain: { select: { id: true, name: true } },
        members: {
          include: { user: { select: { id: true, name: true, country: true } } },
          orderBy: { joinedAt: 'asc' },
        },
        invitations: {
          where: { status: 'PENDING' },
          include: { invited: { select: { id: true, name: true } } },
        },
      },
    })

    if (session?.user) {
      me = await prisma.user.findFirst({ where: { email: session.user.email! } })
      if (me) {
        myInvitation = await prisma.clubInvitation.findFirst({
          where: { clubId: club?.id, invitedId: me.id, status: 'PENDING' },
        })
      }
    }
  } catch { /* DB not available */ }

  if (!club) return notFound()

  const isCaptain = me?.id === club.captainId
  const isMember = club.members.some((m: any) => m.userId === me?.id)
  const createdDate = new Date(club.createdAt).toLocaleDateString(
    locale === 'fr' ? 'fr-FR' : 'en-US',
    { month: 'long', year: 'numeric' }
  )

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <Link
        href={`/${locale}/equipes`}
        className="text-sm text-gray-500 hover:text-gray-300 transition-colors mb-8 inline-block"
      >
        ← Toutes les équipes
      </Link>

      {/* Header */}
      <section className="mb-8 flex flex-col items-center text-center">
        {/* Avatar / Logo */}
        {club.logoUrl ? (
          <img
            src={club.logoUrl}
            alt={club.name}
            className="h-24 w-24 rounded-full object-cover border-2 border-orange-600/30 mb-4"
          />
        ) : (
          <div className="h-24 w-24 rounded-full bg-orange-600/20 border-2 border-orange-600/30 flex items-center justify-center text-orange-400 font-bold text-4xl mb-4">
            {club.name[0].toUpperCase()}
          </div>
        )}

        <h1 className="text-3xl font-bold tracking-tighter">{club.name}</h1>
        <p className="text-gray-500 text-sm mt-1">
          Fondée en {createdDate} par{' '}
          <Link href={`/${locale}/joueurs/${club.captainId}`} className="hover:text-orange-400 transition-colors">
            {club.captain.name ?? '—'}
          </Link>
          {' · '}{club.members.length} membre{club.members.length > 1 ? 's' : ''}
        </p>

        {/* Description */}
        <div className="mt-3 max-w-md w-full text-left">
          {club.description ? (
            <p className="text-gray-300 text-sm leading-relaxed break-all">{club.description}</p>
          ) : isCaptain ? (
            <p className="text-gray-600 text-sm italic text-center">Aucune description — ajoutez-en une pour présenter votre équipe.</p>
          ) : (
            <p className="text-gray-600 text-sm italic text-center">Aucune description.</p>
          )}
        </div>

        {/* Lien édition (capitaine) */}
        {isCaptain && (
          <div className="mt-3 w-full max-w-md text-left">
            <ClubEditPanel
              clubId={club.id}
              initialName={club.name}
              initialDescription={club.description}
              initialLogoUrl={club.logoUrl}
            />
          </div>
        )}
      </section>

      {/* Invitation en attente pour moi */}
      {myInvitation && me && !isMember && (
        <div className="mb-6 p-4 rounded-xl border border-orange-600/30 bg-orange-600/5">
          <p className="text-sm font-medium mb-3">
            Tu as été invité à rejoindre <strong>{club.name}</strong>
          </p>
          <ClubInvitationActions
            clubId={club.id}
            invitationId={myInvitation.id}
            locale={locale}
          />
        </div>
      )}

      {/* Membres */}
      <section className="mb-8">
        <h2 className="text-lg font-bold mb-4">
          Membres
          <span className="ml-2 text-sm font-normal text-gray-500">({club.members.length})</span>
        </h2>
        <Card>
          <div className="divide-y divide-gray-800/60">
            {club.members.map((member: any) => (
              <div key={member.id} className="px-4 py-3 flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-gray-800 flex items-center justify-center text-sm font-bold shrink-0">
                  {(member.user.name ?? '?')[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/${locale}/joueurs/${member.userId}`}
                    className="font-medium hover:text-orange-400 transition-colors"
                  >
                    {member.user.name ?? '—'}
                  </Link>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Membre depuis{' '}
                    {new Date(member.joinedAt).toLocaleDateString(
                      locale === 'fr' ? 'fr-FR' : 'en-US',
                      { month: 'short', year: 'numeric' }
                    )}
                  </p>
                </div>
                {member.role === 'CAPTAIN' && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-orange-600/20 text-orange-400 shrink-0">
                    Capitaine
                  </span>
                )}
              </div>
            ))}
          </div>
        </Card>
      </section>

      {/* Panel capitaine : invitations */}
      {isCaptain && (
        <section>
          <h2 className="text-lg font-bold mb-4">Inviter un joueur</h2>
          <ClubInvitePanel clubId={club.id} pendingInvitations={club.invitations} />
        </section>
      )}
    </div>
  )
}
