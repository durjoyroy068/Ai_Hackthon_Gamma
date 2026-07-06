import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'

export function SocialLoginButtons() {
  const { t } = useTranslation()

  const providers = [
    { key: 'google' as const, label: t('auth.social.google') },
    { key: 'apple' as const, label: t('auth.social.apple') },
    { key: 'microsoft' as const, label: t('auth.social.microsoft') },
  ]

  return (
    <div className="space-y-3">
      {providers.map(({ key, label }) => (
        <Button
          key={key}
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => toast(t('auth.social.comingSoon', { defaultValue: 'Coming soon' }))}
        >
          {label}
        </Button>
      ))}
    </div>
  )
}
