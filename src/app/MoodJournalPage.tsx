import { useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { TopNav } from '@/components/TopNav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { useAuthStore, useWellnessStore } from '@/features/stores'
import { apiSaveMoodEntry } from '@/lib/api'
import { cn } from '@/lib/utils'

const EMOTION_KEYS = [
  'happy',
  'sad',
  'anxious',
  'calm',
  'angry',
  'tired',
  'hopeful',
  'lonely',
  'content',
  'neutral',
  'energetic',
  'stressed',
] as const

const slowTransition = { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const }

export function MoodJournalPage() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const { moodEntries, addMoodEntry } = useWellnessStore()
  const today = new Date().toISOString().split('T')[0]!
  const existing = moodEntries.find((e) => e.date === today)

  const [moodScore, setMoodScore] = useState(existing?.moodScore ?? 5)
  const [emotions, setEmotions] = useState<string[]>(existing?.emotions ?? [])
  const [note, setNote] = useState(existing?.note ?? '')
  const [sleep, setSleep] = useState(existing?.sleep ?? 7)
  const [hydration, setHydration] = useState(existing?.hydration ?? 5)
  const [exercise, setExercise] = useState(existing?.exercise ?? false)
  const [meditation, setMeditation] = useState(existing?.meditation ?? false)
  const [gratitude, setGratitude] = useState(existing?.gratitude ?? '')
  const [reflection, setReflection] = useState(existing?.reflection ?? '')
  const [saving, setSaving] = useState(false)

  const toggleEmotion = (key: string) => {
    setEmotions((prev) =>
      prev.includes(key) ? prev.filter((e) => e !== key) : [...prev, key]
    )
  }

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    try {
      const entry = await apiSaveMoodEntry({
        userId: user.id,
        date: today,
        moodScore,
        emotions,
        note: note || undefined,
        sleep,
        hydration,
        exercise,
        meditation,
        gratitude: gratitude || undefined,
        reflection: reflection || undefined,
      })
      addMoodEntry(entry)
      toast.success(t('common.success'))
    } catch {
      toast.error(t('common.error'))
    } finally {
      setSaving(false)
    }
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
            <h1 className="font-display text-3xl text-foreground">{t('mood.journal.title')}</h1>
            <p className="mt-2 text-muted">{t('mood.journal.subtitle')}</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t('mood.score.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm text-muted">
                <span>{t('mood.score.low')}</span>
                <span className="text-2xl font-semibold text-peacock">{moodScore}</span>
                <span>{t('mood.score.high')}</span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                value={moodScore}
                onChange={(e) => setMoodScore(Number(e.target.value))}
                className="h-2 w-full cursor-pointer accent-peacock"
                aria-label={t('mood.score.title')}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('mood.emotions.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {EMOTION_KEYS.map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleEmotion(key)}
                    className={cn(
                      'rounded-full border px-3 py-1.5 text-sm transition-all duration-300',
                      emotions.includes(key)
                        ? 'border-peacock bg-peacock-soft text-peacock dark:bg-peacock/20'
                        : 'border-border bg-paper hover:border-turmeric dark:bg-surface'
                    )}
                  >
                    {t(`mood.emotions.${key}`)}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('mood.trackers.sleep.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Label>{t('mood.trackers.sleep.label')}</Label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={12}
                  value={sleep}
                  onChange={(e) => setSleep(Number(e.target.value))}
                  className="flex-1 accent-turmeric"
                  aria-label={t('mood.trackers.sleep.title')}
                />
                <span className="w-16 text-right text-sm font-medium">
                  {sleep} {t('mood.trackers.sleep.hours')}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('mood.trackers.hydration.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Label>{t('mood.trackers.hydration.label')}</Label>
              <input
                type="range"
                min={0}
                max={10}
                value={hydration}
                onChange={(e) => setHydration(Number(e.target.value))}
                className="w-full accent-peacock"
                aria-label={t('mood.trackers.hydration.title')}
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4 pt-6">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="exercise"
                  checked={exercise}
                  onCheckedChange={(v) => setExercise(v === true)}
                />
                <Label htmlFor="exercise">{t('mood.trackers.exercise.label')}</Label>
              </div>
              <div className="flex items-center gap-3">
                <Checkbox
                  id="meditation"
                  checked={meditation}
                  onCheckedChange={(v) => setMeditation(v === true)}
                />
                <Label htmlFor="meditation">{t('mood.trackers.meditation.label')}</Label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('mood.trackers.gratitude.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <Label htmlFor="gratitude">{t('mood.trackers.gratitude.label')}</Label>
              <Textarea
                id="gratitude"
                value={gratitude}
                onChange={(e) => setGratitude(e.target.value)}
                placeholder={t('mood.trackers.gratitude.placeholder')}
                className="mt-2"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('mood.trackers.reflection.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <Label htmlFor="reflection">{t('mood.trackers.reflection.label')}</Label>
              <Textarea
                id="reflection"
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                placeholder={t('mood.trackers.reflection.placeholder')}
                className="mt-2"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('mood.journal.todayEntry')}</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t('mood.journal.notePlaceholder')}
              />
            </CardContent>
          </Card>

          <Button
            className="w-full bg-peacock hover:bg-peacock/90"
            onClick={handleSave}
            disabled={saving}
          >
            {t('mood.journal.saveEntry')}
          </Button>
        </motion.div>
      </main>
    </>
  )
}
