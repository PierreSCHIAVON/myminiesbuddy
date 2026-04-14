import { prisma } from '@warforge/db'
import { NextResponse } from 'next/server'
import { auth } from '@/auth'

// GET /api/users/search?q=xxx&tournamentId=xxx
// Retourne les utilisateurs correspondant à la recherche.
// tournamentId optionnel : exclut les joueurs déjà inscrits.
export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Seuls les organisateurs et admins peuvent chercher des joueurs
    const role = session.user.role as string
    if (role !== 'ORGANIZER' && role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')?.trim() ?? ''
    const tournamentId = searchParams.get('tournamentId') ?? undefined

    if (q.length < 2) {
      return NextResponse.json([])
    }

    // IDs déjà inscrits à exclure
    let excludedUserIds: string[] = []
    if (tournamentId) {
      const registered = await prisma.tournamentPlayer.findMany({
        where: { tournamentId },
        select: { userId: true },
      })
      excludedUserIds = registered.map((r) => r.userId)
    }

    const users = await prisma.user.findMany({
      where: {
        AND: [
          { id: { notIn: excludedUserIds } },
          {
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { email: { contains: q, mode: 'insensitive' } },
            ],
          },
        ],
      },
      select: { id: true, name: true, email: true },
      take: 8,
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error('Error searching users:', error)
    return NextResponse.json({ error: 'Failed to search users' }, { status: 500 })
  }
}
