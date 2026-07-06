import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { OtpInput } from '@/components/auth/OtpInput'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { apiResetPassword, apiSendOTP } from '@/lib/api'

export function ForgotPasswordPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)

  const emailSchema = z.object({
    email: z.string().email(t('auth.errors.invalidEmail')),
  })

  type EmailForm = z.infer<typeof emailSchema>

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EmailForm>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '' },
  })

  const onEmailSubmit = async (data: EmailForm) => {
    setLoading(true)
    try {
      await apiResetPassword(data.email)
      await apiSendOTP(data.email, 'email')
      setEmail(data.email)
      setStep('otp')
      toast.success(t('common.success'))
    } catch {
      toast.error(t('common.error'))
    } finally {
      setLoading(false)
    }
  }

  const onOtpContinue = () => {
    if (otp.length !== 6) {
      toast.error(t('auth.errors.invalidCode'))
      return
    }
    navigate(`/reset-password?email=${encodeURIComponent(email)}&code=${otp}`)
  }

  return (
    <AuthLayout
      title={t('auth.forgotPassword.title')}
      subtitle={t('auth.forgotPassword.subtitle')}
      footer={
        <Link to="/login" className="text-turmeric-deep hover:underline">
          {t('auth.forgotPassword.backToLogin')}
        </Link>
      }
    >
      {step === 'email' ? (
        <form onSubmit={handleSubmit(onEmailSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{t('auth.forgotPassword.email')}</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              {...register('email')}
              aria-invalid={!!errors.email}
            />
            {errors.email && (
              <p className="text-sm text-alert" role="alert">
                {errors.email.message}
              </p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {t('auth.forgotPassword.submit')}
          </Button>
        </form>
      ) : (
        <div className="space-y-6">
          <p className="text-center text-sm text-muted">{t('auth.verifyEmail.subtitle')}</p>
          <OtpInput
            value={otp}
            onChange={setOtp}
            aria-label={t('auth.verifyEmail.code')}
          />
          <Button type="button" className="w-full" onClick={onOtpContinue} disabled={otp.length !== 6}>
            {t('common.continue')}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={() => apiSendOTP(email, 'email')}
          >
            {t('auth.verifyEmail.resend')}
          </Button>
        </div>
      )}
    </AuthLayout>
  )
}
