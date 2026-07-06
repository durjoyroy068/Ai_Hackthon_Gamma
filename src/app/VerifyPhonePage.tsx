import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { OtpInput } from '@/components/auth/OtpInput'
import { Button } from '@/components/ui/button'
import { apiSendOTP, apiVerifyOTP } from '@/lib/api'
import { useAuthStore } from '@/features/stores'

export function VerifyPhonePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)

  const nextPath =
    user?.ageBand === '13-17' ? '/onboarding/consent' : '/onboarding/language'

  const handleVerify = async () => {
    if (otp.length !== 6) {
      toast.error(t('auth.errors.invalidCode'))
      return
    }
    setLoading(true)
    try {
      const valid = await apiVerifyOTP(user?.phone ?? 'phone', otp)
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
    if (!user?.phone) return
    try {
      await apiSendOTP(user.phone, 'phone')
      toast.success(t('common.success'))
    } catch {
      toast.error(t('common.error'))
    }
  }

  return (
    <AuthLayout title={t('auth.verifyPhone.title')} subtitle={t('auth.verifyPhone.subtitle')}>
      <div className="space-y-6">
        <OtpInput
          value={otp}
          onChange={setOtp}
          disabled={loading}
          aria-label={t('auth.verifyPhone.code')}
        />
        <Button
          type="button"
          className="w-full"
          onClick={handleVerify}
          disabled={loading || otp.length !== 6}
        >
          {t('auth.verifyPhone.submit')}
        </Button>
        <Button type="button" variant="ghost" className="w-full" onClick={handleResend}>
          {t('auth.verifyPhone.resend')}
        </Button>
      </div>
    </AuthLayout>
  )
}
