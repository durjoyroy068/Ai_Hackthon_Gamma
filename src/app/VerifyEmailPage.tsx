import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { OtpInput } from '@/components/auth/OtpInput'
import { Button } from '@/components/ui/button'
import { apiSendOTP, apiVerifyOTP } from '@/lib/api'
import { useAuthStore } from '@/features/stores'

export function VerifyEmailPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuthStore((s) => s.user)
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)

  const nextPath =
    (location.state as { next?: string } | null)?.next ??
    (user?.ageBand === '13-17' ? '/onboarding/consent' : '/verify-phone')

  const handleVerify = async () => {
    if (otp.length !== 6) {
      toast.error(t('auth.errors.invalidCode'))
      return
    }
    setLoading(true)
    try {
      const valid = await apiVerifyOTP(user?.email ?? 'email', otp)
      if (valid) {
        toast.success(t('common.success'))
        navigate(nextPath)
      } else {
        toast.error(t('auth.errors.invalidCode'))
      }
    } catch {
      toast.error(t('common.error'))
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (!user?.email) return
    try {
      await apiSendOTP(user.email, 'email')
      toast.success(t('common.success'))
    } catch {
      toast.error(t('common.error'))
    }
  }

  return (
    <AuthLayout title={t('auth.verifyEmail.title')} subtitle={t('auth.verifyEmail.subtitle')}>
      <div className="space-y-6">
        <OtpInput
          value={otp}
          onChange={setOtp}
          disabled={loading}
          aria-label={t('auth.verifyEmail.code')}
        />
        <Button
          type="button"
          className="w-full"
          onClick={handleVerify}
          disabled={loading || otp.length !== 6}
        >
          {t('auth.verifyEmail.submit')}
        </Button>
        <Button type="button" variant="ghost" className="w-full" onClick={handleResend}>
          {t('auth.verifyEmail.resend')}
        </Button>
        <p className="text-center text-sm">
          <Link to="/register" className="text-turmeric-deep hover:underline">
            {t('auth.verifyEmail.changeEmail')}
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
