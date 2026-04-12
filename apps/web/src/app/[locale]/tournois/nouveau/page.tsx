import { getTranslations } from 'next-intl/server'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { CreateTournamentForm } from '@/components/create-tournament-form'
import { prisma } from '@warforge/db'

export default async function NewTournamentPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const session = await auth()

  if (!session?.user) {
    redirect(`/${locale}`)
  }

  const t = await getTranslations({ locale, namespace: 'tournaments' })

  // Charger les jeux directement depuis Prisma (Server Component)
  let games: { id: string; name: string; slug: string }[] = []
  try {
    games = await prisma.game.findMany({
      select: { id: true, name: true, slug: true },
      orderBy: { name: 'asc' },
    })
  } catch {
    // DB non connectée en dev
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tighter mb-2">{t('createTitle')}</h1>
        <p className="text-gray-400">{t('createSubtitle')}</p>
      </div>

      <CreateTournamentForm games={games} locale={locale} />
    </div>
  )
}
