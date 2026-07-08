import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { Dumbbell, ChevronRight, Phone, Star } from 'lucide-react'
import { MindGymBetaFeedback } from '@/components/mind-gym/MindGymBetaFeedback'
import { TopNav } from '@/components/TopNav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { useAppStore } from '@/features/stores'
import {
  apiGetMindGymScenarios,
  apiGetMindGymProgress,
  apiGetMindGymAnalytics,
  apiGetMindGymIntake,
  apiMindGymRecommend,
  apiStartMindGymSession,
  apiMindGymStoryTurn,
  apiMindGymReflect,
} from '@/lib/api'
import type {
  MindGymScenario,
  MindGymSessionState,
  MindGymProgress,
  MindGymIntake,
  MindGymScenarioProfile,
  MindGymStoryBeat,
} from '@/types'
import { EMERGENCY_RESOURCES } from '@/lib/assessment-data'

const MindGym3DScene = lazy(() =>
  import('@/components/mind-gym/MindGym3DScene').then((m) => ({ default: m.MindGym3DScene }))
)

const slowTransition = { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const }

export function MindGymPage() {
  const { t, i18n } = useTranslation()
  const { language } = useAppStore()
  const useBn = (language ?? i18n.language) !== 'en'

  const [scenarios, setScenarios] = useState<MindGymScenario[]>([])
  const [progress, setProgress] = useState<MindGymProgress[]>([])
  const [intake, setIntake] = useState<MindGymIntake | null>(null)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [step, setStep] = useState(0)
  const [phase, setPhase] = useState<'welcome' | 'intake' | 'match' | 'play' | 'list'>('welcome')
  const [match, setMatch] = useState<{
    scenarioId: string
    title: string
    setting: string
    rationale: string
    profile?: MindGymScenarioProfile
    openingBeat?: MindGymStoryBeat
  } | null>(null)
  const [session, setSession] = useState<MindGymSessionState | null>(null)
  const [storyBeat, setStoryBeat] = useState<MindGymStoryBeat | null>(null)
  const [userReply, setUserReply] = useState('')
  const [reflection, setReflection] = useState('')
  const [moodBefore, setMoodBefore] = useState(5)
  const [moodAfter, setMoodAfter] = useState(5)
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)
  const [showBeta, setShowBeta] = useState(false)
  const [analytics, setAnalytics] = useState<{
    totalSessions: number
    uniqueUsers: number
    avgOverallScore: number
    completionRate: number
    betaFeedbackCount: number
    corpusNote?: string
    protocol?: { version: string; status: string }
  } | null>(null)

  const question = useMemo(
    () => (intake ? intake.questions[step] : null),
    [intake, step]
  )

  const load = async () => {
    try {
      const [s, p, a, q] = await Promise.all([
        apiGetMindGymScenarios(),
        apiGetMindGymProgress(),
        apiGetMindGymAnalytics().catch(() => null),
        apiGetMindGymIntake().catch(() => null),
      ])
      setScenarios(s)
      setProgress(p)
      if (q) setIntake(q)
      if (a) {
        setAnalytics({
          totalSessions: a.totalSessions,
          uniqueUsers: a.uniqueUsers,
          avgOverallScore: a.avgOverallScore,
          completionRate: a.completionRate,
          betaFeedbackCount: a.betaFeedbackCount,
          corpusNote: a.corpusNote,
          protocol: a.protocol,
        })
      }
    } catch {
      toast.error(t('common.error'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const answerCurrent = async (optionId: string) => {
    if (!intake || !question) return
    const nextAnswers = { ...answers, [question.id]: optionId }
    setAnswers(nextAnswers)

    if (step < intake.questions.length - 1) {
      setStep((s) => s + 1)
      return
    }

    setActing(true)
    try {
      const rec = await apiMindGymRecommend(nextAnswers)
      setScenarios(rec.scenarios)
      setMatch({
        scenarioId: rec.scenarioId,
        title: rec.title,
        setting: rec.setting,
        rationale: rec.rationale,
        profile: rec.profile,
        openingBeat: rec.openingBeat,
      })
      setPhase('match')
    } catch {
      toast.error(t('common.error'))
      setPhase('list')
    } finally {
      setActing(false)
    }
  }

  const startScenario = async (scenarioId: string) => {
    setActing(true)
    try {
      const s = await apiStartMindGymSession(scenarioId, moodBefore, useBn ? 'bn' : 'en')
      setSession(s)
      setUserReply('')
      setStoryBeat(
        s.storyBeat ??
          match?.openingBeat ?? {
            narration: s.sceneText ?? s.scenario.setting,
            askPrompt: useBn
              ? 'এই পরিস্থিতিতে তোমার কাছে সবচেয়ে কোন দিকটা স্পষ্ট মনে হচ্ছে?'
              : 'What stands out to you most in this situation?',
            imageUrl: `/images/mind-gym/${s.scenario.category === 'interview' ? 'interview' : s.scenario.category}.jpg`,
            turn: 0,
            isComplete: false,
            emotion_tag: 'reflective',
            questionNumber: 1,
            targetQuestions: 10,
          }
      )
      setPhase('play')
    } catch {
      toast.error(t('common.error'))
    } finally {
      setActing(false)
    }
  }

  const submitStory = async () => {
    if (!session || !userReply.trim()) return
    setActing(true)
    try {
      const s = await apiMindGymStoryTurn(session.sessionId, userReply.trim(), useBn ? 'bn' : 'en')
      setSession(s)
      if (s.storyBeat) setStoryBeat(s.storyBeat)
      setUserReply('')
    } catch {
      toast.error(t('common.error'))
    } finally {
      setActing(false)
    }
  }

  const submitReflection = async () => {
    if (!session) return
    setActing(true)
    try {
      const note = reflection.trim() || (useBn
        ? 'সেশন সম্পন্ন। প্রতিফলন সারাংশ চাই।'
        : 'Session complete. Please share the reflective summary.')
      const s = await apiMindGymReflect(session.sessionId, note, moodAfter)
      setSession(s)
      await load()
      setShowBeta(true)
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
    setShowBeta(false)
    setStoryBeat(null)
    setUserReply('')
    setPhase('list')
  }

  const goToScenarioList = async () => {
    setActing(true)
    try {
      setMatch(null)
      setSession(null)
      setStoryBeat(null)
      setUserReply('')
      setReflection('')
      const s = await apiGetMindGymScenarios()
      setScenarios(s)
      setPhase('list')
      if (s.length === 0) {
        toast.error(useBn ? 'এখন কোনো সিনারিও পাওয়া যায়নি।' : 'No scenarios available right now.')
      }
    } catch {
      toast.error(t('common.error'))
    } finally {
      setActing(false)
    }
  }

  const restartIntake = () => {
    setAnswers({})
    setStep(0)
    setMatch(null)
    setSession(null)
    setStoryBeat(null)
    setUserReply('')
    setPhase('welcome')
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

  if (phase === 'welcome') {
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
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-dusk text-ink-light">
                <Dumbbell className="h-6 w-6" />
              </div>
              <div>
                <h1 className="font-display text-3xl text-foreground">{t('mindGym.title')}</h1>
                <p className="text-muted">{t('mindGym.subtitle')}</p>
              </div>
            </div>
            <Card className="border-turmeric/40">
              <CardContent className="space-y-4 p-6">
                <p className="font-display text-xl text-foreground">
                  {useBn
                    ? (intake?.welcomeBn ?? 'আজ আপনি কোন ধরনের পরিস্থিতির অনুশীলন করতে চান?')
                    : (intake?.welcomeEn ?? 'Which situation do you want to practice today?')}
                </p>
                <p className="text-sm text-muted">{intake?.intro}</p>
                <Button className="w-full" onClick={() => setPhase('intake')}>
                  {t('mindGym.startWithQuestions')}
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  disabled={acting}
                  onClick={goToScenarioList}
                >
                  {t('mindGym.skipToList')}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </main>
      </>
    )
  }

  if (phase === 'intake' && intake && question) {
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
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-dusk text-ink-light">
                <Dumbbell className="h-6 w-6" />
              </div>
              <div>
                <h1 className="font-display text-3xl text-foreground">{t('mindGym.title')}</h1>
                <p className="text-muted">{t('mindGym.intakeTitle')}</p>
              </div>
            </div>

            <Card>
              <CardContent className="space-y-4 p-5">
                <Progress value={((step + 1) / intake.questions.length) * 100} className="h-2" />
                <p className="text-xs text-muted">
                  {t('mindGym.questionOf', { current: step + 1, total: intake.questions.length })}
                </p>
                <h2 className="font-display text-xl text-foreground">
                  {useBn ? question.promptBn : question.promptEn}
                </h2>
                <div className="space-y-2">
                  {question.options.map((opt) => (
                    <Button
                      key={opt.id}
                      variant="outline"
                      className="h-auto w-full justify-start whitespace-normal py-3 text-left"
                      disabled={acting}
                      onClick={() => answerCurrent(opt.id)}
                    >
                      {useBn ? opt.labelBn : opt.labelEn}
                      <ChevronRight className="ml-auto h-4 w-4 shrink-0" />
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-muted">{useBn ? intake.safeNoteBn : intake.safeNoteEn}</p>
              </CardContent>
            </Card>
          </motion.div>
        </main>
      </>
    )
  }

  if (phase === 'match' && match) {
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
            <Card className="border-turmeric/40">
              <CardHeader>
                <CardTitle className="text-lg">{t('mindGym.matchedTitle')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {match.profile && (
                  <div className="rounded-xl bg-peacock-soft/40 p-4 text-sm space-y-1">
                    <p className="font-medium">{t('mindGym.userProfile')}</p>
                    <p><span className="text-muted">Problem:</span> {match.profile.problem}</p>
                    <p><span className="text-muted">Difficulty:</span> {match.profile.difficulty}</p>
                    <p><span className="text-muted">Goal:</span> {match.profile.goal}</p>
                  </div>
                )}
                <Suspense fallback={<div className="h-36 animate-pulse rounded-lg bg-dusk/40" />}>
                  <MindGym3DScene
                    label={t('mindGym.sceneImage')}
                    category={match.profile?.problem?.toLowerCase().includes('presentation') ? 'presentation' : 'exam'}
                    imageUrl={match.profile?.imageUrl || match.openingBeat?.imageUrl}
                  />
                </Suspense>
                <p className="leading-relaxed text-foreground">{match.rationale}</p>
                <div className="rounded-xl bg-peacock-soft/40 p-4">
                  <p className="font-medium">{match.title}</p>
                  <p className="mt-1 text-sm text-muted">{match.openingBeat?.narration ?? match.setting}</p>
                </div>
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
                <Button className="w-full" disabled={acting} onClick={() => startScenario(match.scenarioId)}>
                  {t('mindGym.startSimulator')}
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  disabled={acting}
                  onClick={goToScenarioList}
                >
                  {t('mindGym.pickOther')}
                </Button>
                <Button variant="ghost" className="w-full" onClick={restartIntake}>
                  {t('mindGym.retakeIntake')}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </main>
      </>
    )
  }

  if (session && phase === 'play') {
    const beat = storyBeat
    const showClosingNote = session.isComplete && !session.feedback
    const isOpeningTurn = (beat?.turn ?? 0) === 0
    const questionNumber = beat?.questionNumber ?? Math.max(1, (beat?.turn ?? 0) + (isOpeningTurn ? 1 : 0))
    const targetQuestions = beat?.targetQuestions ?? 10
    const scenarioStory = isOpeningTurn
      ? (beat?.narration ?? session.sceneText ?? session.scenario.setting)
      : null
    const acknowledgement = !isOpeningTurn && !session.isComplete
      ? (beat?.dialogue || beat?.narration || null)
      : (!session.isComplete ? null : (beat?.dialogue || beat?.narration || null))

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
            <div className="flex items-center justify-between gap-3">
              <div>
                <h1 className="font-display text-2xl text-foreground">{session.scenario.title}</h1>
                {!session.isComplete && (
                  <p className="text-sm text-muted">
                    {t('mindGym.questionProgress', {
                      current: questionNumber,
                      total: targetQuestions,
                    })}
                  </p>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={exitSession}>
                {t('common.back')}
              </Button>
            </div>

            <p className="text-sm leading-relaxed text-muted">{t('mindGym.reflectiveDisclaimer')}</p>

            <Card className="border-peacock/30 bg-gradient-to-br from-peacock-soft/40 to-transparent">
              <CardContent className="space-y-3 p-4">
                <Suspense fallback={<div className="h-36 animate-pulse rounded-lg bg-dusk/40 sm:h-40" />}>
                  <MindGym3DScene
                    label={t('mindGym.sceneImage')}
                    category={session.scenario.category}
                    npcEmotion={beat?.emotion_tag}
                    imageUrl={beat?.imageUrl}
                  />
                </Suspense>
                {scenarioStory && (
                  <p className="text-base leading-relaxed text-foreground whitespace-pre-wrap">
                    {scenarioStory}
                  </p>
                )}
                {acknowledgement && (
                  <div className="rounded-lg bg-background/70 p-3 space-y-1">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted">
                      {t('mindGym.acknowledgementLabel')}
                    </p>
                    <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                      {acknowledgement}
                    </p>
                  </div>
                )}
                {!session.isComplete && beat?.askPrompt && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted">
                      {t('mindGym.reflectiveQuestion')}
                    </p>
                    <p className="text-base font-medium leading-relaxed text-foreground">
                      {beat.askPrompt}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {!session.isComplete && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t('mindGym.yourResponse')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Textarea
                    value={userReply}
                    onChange={(e) => setUserReply(e.target.value)}
                    placeholder={t('mindGym.responsePlaceholder')}
                    rows={4}
                  />
                  <Button disabled={acting || !userReply.trim()} onClick={submitStory} className="w-full">
                    {t('mindGym.sendResponse')}
                  </Button>
                </CardContent>
              </Card>
            )}

            {showClosingNote && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t('mindGym.reflectionTitle')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {acknowledgement && (
                    <p className="rounded-lg bg-background/70 p-3 text-sm leading-relaxed text-foreground">
                      {acknowledgement}
                    </p>
                  )}
                  <Textarea
                    value={reflection}
                    onChange={(e) => setReflection(e.target.value)}
                    placeholder={t('mindGym.reflectionPlaceholder')}
                    rows={3}
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
                  {session.safetyLevel && session.safetyLevel !== 'none' && (
                    <div className="rounded-xl border border-alert/30 bg-alert-soft p-4 dark:bg-alert/10">
                      <p className="mb-3 text-sm font-medium text-alert">{t('chat.safety.title')}</p>
                      <p className="mb-3 text-sm text-muted">{t('chat.safety.description')}</p>
                      <div className="flex flex-wrap gap-2">
                        {EMERGENCY_RESOURCES.slice(0, 2).map((r) => (
                          <Button key={r.id} asChild size="sm" variant="destructive">
                            <a href={`tel:${r.phone}`}>
                              <Phone className="h-3 w-3" />
                              {t(r.nameKey)} — {r.phone}
                            </a>
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                  <p className="leading-relaxed whitespace-pre-wrap">{session.feedback}</p>
                  <p className="text-sm text-muted">{t('mindGym.reflectiveDisclaimer')}</p>
                  <Button variant="outline" className="w-full" onClick={exitSession}>
                    {t('mindGym.backToList')}
                  </Button>
                  <Button variant="ghost" className="w-full" onClick={restartIntake}>
                    {t('mindGym.retakeIntake')}
                  </Button>
                  {showBeta && (
                    <MindGymBetaFeedback
                      scenarioTitle={session.scenario.title}
                      onDone={() => setShowBeta(false)}
                    />
                  )}
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

          <Button onClick={restartIntake}>{t('mindGym.startWithQuestions')}</Button>

          {analytics && (
            <Card className="border-peacock/30">
              <CardHeader>
                <CardTitle className="text-lg">{t('mindGym.betaStats')}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
                <p>
                  <span className="text-muted">{t('mindGym.statSessions')}: </span>
                  {analytics.totalSessions}
                </p>
                <p>
                  <span className="text-muted">{t('mindGym.statUsers')}: </span>
                  {analytics.uniqueUsers}
                </p>
                <p>
                  <span className="text-muted">{t('mindGym.statAvg')}: </span>
                  {analytics.avgOverallScore}/10
                </p>
                <p>
                  <span className="text-muted">{t('mindGym.statCompletion')}: </span>
                  {analytics.completionRate}%
                </p>
              </CardContent>
            </Card>
          )}

          {progress.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('mindGym.skillsTitle')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {progress.map((p) => {
                  const xpIntoLevel = p.xp % 200
                  const pct = Math.min(100, (xpIntoLevel / 200) * 100)
                  return (
                    <div key={p.category} className="rounded-xl border border-border/60 p-3">
                      <div className="mb-2 flex justify-between text-sm">
                        <span className="font-medium capitalize">
                          {p.category.replace('_', ' ')}
                        </span>
                        <span className="text-muted">
                          {t('mindGym.level')} {p.currentLevel} · {p.sessionsCompleted}{' '}
                          {t('mindGym.sessions')}
                        </span>
                      </div>
                      <Progress value={pct} className="h-2" />
                    </div>
                  )
                })}
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
            {scenarios.length === 0 ? (
              <Card>
                <CardContent className="space-y-3 p-5">
                  <p className="text-sm text-muted">
                    {useBn
                      ? 'এখন কোনো সিনারিও লোড হয়নি। আবার চেষ্টা করো।'
                      : 'No scenarios loaded yet. Please try again.'}
                  </p>
                  <Button variant="outline" disabled={acting} onClick={goToScenarioList}>
                    {t('common.retry', { defaultValue: useBn ? 'আবার চেষ্টা' : 'Retry' })}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              scenarios.map((s) => (
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
                      <p className="text-sm text-muted">{useBn ? s.settingBn : s.settingEn}</p>
                      <p className="text-xs text-muted">
                        {s.difficulty} · {s.durationMinutes} {t('mindGym.minutes')}
                      </p>
                    </div>
                    <Button disabled={acting} onClick={() => startScenario(s.id)}>
                      {t('mindGym.start')}
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </motion.div>
      </main>
    </>
  )
}
