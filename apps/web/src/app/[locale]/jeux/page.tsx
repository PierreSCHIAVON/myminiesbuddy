import { getTranslations } from 'next-intl/server'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import Image from 'next/image'
import { prisma } from '@warforge/db'

export default async function GamesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ search?: string }>
}) {
  const { locale } = await params
  const { search } = await searchParams
  const t = await getTranslations({ locale, namespace: 'games' })

  let games: {
    id: string
    name: string
    slug: string
    abbreviation: string | null
    logoUrl: string | null
    _count: { tournaments: number; factions: number }
  }[] = []

  try {
    games = await prisma.game.findMany({
      where: search
        ? { name: { contains: search, mode: 'insensitive' } }
        : undefined,
      select: {
        id: true,
        name: true,
        slug: true,
        abbreviation: true,
        logoUrl: true,
        _count: { select: { tournaments: true, factions: true } },
      },
      orderBy: [
        { tournaments: { _count: 'desc' } },
        { name: 'asc' },
      ],
    })
  } catch {
    // DB not available
  }

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Header */}
      <section className="mb-10">
        <h1 className="text-4xl font-bold tracking-tighter mb-2">
          {t('title', { count: games.length })}
        </h1>
        <p className="text-gray-400 text-lg">{t('subtitle')}</p>
      </section>

      {/* Search */}
      <section className="mb-8">
        <form
          key={search ?? ''}
          method="GET"
          className="flex gap-3 max-w-lg"
        >
          <Input
            name="search"
            placeholder={t('searchGames')}
            defaultValue={search ?? ''}
            className="bg-gray-900 border-gray-700"
          />
          <Button type="submit" variant="outline">
            {t('filterApply')}
          </Button>
          {search && (
            <Link
              href={`/${locale}/jeux`}
              className="inline-flex items-center justify-center rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              ✕
            </Link>
          )}
        </form>
      </section>

      {/* Games Grid */}
      <section>
        {games.length === 0 ? (
          <p className="text-gray-400 text-center py-16">{t('noGamesFound')}</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {games.map((game) => (
              <Link key={game.id} href={`/${locale}/jeux/${game.slug}`}>
                <Card className="h-full cursor-pointer hover:border-orange-600/60 transition-all hover:bg-card/80 group">
                  <CardContent className="p-4 flex flex-col items-center text-center gap-3">
                    {/* Logo */}
                    <div className="w-full aspect-square relative rounded-md overflow-hidden bg-gray-800 flex items-center justify-center">
                      {game.logoUrl ? (
                        <Image
                          src={game.logoUrl}
                          alt={game.name}
                          fill
                          className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                          unoptimized
                        />
                      ) : (
                        <span className="text-3xl font-bold text-gray-600 select-none">
                          {game.abbreviation ?? game.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>

                    {/* Name */}
                    <div className="flex-1 w-full">
                      <h3 className="text-sm font-semibold leading-tight line-clamp-2 group-hover:text-orange-500 transition-colors">
                        {game.name}
                      </h3>
                      {game.abbreviation && (
                        <span className="text-xs text-gray-500 mt-0.5 block">
                          [{game.abbreviation}]
                        </span>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="w-full flex justify-between text-xs text-gray-500 border-t border-border pt-2">
                      <span>
                        {game._count.tournaments} {t('tournamentCount')}
                      </span>
                      {game._count.factions > 0 && (
                        <span>{game._count.factions} {t('factionCount')}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
