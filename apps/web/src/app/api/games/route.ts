import { prisma } from '@warforge/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const games = await prisma.game.findMany({
      include: {
        _count: {
          select: { tournaments: true },
        },
      },
      orderBy: {
        name: 'asc',
      },
    })

    const formatted = games.map((g: any) => ({
      id: g.id,
      name: g.name,
      slug: g.slug,
      description: g.description,
      tournamentCount: g._count.tournaments,
    }))

    return NextResponse.json(formatted)
  } catch (error) {
    console.error('Error fetching games:', error)
    return NextResponse.json(
      { error: 'Failed to fetch games' },
      { status: 500 }
    )
  }
}
