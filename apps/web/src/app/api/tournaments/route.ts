import { prisma } from '@warforge/db'
import { NextResponse } from 'next/server'
import { auth } from '@/auth'

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

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, gameId, date, location, maxPlayers, format, pointsLimit, teamSize } = body

    if (!name || !gameId || !date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Find organizer by email (works for both demo and Keycloak users)
    const organizer = await prisma.user.findFirst({
      where: { email: session.user.email! },
    })
    if (!organizer) {
      return NextResponse.json(
        { error: 'Organizer not found — please ensure your account is synced' },
        { status: 404 }
      )
    }

    // Generate unique slug from name
    const base = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
    const slug = `${base}-${Date.now()}`

    const tournament = await prisma.tournament.create({
      data: {
        name,
        description: description || null,
        slug,
        date: new Date(date),
        location: location || null,
        maxPlayers: parseInt(maxPlayers) || 16,
        format: format || 'SWISS',
        pointsLimit: pointsLimit ? parseInt(pointsLimit) : null,
        teamSize: teamSize ? parseInt(teamSize) : null,
        status: 'OPEN',
        gameId,
        organizerId: organizer.id,
      },
      include: { game: true },
    })

    return NextResponse.json(tournament, { status: 201 })
  } catch (error) {
    console.error('Error creating tournament:', error)
    return NextResponse.json({ error: 'Failed to create tournament' }, { status: 500 })
  }
}
