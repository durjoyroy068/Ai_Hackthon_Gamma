import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { apiGoogleLogin } from '@/lib/api'
import { isFirebaseConfigured, signInWithGooglePopup, signOutFirebase } from '@/lib/firebase'
import { useAuthStore, useAppStore } from '@/features/stores'

export function SocialLoginButtons() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)
  const setOnboardingComplete = useAuthStore((s) => s.setOnboardingComplete)
  const language = useAppStore((s) => s.language)
  const [loading, setLoading] = useState(false)

  const handleGoogle = async () => {
    if (!isFirebaseConfigured()) {
      toast.error(t('auth.social.configMissing', { defaultValue: 'Google sign-in is not configured yet.' }))
      return
    }

    setLoading(true)
    try {
      const { idToken } = await signInWithGooglePopup()
      const user = await apiGoogleLogin(idToken, language === 'en' ? 'en' : 'bn')
      login(user)
      setOnboardingComplete(true)
      toast.success(t('auth.social.googleSuccess', { defaultValue: 'Signed in with Google' }))
      navigate('/app')
    } catch (error) {
      await signOutFirebase().catch(() => undefined)
      const message = error instanceof Error ? error.message : ''
      if (message.includes('popup-closed-by-user') || message.includes('cancelled')) {
        toast(t('auth.social.cancelled', { defaultValue: 'Google sign-in cancelled' }))
      } else {
        toast.error(t('auth.social.googleFailed', { defaultValue: 'Google sign-in failed. Please try again.' }))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={loading}
        onClick={handleGoogle}
      >
        {loading
          ? t('common.loading')
          : t('auth.social.google')}
      </Button>
    </div>
  )
}
