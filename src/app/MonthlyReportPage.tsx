import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { TopNav } from '@/components/TopNav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useWellnessStore } from '@/features/stores'
import { TrendingDown, TrendingUp, Activity } from 'lucide-react'

const slowTransition = { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const }

const TREND_ITEMS = [
  { key: 'mood', labelKey: 'reports.monthly.moodAverage' },
  { key: 'stress', labelKey: 'dashboard.stressScore' },
  { key: 'anxiety', labelKey: 'mood.riskIndicators.anxiety' },
  { key: 'sleep', labelKey: 'mood.trackers.sleep.title' },
] as const

export function MonthlyReportPage() {
  const { t } = useTranslation()
  const { moodEntries, assessments } = useWellnessStore()

  const moodAverage = useMemo(() => {
    if (moodEntries.length === 0) return 5.5
    const sum = moodEntries.reduce((a, e) => a + e.moodScore, 0)
    return Math.round((sum / moodEntries.length) * 10) / 10
  }, [moodEntries])

  const assessmentChange = useMemo(() => {
    if (assessments.length < 2) return -2
    return assessments[0]!.totalScore - assessments[1]!.totalScore
  }, [assessments])

  const trends = useMemo(
    () => ({
      mood: moodAverage,
      stress: 40,
      anxiety: 32,
      sleep: 6.2,
    }),
    [moodAverage]
  )

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
            <h1 className="font-display text-3xl text-foreground">{t('reports.monthly.title')}</h1>
          </div>

          <Card className="border-turmeric/30 bg-turmeric/5">
            <CardContent className="pt-6">
              <p className="leading-relaxed">{t('reports.monthly.summary')}</p>
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{t('reports.monthly.moodAverage')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-peacock">{moodAverage}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{t('reports.monthly.assessmentChange')}</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center gap-2">
                {assessmentChange <= 0 ? (
                  <TrendingDown className="h-5 w-5 text-peacock" />
                ) : (
                  <TrendingUp className="h-5 w-5 text-alert" />
                )}
                <p className="text-3xl font-bold">{assessmentChange > 0 ? '+' : ''}{assessmentChange}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-dusk dark:text-turmeric" />
                {t('reports.monthly.trends')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {TREND_ITEMS.map(({ key, labelKey }) => (
                  <div key={key} className="flex items-center justify-between rounded-lg bg-mist px-4 py-3 dark:bg-dusk-2">
                    <span className="text-sm">{t(labelKey)}</span>
                    <span className="font-semibold text-peacock">{trends[key]}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </>
  )
}
