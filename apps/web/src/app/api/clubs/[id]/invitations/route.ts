import { prisma } from '@warforge/db'
import { NextResponse } from 'next/server'
import { auth } from '@/auth'

// POST /api/clubs/[id]/invitations — inviter un joueur (par nom)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id: clubId } = await params
    const { username } = await request.json()

    if (!username) return NextResponse.json({ error: 'Nom requis' }, { status: 400 })

    const me = await prisma.user.findFirst({ where: { email: session.user.email! } })
    if (!me) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // Vérifier que je suis capitaine
    const club = await prisma.club.findUnique({ where: { id: clubId } })
    if (!club) return NextResponse.json({ error: 'Club introuvable' }, { status: 404 })
    if (club.captainId !== me.id) {
      return NextResponse.json({ error: 'Seul le capitaine peut inviter' }, { status: 403 })
    }

    // Trouver l'utilisateur cible par nom
    const target = await prisma.user.findFirst({
      where: { name: { equals: username, mode: 'insensitive' } },
    })
    if (!target) return NextResponse.json({ error: 'Joueur introuvable' }, { status: 404 })
    if (target.id === me.id) {
      return NextResponse.json({ error: 'Tu ne peux pas t\'inviter toi-même' }, { status: 400 })
    }

    // Vérifier déjà membre
    const alreadyMember = await prisma.clubMember.findUnique({
      where: { clubId_userId: { clubId, userId: target.id } },
    })
    if (alreadyMember) {
      return NextResponse.json({ error: 'Ce joueur est déjà membre' }, { status: 400 })
    }

    // Créer ou récupérer l'invitation (upsert sur le unique)
    const invitation = await prisma.clubInvitation.upsert({
      where: { clubId_invitedId: { clubId, invitedId: target.id } },
      update: { status: 'PENDING', invitedById: me.id },
      create: {
        clubId,
        invitedById: me.id,
        invitedId: target.id,
        status: 'PENDING',
      },
    })

    // Notification in-app
    await prisma.notification.create({
      data: {
        userId: target.id,
        type: 'CLUB_INVITATION',
        title: `Invitation : ${club.name}`,
        body: `${me.name ?? 'Quelqu\'un'} t'invite à rejoindre l'équipe ${club.name}`,
        link: `/equipes/${club.slug}`,
      },
    })

    return NextResponse.json(invitation, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to send invitation' }, { status: 500 })
  }
}
