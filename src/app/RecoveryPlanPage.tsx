import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { CheckCircle2, Circle } from 'lucide-react'
import { TopNav } from '@/components/TopNav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useWellnessStore } from '@/features/stores'
import { apiGetRecoveryPlan, apiToggleRecoveryActivity } from '@/lib/api'
import { cn } from '@/lib/utils'

const slowTransition = { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const }

export function RecoveryPlanPage() {
  const { t } = useTranslation()
  const { recoveryPlan, setRecoveryPlan } = useWellnessStore()
  const [loading, setLoading] = useState(!recoveryPlan)
  const [actingId, setActingId] = useState<string | null>(null)

  const loadPlan = async () => {
    setLoading(true)
    try {
      const plan = await apiGetRecoveryPlan()
      setRecoveryPlan(plan)
    } catch {
      toast.error(t('common.error'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!recoveryPlan) {
      void loadPlan()
      return
    }
    // Refresh once on open so repaired backend keys are applied.
    void apiGetRecoveryPlan()
      .then((plan) => setRecoveryPlan(plan))
      .catch(() => undefined)
  }, [])

  const currentDay = recoveryPlan?.currentDay ?? 1
  const dayPlan = recoveryPlan?.days.find((d) => d.day === currentDay)

  const activities = useMemo(() => dayPlan?.activities ?? [], [dayPlan])

  const localCompletion = useMemo(() => {
    if (!dayPlan) return 0
    if (activities.length === 0) return dayPlan.completedPercent ?? 0
    const done = activities.filter((a) => a.completed).length
    return Math.round((done / activities.length) * 100)
  }, [activities, dayPlan])

  const toggleActivity = async (id: string, checked: boolean) => {
    if (!recoveryPlan || !dayPlan) return
    setActingId(id)

    const previous = recoveryPlan
    const nextDays = recoveryPlan.days.map((d) => {
      if (d.day !== currentDay) return d
      const nextActivities = d.activities.map((a) =>
        a.id === id ? { ...a, completed: checked } : a
      )
      const done = nextActivities.filter((a) => a.completed).length
      const total = nextActivities.length
      return {
        ...d,
        activities: nextActivities,
        completedPercent: total > 0 ? Math.round((done / total) * 100) : 0,
      }
    })
    setRecoveryPlan({ ...recoveryPlan, days: nextDays })

    try {
      const result = await apiToggleRecoveryActivity(id, checked)
      const latest = useWellnessStore.getState().recoveryPlan ?? {
        ...recoveryPlan,
        days: nextDays,
      }
      setRecoveryPlan({
        ...latest,
        days: latest.days.map((d) =>
          d.day === currentDay
            ? { ...d, completedPercent: result.completedPercent ?? d.completedPercent }
            : d
        ),
      })
    } catch {
      setRecoveryPlan(previous)
      toast.error(t('common.error'))
    } finally {
      setActingId(null)
    }
  }

  if (loading && !recoveryPlan) {
    return (
      <>
        <TopNav />
        <main className="flex flex-1 items-center justify-center p-6">
          <p className="text-muted">{t('common.loading')}</p>
        </main>
      </>
    )
  }

  if (!recoveryPlan || !dayPlan) {
    return (
      <>
        <TopNav />
        <main className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
          <p className="text-muted">{t('recovery.empty')}</p>
          <Button onClick={loadPlan} disabled={loading}>
            {t('recovery.loadRetry')}
          </Button>
        </main>
      </>
    )
  }

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
            <h1 className="font-display text-3xl text-foreground">{t('recovery.title')}</h1>
            <p className="mt-2 text-muted">{t('recovery.subtitle')}</p>
          </div>

          <Card className="border-peacock/30 bg-peacock-soft/20 dark:bg-peacock/10">
            <CardHeader>
              <CardTitle className="text-peacock">{t('recovery.todayGoal')}</CardTitle>
              <p className="text-sm text-muted">
                {t('recovery.dayProgress', { day: currentDay })}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2">
                {dayPlan.goals.map((goalKey) => (
                  <li key={goalKey} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-peacock" />
                    {t(goalKey)}
                  </li>
                ))}
              </ul>
              <p className="rounded-lg bg-paper p-3 text-sm italic text-muted dark:bg-surface">
                {t(dayPlan.tipKey)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{t('recovery.completion')}</CardTitle>
              <span className="text-2xl font-bold text-turmeric">{localCompletion}%</span>
            </CardHeader>
            <CardContent>
              <Progress value={localCompletion} className="h-3" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('mood.habitTracker.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className={cn(
                    'flex items-center gap-3 rounded-xl border p-3 transition-all duration-300',
                    activity.completed
                      ? 'border-peacock/30 bg-peacock-soft/30 dark:bg-peacock/10'
                      : 'border-border'
                  )}
                >
                  <Checkbox
                    id={activity.id}
                    checked={activity.completed}
                    disabled={actingId === activity.id}
                    onCheckedChange={(v) => toggleActivity(activity.id, v === true)}
                  />
                  <Label htmlFor={activity.id} className="flex-1 cursor-pointer">
                    {t(activity.labelKey)}
                  </Label>
                  {activity.completed ? (
                    <CheckCircle2 className="h-5 w-5 text-peacock" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted" />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="grid grid-cols-6 gap-1 sm:grid-cols-10">
            {recoveryPlan.days.slice(0, 30).map((d) => (
              <div
                key={d.day}
                className={cn(
                  'flex aspect-square items-center justify-center rounded-md text-xs font-medium transition-colors',
                  d.day === currentDay
                    ? 'bg-turmeric text-dusk'
                    : d.completedPercent >= 80
                      ? 'bg-dusk/80 text-white'
                      : d.completedPercent >= 40
                        ? 'bg-turmeric/40 text-dusk'
                        : 'bg-mist text-muted dark:bg-dusk-2'
                )}
                title={t('recovery.dayProgress', { day: d.day })}
              >
                {d.day}
              </div>
            ))}
          </div>
        </motion.div>
      </main>
    </>
  )
}
