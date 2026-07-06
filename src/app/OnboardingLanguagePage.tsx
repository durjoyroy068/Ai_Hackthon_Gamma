import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import i18n from '@/i18n'
import { PageShell } from '@/components/ThemeProvider'
import { AlponaThread, BrandMark } from '@/components/AlponaThread'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAppStore, useAuthStore } from '@/features/stores'
import { apiUpdateUser } from '@/lib/api'
import type { Language } from '@/types'

export function OnboardingLanguagePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { language, setLanguage, highContrast, setHighContrast } = useAppStore()
  const { updateUser, setOnboardingComplete } = useAuthStore()
  const [reduceMotion, setReduceMotion] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
  const [screenReader, setScreenReader] = useState(false)

  const handleLanguageChange = (value: Language) => {
    setLanguage(value)
    i18n.changeLanguage(value)
    updateUser({ language: value })
  }

  const handleSubmit = async () => {
    if (reduceMotion) {
      document.documentElement.classList.add('reduce-motion')
    }
    if (screenReader) {
      document.documentElement.dataset.screenReader = 'true'
    }
    try {
      await apiUpdateUser({ language, onboardingComplete: true })
    } catch {
      /* continue */
    }
    setOnboardingComplete(true)
    navigate('/app')
  }

  return (
    <PageShell className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <AlponaThread variant="progress" progress={100} className="mb-8 w-full max-w-md" dotCount={3} />
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
            {t('onboarding.language.title')}
          </h1>
          <p className="mt-3 text-muted">{t('onboarding.language.subtitle')}</p>
        </div>

        <div className="mt-10 space-y-6">
          <div className="space-y-2">
            <Label>{t('onboarding.language.preferredLanguage')}</Label>
            <Select value={language} onValueChange={(v) => handleLanguageChange(v as Language)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bn">{t('common.bn')}</SelectItem>
                <SelectItem value="en">{t('common.en')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-paper p-4 dark:bg-surface">
            <Label htmlFor="highContrast" className="cursor-pointer">
              {t('onboarding.language.highContrast')}
            </Label>
            <Switch
              id="highContrast"
              checked={highContrast}
              onCheckedChange={setHighContrast}
            />
          </div>

          <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-paper p-4 dark:bg-surface">
            <Label htmlFor="reduceMotion" className="cursor-pointer">
              {t('onboarding.language.reduceMotion')}
            </Label>
            <Switch id="reduceMotion" checked={reduceMotion} onCheckedChange={setReduceMotion} />
          </div>

          <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-paper p-4 dark:bg-surface">
            <Label htmlFor="screenReader" className="cursor-pointer">
              {t('onboarding.language.screenReader')}
            </Label>
            <Switch id="screenReader" checked={screenReader} onCheckedChange={setScreenReader} />
          </div>
        </div>

        <Button className="mt-10 w-full" onClick={handleSubmit}>
          {t('onboarding.language.submit')}
        </Button>
      </motion.div>
    </PageShell>
  )
}
