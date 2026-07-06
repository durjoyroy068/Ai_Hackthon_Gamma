import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { TopNav } from '@/components/TopNav'
import { AlponaThread } from '@/components/AlponaThread'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuthStore, useWellnessStore } from '@/features/stores'
import {
  getQuestionsForScale,
  getScalesForAgeBand,
  RESPONSE_OPTIONS,
  calculateRiskLevel,
} from '@/lib/assessment-data'
import { apiSubmitAssessment } from '@/lib/api'
import type { AssessmentResult, ScaleType } from '@/types'
import { cn } from '@/lib/utils'

const slowTransition = { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const }

export function AssessmentPage() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const { addAssessment } = useWellnessStore()

  const scales = useMemo(
    () => getScalesForAgeBand(user?.ageBand ?? '25+'),
    [user?.ageBand]
  )
  const [scaleType, setScaleType] = useState<ScaleType>(scales[0] ?? 'PHQ-9')
  const questions = useMemo(() => getQuestionsForScale(scaleType), [scaleType])
  const [step, setStep] = useState(0)
  const [responses, setResponses] = useState<Record<string, number>>({})
  const [result, setResult] = useState<AssessmentResult | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const currentQuestion = questions[step]
  const progress = questions.length > 0 ? ((step + 1) / questions.length) * 100 : 0
  const isComplete = step >= questions.length

  const handleAnswer = (value: number) => {
    if (!currentQuestion) return
    const updated = { ...responses, [currentQuestion.id]: value }
    setResponses(updated)
    if (step + 1 >= questions.length) {
      finishAssessment(updated)
    } else {
      setStep((s) => s + 1)
    }
  }

  const finishAssessment = async (finalResponses: Record<string, number>) => {
    if (!user) return
    setSubmitting(true)
    const totalScore = Object.values(finalResponses).reduce((a, b) => a + b, 0)
    const riskLevel = calculateRiskLevel(scaleType, totalScore)
    const summaryKey = `assessment.summary.${riskLevel}`

    try {
      const assessment = await apiSubmitAssessment({
        userId: user.id,
        scaleType,
        responses: finalResponses,
        totalScore,
        riskLevel,
        mindDialogueSummary: summaryKey,
      })
      addAssessment(assessment)
      setResult(assessment)
      setStep(questions.length)
    } finally {
      setSubmitting(false)
    }
  }

  const handleRetake = () => {
    setStep(0)
    setResponses({})
    setResult(null)
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
            <h1 className="font-display text-3xl text-foreground">{t('assessment.title')}</h1>
            <p className="mt-2 text-muted">{t('assessment.subtitle')}</p>
          </div>

          {scales.length > 1 && !result && (
            <div className="flex flex-wrap gap-2">
              {scales.map((scale) => (
                <Button
                  key={scale}
                  variant={scaleType === scale ? 'default' : 'outline'}
                  size="sm"
                  className={scaleType === scale ? 'bg-peacock hover:bg-peacock/90' : ''}
                  onClick={() => {
                    setScaleType(scale)
                    setStep(0)
                    setResponses({})
                  }}
                >
                  {t(`assessment.${scale === 'PHQ-9' ? 'phq9' : scale === 'GAD-7' ? 'gad7' : scale === 'PHQ-A' ? 'phqa' : 'rcads'}.title`)}
                </Button>
              ))}
            </div>
          )}

          {!result && (
            <>
              <AlponaThread variant="progress" progress={progress} dotCount={questions.length} />
              <p className="text-center text-sm text-muted">
                {t('assessment.progress', { current: Math.min(step + 1, questions.length), total: questions.length })}
              </p>
            </>
          )}

          <AnimatePresence mode="wait">
            {result ? (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={slowTransition}
                className="space-y-6"
              >
                <Card>
                  <CardHeader>
                    <CardTitle>{t('assessment.results.title')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted">{t('assessment.results.disclaimer')}</p>
                    <p className="text-lg">
                      {t('assessment.results.score')}:{' '}
                      <span className="font-semibold text-peacock">{result.totalScore}</span>
                    </p>

                    <div
                      className={cn(
                        'rounded-xl border p-4',
                        result.riskLevel === 'high' && 'border-alert bg-alert-soft/30',
                        result.riskLevel === 'moderate' && 'border-turmeric bg-turmeric/10',
                        result.riskLevel === 'mild' && 'border-turmeric/50 bg-turmeric/5',
                        result.riskLevel === 'minimal' && 'border-peacock bg-peacock-soft/30'
                      )}
                    >
                      <h3 className="font-semibold">
                        {t(`assessment.results.${result.riskLevel}.title`)}
                      </h3>
                      <p className="mt-1 text-sm text-muted">
                        {t(`assessment.results.${result.riskLevel}.description`)}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-peacock/30 bg-peacock-soft/20 dark:bg-peacock/10">
                  <CardHeader>
                    <CardTitle className="text-peacock">
                      {t('assessment.mindDialogueSummary.title')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed">{t(result.mindDialogueSummary)}</p>
                  </CardContent>
                </Card>

                {(result.riskLevel === 'moderate' || result.riskLevel === 'high') && (
                  <Card>
                    <CardHeader>
                      <CardTitle>{t('assessment.referral.title')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted">{t('assessment.referral.message')}</p>
                      <div className="flex flex-wrap gap-2">
                        <Button asChild variant="secondary">
                          <Link to="/emergency">{t('assessment.referral.helpline')}</Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Button variant="outline" onClick={handleRetake} className="w-full">
                  {t('assessment.retake')}
                </Button>
              </motion.div>
            ) : isComplete ? (
              <motion.div key="loading" className="py-12 text-center text-muted">
                {submitting ? t('common.loading') : t('common.loading')}
              </motion.div>
            ) : currentQuestion ? (
              <motion.div
                key={currentQuestion.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={slowTransition}
              >
                <Card>
                  <CardHeader>
                    <p className="text-sm text-muted">{t('assessment.intro')}</p>
                    <CardTitle className="text-lg leading-relaxed">
                      {t(currentQuestion.textKey)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {RESPONSE_OPTIONS.map((opt) => (
                      <Button
                        key={opt.value}
                        variant="outline"
                        className="h-auto w-full justify-start whitespace-normal py-3 text-left hover:border-peacock hover:bg-peacock-soft dark:hover:bg-peacock/10"
                        onClick={() => handleAnswer(opt.value)}
                        disabled={submitting}
                      >
                        {t(opt.labelKey)}
                      </Button>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </motion.div>
      </main>
    </>
  )
}
