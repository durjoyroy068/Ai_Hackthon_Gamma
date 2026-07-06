import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import {
  Heart,
  Calendar,
  Mic,
  Wind,
  Lock,
  Trophy,
} from 'lucide-react'
import { TopNav } from '@/components/TopNav'
import { Card, CardContent } from '@/components/ui/card'
import { useAppStore, useWellnessStore } from '@/features/stores'
import { cn, formatDate } from '@/lib/utils'

const slowTransition = { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const }

const ICON_MAP: Record<string, typeof Heart> = {
  heart: Heart,
  calendar: Calendar,
  mic: Mic,
  wind: Wind,
  trophy: Trophy,
}

export function AchievementsPage() {
  const { t } = useTranslation()
  const { language, useBanglaNumerals } = useAppStore()
  const { achievements } = useWellnessStore()

  return (
    <>
      <TopNav />
      <main className="flex-1 overflow-y-auto">
        <motion.div
          className="mx-auto max-w-2xl space-y-6 p-6 pb-24"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={slowTransition}
        >
          <div>
            <h1 className="font-display text-3xl text-foreground">{t('achievements.title')}</h1>
            <p className="mt-2 text-muted">{t('achievements.subtitle')}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {achievements.map((achievement, i) => {
              const Icon = ICON_MAP[achievement.icon] ?? Trophy
              const unlocked = !!achievement.unlockedAt
              return (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...slowTransition, delay: i * 0.08 }}
                >
                  <Card
                    className={cn(
                      'transition-all duration-300',
                      unlocked
                        ? 'border-turmeric/40 bg-turmeric/5'
                        : 'opacity-60 grayscale'
                    )}
                  >
                    <CardContent className="flex gap-4 pt-6">
                      <div
                        className={cn(
                          'flex h-12 w-12 shrink-0 items-center justify-center rounded-full',
                          unlocked ? 'bg-turmeric/20 text-turmeric' : 'bg-mist text-muted dark:bg-dusk-2'
                        )}
                      >
                        {unlocked ? (
                          <Icon className="h-6 w-6" />
                        ) : (
                          <Lock className="h-5 w-5" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold">{t(achievement.titleKey)}</h3>
                        <p className="mt-1 text-sm text-muted">{t(achievement.descriptionKey)}</p>
                        <p className="mt-2 text-xs font-medium text-peacock">
                          {unlocked
                            ? achievement.unlockedAt
                              ? formatDate(achievement.unlockedAt, language, useBanglaNumerals)
                              : t('achievements.unlocked')
                            : t('achievements.locked')}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      </main>
    </>
  )
}
