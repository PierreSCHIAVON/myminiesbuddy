import { getTranslations } from 'next-intl/server'
import { auth, signOut } from '@/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { redirect } from 'next/navigation'

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const session = await auth()
  const { locale } = await params

  if (!session?.user) {
    redirect(`/${locale}`)
  }

  const t = await getTranslations({ locale, namespace: 'profile' })

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      {/* Title */}
      <section className="mb-12">
        <h1 className="text-4xl font-bold tracking-tighter">
          {t('title')}
        </h1>
      </section>

      {/* Personal Information */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-6">{t('personalInfo')}</h2>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-6">
              {/* Avatar */}
              <Avatar className="h-16 w-16">
                <AvatarImage src={session.user.image ?? ''} alt={session.user.name ?? ''} />
                <AvatarFallback className="bg-orange-600 text-white text-lg font-semibold">
                  {session.user.name?.[0]?.toUpperCase() ?? 'U'}
                </AvatarFallback>
              </Avatar>

              {/* Info */}
              <div className="flex-1 space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-400">
                    {t('name')}
                  </label>
                  <p className="text-lg">{session.user.name || 'Unknown'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400">
                    {t('email')}
                  </label>
                  <p className="text-lg">{session.user.email || 'Unknown'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Preferences */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-6">{t('preferences')}</h2>
        <Card>
          <CardContent className="pt-6 space-y-6">
            <div>
              <label className="text-sm font-medium text-gray-400">
                {t('language')}
              </label>
              <p className="text-lg mt-2 capitalize">{locale === 'fr' ? 'Français' : 'English'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-400">
                {t('notifications')}
              </label>
              <p className="text-gray-400 text-sm mt-2">Manage your notification preferences</p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Security */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-6">{t('security')}</h2>
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <label className="text-sm font-medium">{t('changePassword')}</label>
                <p className="text-gray-400 text-sm mt-1">Update your password</p>
              </div>
              <Button variant="outline" disabled>
                Coming soon
              </Button>
            </div>

            <div className="border-t border-gray-700 pt-4">
              <label className="text-sm font-medium">{t('sessions')}</label>
              <p className="text-gray-400 text-sm mt-2">1 active session</p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Sign Out */}
      <section className="border-t border-gray-700 pt-8">
        <form
          action={async () => {
            'use server'
            await signOut({ redirectTo: `/${locale}` })
          }}
        >
          <Button type="submit" variant="destructive" className="w-full">
            {t('logout')}
          </Button>
        </form>
      </section>
    </div>
  )
}
