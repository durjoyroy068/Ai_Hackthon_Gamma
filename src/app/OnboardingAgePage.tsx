import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { PageShell } from '@/components/ThemeProvider'
import { AlponaThread, BrandMark } from '@/components/AlponaThread'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/features/stores'
import { apiUpdateUser } from '@/lib/api'
import type { AgeBand } from '@/types'

const BANDS: { value: AgeBand; key: 'band1317' | 'band1824' | 'band25plus' }[] = [
  { value: '13-17', key: 'band1317' },
  { value: '18-24', key: 'band1824' },
  { value: '25+', key: 'band25plus' },
]

export function OnboardingAgePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user, updateUser } = useAuthStore()
  const [selected, setSelected] = useState<AgeBand | null>(user?.ageBand ?? null)

  const handleContinue = async () => {
    if (!selected) return
    updateUser({ ageBand: selected })
    try {
      await apiUpdateUser({ ageBand: selected })
    } catch {
      /* local state kept */
    }
    if (selected === '13-17') {
      navigate('/onboarding/consent')
    } else {
      navigate('/onboarding/language')
    }
  }

  return (
    <PageShell className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <AlponaThread
        variant="progress"
        progress={selected ? (BANDS.findIndex((b) => b.value === selected) + 1) * 33 : 0}
        className="mb-8 w-full max-w-md"
        dotCount={3}
      />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="w-full max-w-lg text-center"
      >
        <div className="mb-6 flex justify-center">
          <BrandMark />
        </div>
        <h1 className="font-display text-3xl font-semibold text-foreground">
          {t('onboarding.age.title')}
        </h1>
        <p className="mt-3 text-muted">{t('onboarding.age.subtitle')}</p>

        <div className="mt-10 space-y-3">
          {BANDS.map(({ value, key }) => (
            <button
              key={value}
              type="button"
              onClick={() => setSelected(value)}
              className="w-full text-left"
            >
              <Card
                className={cn(
                  'transition-all duration-300',
                  selected === value
                    ? 'border-peacock ring-2 ring-peacock/30'
                    : 'border-border hover:border-peacock/40'
                )}
              >
                <CardContent className="p-5">
                  <span className="font-medium text-foreground">{t(`onboarding.age.${key}`)}</span>
                </CardContent>
              </Card>
            </button>
          ))}
        </div>

        <p className="mt-6 text-sm text-muted">{t('onboarding.age.note')}</p>

        <Button
          className="mt-8 w-full max-w-xs"
          disabled={!selected}
          onClick={handleContinue}
        >
          {t('common.continue')}
        </Button>
      </motion.div>
    </PageShell>
  )
}
