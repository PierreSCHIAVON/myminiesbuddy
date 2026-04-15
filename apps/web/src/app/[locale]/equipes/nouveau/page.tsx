import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { CreateClubForm } from '@/components/create-club-form'

export default async function NewClubPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const session = await auth()

  if (!session?.user) redirect(`/${locale}`)

  return (
    <div className="container mx-auto px-4 py-12 max-w-lg">
      <h1 className="text-3xl font-bold tracking-tighter mb-2">Créer une équipe</h1>
      <p className="text-gray-400 mb-8">Donne un nom à ton équipe et invite tes coéquipiers.</p>
      <CreateClubForm locale={locale} />
    </div>
  )
}
