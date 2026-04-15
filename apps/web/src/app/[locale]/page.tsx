import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { Button } from '@/components/ui/button'

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'home' })

  return (
    <div>
      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Gradient de fond subtil */}
        <div className="absolute inset-0 bg-gradient-to-b from-orange-950/20 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-orange-600/5 blur-3xl rounded-full pointer-events-none" />

        <div className="relative container mx-auto px-4 pt-24 pb-20 text-center max-w-4xl">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 px-3 py-1 rounded-full border border-orange-500/30 bg-orange-500/10 text-xs text-orange-400 font-medium tracking-wide">
            <span className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse" />
            {t('badge')}
          </div>

          {/* Titre */}
          <h1 className="text-6xl sm:text-7xl font-bold tracking-tighter leading-[1.05] mb-6">
            La plateforme de{' '}
            <span className="bg-gradient-to-r from-orange-400 to-amber-300 bg-clip-text text-transparent">
              tournois
            </span>
            {' '}pour joueurs de figurines
          </h1>

          <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto leading-relaxed">
            {t('subtitle')}
          </p>

          <div className="flex gap-3 justify-center flex-wrap">
            <Link href={`/${locale}/tournois`}>
              <Button size="lg" className="bg-orange-600 hover:bg-orange-700 font-medium">
                {t('cta')}
              </Button>
            </Link>
            <Link href={`/${locale}/jeux`}>
              <Button size="lg" variant="outline" className="font-medium">
                {t('ctaSecondary')}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────── */}
      <section className="container mx-auto px-4 py-20 max-w-5xl">
        <p className="text-xs text-muted-foreground uppercase tracking-widest text-center mb-12 font-medium">
          {t('featuresTitle')}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border rounded-xl overflow-hidden">
          {[
            {
              icon: '⚔',
              title: t('features.tournaments.title'),
              desc: t('features.tournaments.desc'),
              href: `/${locale}/tournois`,
            },
            {
              icon: '🏆',
              title: t('features.rankings.title'),
              desc: t('features.rankings.desc'),
              href: `/${locale}/rankings`,
            },
            {
              icon: '📋',
              title: t('features.armies.title'),
              desc: t('features.armies.desc'),
              href: `/${locale}/jeux`,
            },
          ].map(({ icon, title, desc, href }) => (
            <Link key={title} href={href} className="group bg-card hover:bg-muted/40 transition-colors p-8 flex flex-col gap-4">
              <span className="text-2xl">{icon}</span>
              <div>
                <h3 className="font-semibold text-foreground mb-1 group-hover:text-orange-400 transition-colors">
                  {title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
              <span className="text-xs text-muted-foreground group-hover:text-orange-400 transition-colors mt-auto">
                En savoir plus →
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── CTA final ─────────────────────────────────────────── */}
      <section className="border-t border-border/60">
        <div className="container mx-auto px-4 py-20 max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tighter mb-3">{t('ctaFinal')}</h2>
          <p className="text-muted-foreground mb-8">{t('ctaFinalDesc')}</p>
          <Link href={`/${locale}/tournois`}>
            <Button size="lg" className="bg-orange-600 hover:bg-orange-700 font-medium">
              {t('ctaFinalBtn')}
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
