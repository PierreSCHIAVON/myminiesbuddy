import { prisma } from '@warforge/db'

async function main() {
  console.log('🌱 Seeding database...')

  // Create games
  const games = await prisma.game.createMany({
    data: [
      {
        name: 'Warhammer 40K',
        slug: 'warhammer-40k',
        description: 'The grim darkness of the far future...',
      },
      {
        name: 'Warhammer Age of Sigmar',
        slug: 'warhammer-age-of-sigmar',
        description: 'Realms of boundless magic and infinite wonders',
      },
      {
        name: 'Warhammer: The Old World',
        slug: 'warhammer-old-world',
        description: 'A Fantasy World at War',
      },
      {
        name: 'Bolt Action',
        slug: 'bolt-action',
        description: 'WWII tabletop wargaming',
      },
      {
        name: 'Kings of War',
        slug: 'kings-of-war',
        description: 'Epic fantasy battles',
      },
      {
        name: 'Warmachine',
        slug: 'warmachine',
        description: 'Steam-powered fantasy warfare',
      },
      {
        name: 'Infinity',
        slug: 'infinity',
        description: 'SciFi tactical skirmish game',
      },
      {
        name: 'Blood Bowl',
        slug: 'blood-bowl',
        description: 'Fantasy American football',
      },
      {
        name: 'SAGA',
        slug: 'saga',
        description: 'Dark Age skirmish wargaming',
      },
      {
        name: 'Star Wars: Legion',
        slug: 'star-wars-legion',
        description: 'Ground warfare in a galaxy far far away',
      },
    ],
    skipDuplicates: true,
  })

  console.log(`✅ Created ${games.count} games`)

  // Create test organizer user
  const organizer = await prisma.user.create({
    data: {
      keycloakId: 'test-organizer-001',
      email: 'organizer@example.com',
      name: 'Tournament Master',
      role: 'ORGANIZER',
    },
  }).catch(() => {
    // User might already exist
    return prisma.user.findUnique({
      where: { email: 'organizer@example.com' },
    })
  })

  // Get the Warhammer 40K game
  const w40k = await prisma.game.findUnique({
    where: { slug: 'warhammer-40k' },
  })

  const aos = await prisma.game.findUnique({
    where: { slug: 'warhammer-age-of-sigmar' },
  })

  // Create tournaments
  if (w40k && aos && organizer) {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)

    const nextWeek = new Date()
    nextWeek.setDate(nextWeek.getDate() + 7)

    await prisma.tournament.createMany({
      data: [
        {
          name: "L'Alliance 40K - Avril 2026",
          slug: 'alliance-40k-avril-2026',
          description: 'Tournoi compétitif Warhammer 40K edition 10th. Swiss pairing, 3 rondes.',
          gameId: w40k.id,
          organizerId: organizer.id,
          date: tomorrow,
          location: 'Fressain',
          maxPlayers: 16,
          status: 'OPEN',
          format: 'SWISS',
        },
        {
          name: 'Doublette 40K à Utopolys',
          slug: 'doublette-40k-utopolys',
          description: 'Tournoi en doublettes. Format amusant pour équipes de 2.',
          gameId: w40k.id,
          organizerId: organizer.id,
          date: tomorrow,
          location: 'Mons En Baroeul',
          maxPlayers: 24,
          status: 'OPEN',
          format: 'SWISS',
        },
        {
          name: 'Underground 13',
          slug: 'underground-13',
          description: 'Tournoi Age of Sigmar 4ème edition. Ambiance narrative.',
          gameId: aos.id,
          organizerId: organizer.id,
          date: tomorrow,
          location: 'Domérat',
          maxPlayers: 24,
          status: 'OPEN',
          format: 'SWISS',
        },
        {
          name: 'Clash of Charnay III',
          slug: 'clash-charnay-iii',
          description: 'Fantasy battle tournament. Kings of War 3rd edition.',
          gameId: (await prisma.game.findUnique({
            where: { slug: 'kings-of-war' },
          }))?.id || w40k.id,
          organizerId: organizer.id,
          date: nextWeek,
          location: 'Charnay-Lès-Mâcon',
          maxPlayers: 16,
          status: 'OPEN',
          format: 'SWISS',
        },
      ],
      skipDuplicates: true,
    })

    console.log('✅ Created tournaments')
  }

  console.log('🎉 Seeding completed!')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
