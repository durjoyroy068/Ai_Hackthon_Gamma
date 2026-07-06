import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { SocialLoginButtons } from '@/components/auth/SocialLoginButtons'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { apiLogin } from '@/lib/api'
import { useAuthStore } from '@/features/stores'

export function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)
  const setOnboardingComplete = useAuthStore((s) => s.setOnboardingComplete)
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)

  const schema = z.object({
    email: z.string().email(t('auth.errors.invalidEmail')),
    password: z.string().min(8, t('auth.errors.weakPassword')),
  })

  type FormData = z.infer<typeof schema>

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      const user = await apiLogin(data.email, data.password)
      login(user)
      setOnboardingComplete(true)
      if (rememberMe) {
        localStorage.setItem('mon-songlap-remember', data.email)
      } else {
        localStorage.removeItem('mon-songlap-remember')
      }
      navigate('/app')
    } catch {
      toast.error(t('common.error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title={t('auth.login.title')} subtitle={t('auth.login.subtitle')}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">{t('auth.login.email')}</Label>
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

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">{t('auth.login.password')}</Label>
            <Link
              to="/forgot-password"
              className="text-sm text-turmeric-deep hover:underline"
            >
              {t('auth.login.forgotPassword')}
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            {...register('password')}
            aria-invalid={!!errors.password}
          />
          {errors.password && (
            <p className="text-sm text-alert" role="alert">
              {errors.password.message}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="remember"
            checked={rememberMe}
            onCheckedChange={(checked) => setRememberMe(checked === true)}
          />
          <Label htmlFor="remember" className="cursor-pointer font-normal">
            {t('auth.login.rememberMe')}
          </Label>
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {t('auth.login.submit')}
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs text-muted">{t('common.or')}</span>
        <Separator className="flex-1" />
      </div>

      <SocialLoginButtons />

      <p className="mt-6 text-center text-sm text-muted">
        {t('auth.login.noAccount')}{' '}
        <Link to="/register" className="font-medium text-turmeric-deep hover:underline">
          {t('auth.login.signUp')}
        </Link>
      </p>
    </AuthLayout>
  )
}
