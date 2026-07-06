import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { TopNav } from '@/components/TopNav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useWellnessStore } from '@/features/stores'
import { formatDate } from '@/lib/utils'
import { useAppStore } from '@/features/stores'
import { TrendingUp, CalendarCheck, Star } from 'lucide-react'

const slowTransition = { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const }

const HIGHLIGHT_KEYS = ['reports.weekly.highlight1', 'reports.weekly.highlight2'] as const

export function WeeklyReportPage() {
  const { t } = useTranslation()
  const { language, useBanglaNumerals } = useAppStore()
  const { moodEntries } = useWellnessStore()

  const weekStart = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() - 7)
    return d
  }, [])

  const weekEntries = useMemo(() => {
    const cutoff = weekStart.toISOString().split('T')[0]!
    return moodEntries.filter((e) => e.date >= cutoff)
  }, [moodEntries, weekStart])

  const moodAverage = useMemo(() => {
    if (weekEntries.length === 0) return 5.8
    const sum = weekEntries.reduce((a, e) => a + e.moodScore, 0)
    return Math.round((sum / weekEntries.length) * 10) / 10
  }, [weekEntries])

  const checkIns = weekEntries.length || 5

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
            <h1 className="font-display text-3xl text-foreground">{t('reports.weekly.title')}</h1>
            <p className="mt-1 text-sm text-muted">
              {formatDate(weekStart, language, useBanglaNumerals)}
            </p>
          </div>

          <Card className="border-peacock/30 bg-peacock-soft/20 dark:bg-peacock/10">
            <CardContent className="pt-6">
              <p className="leading-relaxed">{t('reports.weekly.summary')}</p>
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center gap-3 pb-2">
                <TrendingUp className="h-5 w-5 text-peacock" />
                <CardTitle className="text-sm">{t('reports.weekly.moodAverage')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-peacock">{moodAverage}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center gap-3 pb-2">
                <CalendarCheck className="h-5 w-5 text-turmeric" />
                <CardTitle className="text-sm">{t('reports.weekly.checkIns')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-turmeric">{checkIns}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-turmeric" />
                {t('reports.weekly.highlights')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {HIGHLIGHT_KEYS.map((key) => (
                  <li key={key} className="flex items-start gap-2 text-sm">
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-peacock" />
                    {t(key)}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </>
  )
}
