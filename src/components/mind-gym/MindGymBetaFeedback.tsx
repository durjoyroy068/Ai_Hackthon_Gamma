import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { apiSubmitFeedback } from '@/lib/api'

interface MindGymBetaFeedbackProps {
  scenarioTitle: string
  onDone: () => void
}

export function MindGymBetaFeedback({ scenarioTitle, onDone }: MindGymBetaFeedbackProps) {
  const { t } = useTranslation()
  const [rating, setRating] = useState(0)
  const [relevant, setRelevant] = useState(0)
  const [safe, setSafe] = useState(0)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submit = async () => {
    if (rating < 1) {
      toast.error(t('mindGym.beta.rateRequired'))
      return
    }
    setSubmitting(true)
    try {
      const message = [
        '[Mind Gym Beta]',
        `Scenario: ${scenarioTitle}`,
        `Helpful: ${rating}/5`,
        `Relevant: ${relevant}/5`,
        `Felt safe: ${safe}/5`,
        notes ? `Notes: ${notes}` : '',
      ]
        .filter(Boolean)
        .join('\n')
      await apiSubmitFeedback(message)
      toast.success(t('mindGym.beta.thanks'))
      onDone()
    } catch {
      toast.error(t('common.error'))
    } finally {
      setSubmitting(false)
    }
  }

  const Scale = ({
    value,
    onChange,
    label,
  }: {
    value: number
    onChange: (n: number) => void
    label: string
  }) => (
    <div>
      <p className="mb-2 text-sm text-muted">{label}</p>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className="rounded p-1 transition-colors hover:bg-turmeric/20"
            aria-label={`${n}`}
          >
            <Star
              className={`h-6 w-6 ${n <= value ? 'fill-turmeric text-turmeric' : 'text-muted'}`}
            />
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <div className="space-y-4 rounded-xl border border-peacock/30 bg-peacock-soft/30 p-4">
      <p className="font-medium text-foreground">{t('mindGym.beta.title')}</p>
      <Scale value={rating} onChange={setRating} label={t('mindGym.beta.helpful')} />
      <Scale value={relevant} onChange={setRelevant} label={t('mindGym.beta.relevant')} />
      <Scale value={safe} onChange={setSafe} label={t('mindGym.beta.safe')} />
      <Textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder={t('mindGym.beta.notesPlaceholder')}
        rows={2}
      />
      <div className="flex gap-2">
        <Button className="flex-1" disabled={submitting} onClick={submit}>
          {t('mindGym.beta.submit')}
        </Button>
        <Button variant="ghost" onClick={onDone}>
          {t('mindGym.beta.skip')}
        </Button>
      </div>
    </div>
  )
}
