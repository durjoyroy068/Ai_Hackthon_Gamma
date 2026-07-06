import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { Dumbbell, Star, ChevronRight } from 'lucide-react'
import { TopNav } from '@/components/TopNav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { useAppStore } from '@/features/stores'
import {
  apiGetMindGymScenarios,
  apiGetMindGymProgress,
  apiStartMindGymSession,
  apiMindGymChoose,
  apiMindGymReflect,
} from '@/lib/api'
import type { MindGymScenario, MindGymSessionState, MindGymProgress } from '@/types'

const slowTransition = { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const }

export function MindGymPage() {
  const { t, i18n } = useTranslation()
  const { language } = useAppStore()
  const useBn = (language ?? i18n.language) !== 'en'

  const [scenarios, setScenarios] = useState<MindGymScenario[]>([])
  const [progress, setProgress] = useState<MindGymProgress[]>([])
  const [session, setSession] = useState<MindGymSessionState | null>(null)
  const [reflection, setReflection] = useState('')
  const [moodBefore, setMoodBefore] = useState(5)
  const [moodAfter, setMoodAfter] = useState(5)
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)

  const load = async () => {
    try {
      const [s, p] = await Promise.all([apiGetMindGymScenarios(), apiGetMindGymProgress()])
      setScenarios(s)
      setProgress(p)
    } catch {
      toast.error(t('common.error'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const startScenario = async (scenario: MindGymScenario) => {
    setActing(true)
    try {
      const s = await apiStartMindGymSession(scenario.id, moodBefore)
      setSession(s)
    } catch {
      toast.error(t('common.error'))
    } finally {
      setActing(false)
    }
  }

  const pickChoice = async (choiceId: string) => {
    if (!session) return
    setActing(true)
    try {
      const s = await apiMindGymChoose(session.sessionId, choiceId)
      setSession(s)
    } catch {
      toast.error(t('common.error'))
    } finally {
      setActing(false)
    }
  }

  const submitReflection = async () => {
    if (!session || !reflection.trim()) return
    setActing(true)
    try {
      const s = await apiMindGymReflect(session.sessionId, reflection.trim(), moodAfter)
      setSession(s)
      await load()
      toast.success(t('mindGym.complete'))
    } catch {
      toast.error(t('common.error'))
    } finally {
      setActing(false)
    }
  }

  const exitSession = () => {
    setSession(null)
    setReflection('')
  }

  if (loading) {
    return (
      <>
        <TopNav />
        <main className="flex flex-1 items-center justify-center p-6">
          <p className="text-muted">{t('common.loading')}</p>
        </main>
      </>
    )
  }

  if (session) {
    return (
      <>
        <TopNav />
        <main className="flex-1 overflow-y-auto">
          <motion.div
            className="mx-auto max-w-2xl space-y-6 p-6 pb-24"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={slowTransition}
          >
            <div className="flex items-center justify-between">
              <h1 className="font-display text-2xl text-foreground">{session.scenario.title}</h1>
              <Button variant="ghost" size="sm" onClick={exitSession}>
                {t('common.back')}
              </Button>
            </div>

            <Card className="border-peacock/30 bg-gradient-to-br from-peacock-soft/40 to-transparent">
              <CardContent className="space-y-4 p-6">
                <p className="text-sm text-muted">{session.scenario.setting}</p>
                {session.sceneText && (
                  <p className="text-base leading-relaxed text-foreground">{session.sceneText}</p>
                )}
              </CardContent>
            </Card>

            {!session.isComplete && session.choices.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm font-medium text-muted">{t('mindGym.chooseAction')}</p>
                {session.choices.map((c) => (
                  <Button
                    key={c.id}
                    variant="outline"
                    className="h-auto w-full justify-start whitespace-normal py-3 text-left"
                    disabled={acting}
                    onClick={() => pickChoice(c.id)}
                  >
                    {c.text}
                    <ChevronRight className="ml-auto h-4 w-4 shrink-0" />
                  </Button>
                ))}
              </div>
            )}

            {session.isComplete && !session.feedback && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t('mindGym.reflectionTitle')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    value={reflection}
                    onChange={(e) => setReflection(e.target.value)}
                    placeholder={t('mindGym.reflectionPlaceholder')}
                    rows={4}
                  />
                  <div>
                    <label className="text-sm text-muted">{t('mindGym.moodAfter')}</label>
                    <input
                      type="range"
                      min={1}
                      max={10}
                      value={moodAfter}
                      onChange={(e) => setMoodAfter(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <Button className="w-full" disabled={acting} onClick={submitReflection}>
                    {t('mindGym.getFeedback')}
                  </Button>
                </CardContent>
              </Card>
            )}

            {session.feedback && (
              <Card className="border-turmeric/30">
                <CardHeader>
                  <CardTitle className="text-lg">{t('mindGym.feedbackTitle')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="leading-relaxed">{session.feedback}</p>
                  {session.scores.overall != null && (
                    <div className="rounded-xl bg-peacock-soft/50 p-4">
                      <p className="text-sm text-muted">{t('mindGym.sessionScore')}</p>
                      <p className="font-display text-3xl text-peacock">{session.scores.overall}/10</p>
                    </div>
                  )}
                  <Button variant="outline" className="w-full" onClick={exitSession}>
                    {t('mindGym.backToList')}
                  </Button>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </main>
      </>
    )
  }

  return (
    <>
      <TopNav />
      <main className="flex-1 overflow-y-auto">
        <motion.div
          className="mx-auto max-w-3xl space-y-6 p-6 pb-24"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={slowTransition}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-dusk text-ink-light">
              <Dumbbell className="h-6 w-6" />
            </div>
            <div>
              <h1 className="font-display text-3xl text-foreground">{t('mindGym.title')}</h1>
              <p className="text-muted">{t('mindGym.subtitle')}</p>
            </div>
          </div>

          {progress.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('mindGym.progress')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {progress.map((p) => (
                  <div key={p.category}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="capitalize">{p.category.replace('_', ' ')}</span>
                      <span>
                        {t('mindGym.level')} {p.currentLevel} · {p.sessionsCompleted}{' '}
                        {t('mindGym.sessions')}
                      </span>
                    </div>
                    <Progress value={Math.min(100, (p.xp % 200) / 2)} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <div>
            <label className="mb-2 block text-sm text-muted">{t('mindGym.moodBefore')}</label>
            <input
              type="range"
              min={1}
              max={10}
              value={moodBefore}
              onChange={(e) => setMoodBefore(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="space-y-3">
            <h2 className="font-display text-xl">{t('mindGym.scenarios')}</h2>
            {scenarios.map((s) => (
              <Card
                key={s.id}
                className={s.recommended ? 'border-turmeric/50 ring-1 ring-turmeric/20' : ''}
              >
                <CardContent className="flex items-start justify-between gap-4 p-5">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-medium text-foreground">
                        {useBn ? s.titleBn : s.titleEn}
                      </h3>
                      {s.recommended && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-turmeric/15 px-2 py-0.5 text-xs font-medium text-turmeric-deep">
                          <Star className="h-3 w-3" />
                          {t('mindGym.recommended')}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted">
                      {useBn ? s.settingBn : s.settingEn}
                    </p>
                    <p className="text-xs text-muted">
                      {s.difficulty} · {s.durationMinutes} {t('mindGym.minutes')}
                    </p>
                  </div>
                  <Button disabled={acting} onClick={() => startScenario(s)}>
                    {t('mindGym.start')}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>
      </main>
    </>
  )
}
