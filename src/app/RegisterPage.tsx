import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useForm, Controller } from 'react-hook-form'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { apiRegister } from '@/lib/api'
import { useAuthStore } from '@/features/stores'
import { useAppStore } from '@/features/stores'
import type { AgeBand, Language } from '@/types'

function getAgeBand(age: number): AgeBand {
  if (age <= 17) return '13-17'
  if (age <= 24) return '18-24'
  return '25+'
}

export function RegisterPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)
  const setLanguage = useAppStore((s) => s.setLanguage)

  const schema = z
    .object({
      fullName: z.string().min(2),
      email: z.string().email(t('auth.errors.invalidEmail')),
      phone: z.string().min(10),
      recoveryEmail: z.string().email(t('auth.errors.invalidEmail')).optional().or(z.literal('')),
      recoveryPhone: z.string().optional(),
      password: z.string().min(8, t('auth.errors.weakPassword')),
      confirmPassword: z.string(),
      country: z.string().min(2),
      language: z.enum(['bn', 'en']),
      age: z.number().min(13).max(120),
      acceptTerms: z.literal(true, { message: t('common.error') }),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t('auth.errors.passwordMismatch'),
      path: ['confirmPassword'],
    })

  type FormData = z.infer<typeof schema>

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      recoveryEmail: '',
      recoveryPhone: '',
      password: '',
      confirmPassword: '',
      country: '',
      language: 'bn',
      age: 18,
      acceptTerms: undefined,
    },
  })

  const onSubmit = async (data: FormData) => {
    try {
      const ageBand = getAgeBand(data.age)
      const user = await apiRegister({
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        recoveryEmail: data.recoveryEmail || undefined,
        recoveryPhone: data.recoveryPhone || undefined,
        country: data.country,
        language: data.language as Language,
        ageBand,
        isAnonymous: false,
      })
      login(user)
      setLanguage(data.language as Language)

      if (ageBand === '13-17') {
        navigate('/verify-email', { state: { next: '/onboarding/consent' } })
      } else {
        navigate('/verify-email', { state: { next: '/verify-phone' } })
      }
    } catch {
      toast.error(t('common.error'))
    }
  }

  return (
    <AuthLayout title={t('auth.register.title')} subtitle={t('auth.register.subtitle')}>
      <form onSubmit={handleSubmit(onSubmit)} className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
        <div className="space-y-2">
          <Label htmlFor="fullName">{t('auth.register.fullName')}</Label>
          <Input id="fullName" autoComplete="name" {...register('fullName')} />
          {errors.fullName && (
            <p className="text-sm text-alert" role="alert">
              {errors.fullName.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">{t('auth.register.email')}</Label>
          <Input id="email" type="email" autoComplete="email" {...register('email')} />
          {errors.email && (
            <p className="text-sm text-alert" role="alert">
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">{t('auth.register.phone')}</Label>
          <Input id="phone" type="tel" autoComplete="tel" {...register('phone')} />
          {errors.phone && (
            <p className="text-sm text-alert" role="alert">
              {errors.phone.message}
            </p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="recoveryEmail">{t('auth.register.recoveryEmail')}</Label>
            <Input id="recoveryEmail" type="email" {...register('recoveryEmail')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="recoveryPhone">{t('auth.register.recoveryPhone')}</Label>
            <Input id="recoveryPhone" type="tel" {...register('recoveryPhone')} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="password">{t('auth.register.password')}</Label>
            <Input id="password" type="password" autoComplete="new-password" {...register('password')} />
            {errors.password && (
              <p className="text-sm text-alert" role="alert">
                {errors.password.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">{t('auth.register.confirmPassword')}</Label>
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
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="country">{t('auth.register.country')}</Label>
            <Input id="country" autoComplete="country-name" {...register('country')} />
            {errors.country && (
              <p className="text-sm text-alert" role="alert">
                {errors.country.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="age">{t('auth.register.age')}</Label>
            <Input
              id="age"
              type="number"
              min={13}
              max={120}
              {...register('age', { valueAsNumber: true })}
            />
            {errors.age && (
              <p className="text-sm text-alert" role="alert">
                {errors.age.message}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label>{t('auth.register.language')}</Label>
          <Controller
            name="language"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bn">{t('common.bn')}</SelectItem>
                  <SelectItem value="en">{t('common.en')}</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="flex items-start gap-2">
          <Controller
            name="acceptTerms"
            control={control}
            render={({ field }) => (
              <Checkbox
                id="acceptTerms"
                checked={field.value === true}
                onCheckedChange={(checked) => field.onChange(checked === true)}
              />
            )}
          />
          <Label htmlFor="acceptTerms" className="cursor-pointer font-normal leading-snug">
            {t('auth.register.acceptTerms')}
          </Label>
        </div>
        {errors.acceptTerms && (
          <p className="text-sm text-alert" role="alert">
            {errors.acceptTerms.message}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {t('auth.register.submit')}
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs text-muted">{t('common.or')}</span>
        <Separator className="flex-1" />
      </div>

      <SocialLoginButtons />

      <p className="mt-6 text-center text-sm text-muted">
        {t('auth.register.hasAccount')}{' '}
        <Link to="/login" className="font-medium text-turmeric-deep hover:underline">
          {t('auth.register.login')}
        </Link>
      </p>
    </AuthLayout>
  )
}
