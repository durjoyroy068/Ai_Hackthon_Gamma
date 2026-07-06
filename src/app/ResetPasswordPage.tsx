import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
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
import { apiVerifyOTP, apiResetPasswordConfirm } from '@/lib/api'

export function ResetPasswordPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const email = searchParams.get('email') ?? ''
  const prefilledCode = searchParams.get('code') ?? ''
  const [otp, setOtp] = useState(prefilledCode)
  const [otpVerified, setOtpVerified] = useState(!!prefilledCode)
  const [loading, setLoading] = useState(false)

  const passwordSchema = z
    .object({
      password: z.string().min(8, t('auth.errors.weakPassword')),
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t('auth.errors.passwordMismatch'),
      path: ['confirmPassword'],
    })

  type PasswordForm = z.infer<typeof passwordSchema>

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  })

  const verifyOtp = async () => {
    if (otp.length !== 6) {
      toast.error(t('auth.errors.invalidCode'))
      return
    }
    setLoading(true)
    try {
      const valid = await apiVerifyOTP(email || 'reset', otp)
      if (valid) {
        setOtpVerified(true)
        toast.success(t('common.success'))
      } else {
        toast.error(t('auth.errors.invalidCode'))
      }
    } catch {
      toast.error(t('common.error'))
    } finally {
      setLoading(false)
    }
  }

  const onPasswordSubmit = async (data: PasswordForm) => {
    setLoading(true)
    try {
      const ok = await apiResetPasswordConfirm(email, otp, data.password)
      if (ok) {
        toast.success(t('common.success'))
        navigate('/login')
      } else {
        toast.error(t('common.error'))
      }
    } catch {
      toast.error(t('common.error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title={t('auth.resetPassword.title')} subtitle={t('auth.resetPassword.subtitle')}>
      {!otpVerified ? (
        <div className="space-y-6">
          <p className="text-center text-sm text-muted">{t('auth.verifyEmail.subtitle')}</p>
          <OtpInput
            value={otp}
            onChange={setOtp}
            disabled={loading}
            aria-label={t('auth.verifyEmail.code')}
          />
          <Button
            type="button"
            className="w-full"
            onClick={verifyOtp}
            disabled={loading || otp.length !== 6}
          >
            {t('auth.verifyEmail.submit')}
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onPasswordSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">{t('auth.resetPassword.password')}</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              {...register('password')}
            />
            {errors.password && (
              <p className="text-sm text-alert" role="alert">
                {errors.password.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">{t('auth.resetPassword.confirmPassword')}</Label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-alert" role="alert">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>
          <Button type="submit" className="w-full">
            {t('auth.resetPassword.submit')}
          </Button>
        </form>
      )}
    </AuthLayout>
  )
}
