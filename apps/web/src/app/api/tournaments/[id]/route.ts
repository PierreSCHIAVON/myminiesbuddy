import { prisma } from '@warforge/db'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        game: true,
        organizer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        players: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        rounds: {
          include: {
            matches: true,
          },
        },
      },
    })

    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(tournament)
  } catch (error) {
    console.error('Error fetching tournament:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tournament' },
      { status: 500 }
    )
  }
}
