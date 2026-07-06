import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import { PageShell } from '@/components/ThemeProvider'
import { AlponaThread, BrandMark } from '@/components/AlponaThread'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent } from '@/components/ui/card'
import { useAuthStore } from '@/features/stores'
import { apiGuardianConsent } from '@/lib/api'
import type { GuardianConsent } from '@/types'

export function OnboardingConsentPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const updateUser = useAuthStore((s) => s.updateUser)

  const schema = z.object({
    guardianName: z.string().min(2),
    guardianEmail: z.string().email(t('auth.errors.invalidEmail')),
    guardianPhone: z.string().min(10),
    consentGiven: z.literal(true, { message: t('common.error') }),
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
      guardianName: '',
      guardianEmail: '',
      guardianPhone: '',
      consentGiven: undefined,
    },
  })

  const onSubmit = async (data: FormData) => {
    try {
      const consent: GuardianConsent = {
        guardianName: data.guardianName,
        guardianEmail: data.guardianEmail,
        guardianPhone: data.guardianPhone,
        consentGiven: true,
        consentDate: new Date().toISOString(),
      }
      const user = await apiGuardianConsent(consent)
      updateUser(user)
      navigate('/onboarding/language')
    } catch {
      toast.error(t('common.error'))
    }
  }

  return (
    <PageShell className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <AlponaThread variant="progress" progress={66} className="mb-8 w-full max-w-md" dotCount={3} />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="w-full max-w-lg"
      >
        <div className="mb-6 flex justify-center">
          <BrandMark />
        </div>
        <div className="text-center">
          <h1 className="font-display text-3xl font-semibold text-foreground">
            {t('auth.guardianConsent.title')}
          </h1>
          <p className="mt-3 text-muted">{t('auth.guardianConsent.subtitle')}</p>
        </div>

        <Card className="mt-8 border-peacock/20 bg-peacock-soft/30">
          <CardContent className="p-5">
            <p className="text-sm leading-relaxed text-foreground">
              {t('auth.guardianConsent.explanation')}
            </p>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="guardianName">{t('auth.guardianConsent.guardianName')}</Label>
            <Input id="guardianName" autoComplete="name" {...register('guardianName')} />
            {errors.guardianName && (
              <p className="text-sm text-alert" role="alert">
                {errors.guardianName.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="guardianEmail">{t('auth.guardianConsent.guardianEmail')}</Label>
            <Input id="guardianEmail" type="email" {...register('guardianEmail')} />
            {errors.guardianEmail && (
              <p className="text-sm text-alert" role="alert">
                {errors.guardianEmail.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="guardianPhone">{t('auth.guardianConsent.guardianPhone')}</Label>
            <Input id="guardianPhone" type="tel" {...register('guardianPhone')} />
            {errors.guardianPhone && (
              <p className="text-sm text-alert" role="alert">
                {errors.guardianPhone.message}
              </p>
            )}
          </div>

          <div className="flex items-start gap-2">
            <Controller
              name="consentGiven"
              control={control}
              render={({ field }) => (
                <Checkbox
                  id="consentGiven"
                  checked={field.value === true}
                  onCheckedChange={(checked) => field.onChange(checked === true)}
                />
              )}
            />
            <Label htmlFor="consentGiven" className="cursor-pointer font-normal leading-snug">
              {t('auth.guardianConsent.consentCheckbox')}
            </Label>
          </div>
          {errors.consentGiven && (
            <p className="text-sm text-alert" role="alert">
              {errors.consentGiven.message}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {t('auth.guardianConsent.submit')}
          </Button>
        </form>
      </motion.div>
    </PageShell>
  )
}
