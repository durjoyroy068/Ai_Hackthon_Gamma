import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { TopNav } from '@/components/TopNav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useWellnessStore } from '@/features/stores'
import { Sparkles } from 'lucide-react'

const COLORS = {
  peacock: '#B9D2C4',
  turmeric: '#F0C33F',
  dusk: '#3E6763',
  turmericDeep: '#D1A62A',
  peacockSoft: '#E4EEE8',
}

const PIE_COLORS = [COLORS.peacock, COLORS.turmeric, COLORS.dusk, COLORS.turmericDeep, COLORS.peacockSoft]

const slowTransition = { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const }

const INSIGHT_KEYS = [
  'dashboard.insights.sleep',
  'dashboard.insights.exercise',
  'dashboard.insights.gratitude',
] as const

export function DashboardPage() {
  const { t } = useTranslation()
  const { moodEntries, recoveryPlan, assessments } = useWellnessStore()

  const moodTrendData = useMemo(() => {
    const sorted = [...moodEntries]
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-7)
    return sorted.map((e) => ({
      date: e.date.slice(5),
      score: e.moodScore,
    }))
  }, [moodEntries])

  const wellnessScore = useMemo(() => {
    if (moodEntries.length === 0) return 68
    const avg = moodEntries.reduce((a, e) => a + e.moodScore, 0) / moodEntries.length
    return Math.round(avg * 10)
  }, [moodEntries])

  const stressScore = useMemo(() => {
    const latest = assessments[0]
    if (!latest) return 42
    return Math.min(100, latest.totalScore * 4)
  }, [assessments])

  const recoveryProgress = recoveryPlan
    ? Math.round((recoveryPlan.currentDay / 30) * 100)
    : 0

  const activityData = useMemo(() => {
    const counts = { meditation: 0, exercise: 0, hydration: 0, sleep: 0, breathing: 0 }
    moodEntries.forEach((e) => {
      if (e.meditation) counts.meditation++
      if (e.exercise) counts.exercise++
      if ((e.hydration ?? 0) >= 6) counts.hydration++
      if ((e.sleep ?? 0) >= 7) counts.sleep++
    })
    counts.breathing = Math.floor(counts.meditation * 0.8)
    const labelKeys: Record<string, string> = {
      meditation: 'recovery.activities.meditation',
      exercise: 'recovery.activities.walking',
      hydration: 'recovery.activities.hydration',
      sleep: 'recovery.activities.sleep',
      breathing: 'recovery.activities.breathing',
    }
    return Object.entries(counts).map(([key, value]) => ({
      name: t(labelKeys[key]!),
      value,
      key,
    }))
  }, [moodEntries, t])

  const riskPieData = useMemo(
    () => [
      { name: t('dashboard.riskCategories.stress'), value: stressScore },
      { name: t('dashboard.riskCategories.anxiety'), value: 35 },
      { name: t('dashboard.riskCategories.depression'), value: 28 },
      { name: t('dashboard.riskCategories.burnout'), value: 38 },
      { name: t('dashboard.riskCategories.loneliness'), value: 22 },
    ],
    [t, stressScore]
  )

  return (
    <>
      <TopNav />
      <main className="flex-1 overflow-y-auto">
        <motion.div
          className="mx-auto max-w-6xl space-y-6 p-6 pb-24"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={slowTransition}
        >
          <div>
            <h1 className="font-display text-3xl text-foreground">{t('dashboard.title')}</h1>
            <p className="mt-2 text-muted">{t('dashboard.subtitle')}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted">
                  {t('dashboard.wellnessScore')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-peacock">{wellnessScore}</p>
                <Progress value={wellnessScore} className="mt-2" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted">
                  {t('dashboard.stressScore')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-turmeric">{stressScore}</p>
                <Progress value={stressScore} className="mt-2 [&>div]:bg-turmeric" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted">
                  {t('dashboard.recoveryProgress')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-dusk dark:text-ink-light">
                  {recoveryProgress}%
                </p>
                <Progress value={recoveryProgress} className="mt-2" />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{t('dashboard.charts.moodLine')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={moodTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={COLORS.peacockSoft} />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke={COLORS.peacock}
                      strokeWidth={2}
                      dot={{ fill: COLORS.turmeric, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('dashboard.charts.weeklyBar')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={activityData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={COLORS.peacockSoft} />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="value" fill={COLORS.turmeric} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>{t('dashboard.charts.riskPie')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={riskPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {riskPieData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card className="border-turmeric/30 bg-turmeric/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-turmeric" />
                {t('dashboard.insights.title')}
              </CardTitle>
              <p className="text-xs text-muted">{t('dashboard.insights.disclaimer')}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {INSIGHT_KEYS.map((key) => (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={slowTransition}
                  className="rounded-lg bg-paper p-3 text-sm dark:bg-surface"
                >
                  {t(key)}
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </>
  )
}
