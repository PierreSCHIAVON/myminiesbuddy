import { prisma } from '@warforge/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const gameSlug = searchParams.get('game')
    const search = searchParams.get('search')

    let where: any = {
      status: 'OPEN',
    }

    if (gameSlug) {
      where.game = {
        slug: gameSlug,
      }
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ]
    }

    const tournaments = await prisma.tournament.findMany({
      where,
      include: {
        game: true,
        _count: {
          select: { players: true },
        },
      },
      orderBy: {
        date: 'asc',
      },
    })

    // Transform to match frontend expectations
    const formatted = tournaments.map((t: any) => ({
      id: t.id,
      name: t.name,
      game: t.game.name,
      location: t.location,
      date: t.date.toISOString(),
      currentPlayers: t._count.players,
      maxPlayers: t.maxPlayers,
      description: t.description,
    }))

    return NextResponse.json(formatted)
  } catch (error) {
    console.error('Error fetching tournaments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tournaments' },
      { status: 500 }
    )
  }
}
