import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'home' })
  const navT = await getTranslations({ locale, namespace: 'nav' })

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero Section */}
      <section className="text-center py-16">
        <div className="mb-4 inline-block px-3 py-1 rounded-full bg-orange-600/20 border border-orange-600/50 text-sm text-orange-400">
          {t('badge')}
        </div>
        <h1 className="text-5xl font-bold tracking-tighter mb-4">
          {t('title', { highlight: t('titleHighlight') })}
        </h1>
        <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
          {t('subtitle')}
        </p>
        <div className="flex gap-4 justify-center">
          <Link href={`/${locale}/tournois`}>
            <Button size="lg" className="bg-orange-600 hover:bg-orange-700">
              {t('cta')}
            </Button>
          </Link>
          <Link href={`/${locale}/jeux`}>
            <Button size="lg" variant="outline">
              {t('ctaSecondary')}
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 mt-16">
        <h2 className="text-3xl font-bold text-center mb-12">{t('featuresTitle')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>{t('features.tournaments.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400">
                {t('features.tournaments.desc')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('features.rankings.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400">
                {t('features.rankings.desc')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('features.armies.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400">
                {t('features.armies.desc')}
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="text-center py-16 mt-16 border-t border-gray-800">
        <h2 className="text-3xl font-bold mb-4">{t('ctaFinal')}</h2>
        <p className="text-gray-400 mb-8">{t('ctaFinalDesc')}</p>
        <Link href={`/${locale}/tournois`}>
          <Button size="lg" className="bg-orange-600 hover:bg-orange-700">
            {t('ctaFinalBtn')}
          </Button>
        </Link>
      </section>
    </div>
  )
}
