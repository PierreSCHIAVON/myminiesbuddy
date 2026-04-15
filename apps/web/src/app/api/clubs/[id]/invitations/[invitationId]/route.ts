import { prisma } from '@warforge/db'
import { NextResponse } from 'next/server'
import { auth } from '@/auth'

// PATCH /api/clubs/[id]/invitations/[invitationId] — accepter ou refuser
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; invitationId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { invitationId } = await params
    const { action } = await request.json() // 'accept' | 'decline'

    const me = await prisma.user.findFirst({ where: { email: session.user.email! } })
    if (!me) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const invitation = await prisma.clubInvitation.findUnique({
      where: { id: invitationId },
    })
    if (!invitation) return NextResponse.json({ error: 'Invitation introuvable' }, { status: 404 })
    if (invitation.invitedId !== me.id) {
      return NextResponse.json({ error: 'Cette invitation ne te concerne pas' }, { status: 403 })
    }
    if (invitation.status !== 'PENDING') {
      return NextResponse.json({ error: 'Invitation déjà traitée' }, { status: 400 })
    }

    if (action === 'accept') {
      await prisma.$transaction([
        prisma.clubInvitation.update({
          where: { id: invitationId },
          data: { status: 'ACCEPTED' },
        }),
        prisma.clubMember.upsert({
          where: { clubId_userId: { clubId: invitation.clubId, userId: me.id } },
          update: {},
          create: { clubId: invitation.clubId, userId: me.id, role: 'MEMBER' },
        }),
      ])
    } else {
      await prisma.clubInvitation.update({
        where: { id: invitationId },
        data: { status: 'DECLINED' },
      })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Failed to process invitation' }, { status: 500 })
  }
}
