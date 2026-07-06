import { useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { TopNav } from '@/components/TopNav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ChevronDown, ChevronUp, Mail } from 'lucide-react'
import { cn } from '@/lib/utils'
import { apiSubmitFeedback } from '@/lib/api'
import { useAuthStore } from '@/features/stores'

const slowTransition = { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const }

const FAQ_KEYS = ['q1', 'q2', 'q3', 'q4', 'q5'] as const

export function HelpPage() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const [search, setSearch] = useState('')
  const [openFaq, setOpenFaq] = useState<string | null>('q1')
  const [feedback, setFeedback] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const filteredFaqs = FAQ_KEYS.filter((key) => {
    if (!search) return true
    const q = t(`landing.faq.${key}.question`).toLowerCase()
    const a = t(`landing.faq.${key}.answer`).toLowerCase()
    return q.includes(search.toLowerCase()) || a.includes(search.toLowerCase())
  })

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
            <h1 className="font-display text-3xl text-foreground">{t('help.title')}</h1>
          </div>

          <Input
            type="search"
            placeholder={t('help.search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label={t('help.search')}
          />

          <Card id="feedback">
            <CardHeader>
              <CardTitle>{t('help.faq')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {filteredFaqs.map((key) => {
                const isOpen = openFaq === key
                return (
                  <div key={key} className="rounded-lg border border-border">
                    <button
                      type="button"
                      className="flex w-full items-center justify-between p-4 text-left"
                      onClick={() => setOpenFaq(isOpen ? null : key)}
                      aria-expanded={isOpen}
                    >
                      <span className="font-medium">{t(`landing.faq.${key}.question`)}</span>
                      {isOpen ? (
                        <ChevronUp className="h-4 w-4 shrink-0 text-muted" />
                      ) : (
                        <ChevronDown className="h-4 w-4 shrink-0 text-muted" />
                      )}
                    </button>
                    <motion.div
                      initial={false}
                      animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
                      transition={slowTransition}
                      className={cn('overflow-hidden', !isOpen && 'h-0')}
                    >
                      <p className="px-4 pb-4 text-sm text-muted">
                        {t(`landing.faq.${key}.answer`)}
                      </p>
                    </motion.div>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('help.contact.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted">
                <Mail className="h-4 w-4" />
                {t('help.contact.email')}
              </div>
              <Textarea
                placeholder={t('help.search')}
                rows={4}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
              />
              <Button
                className="bg-peacock hover:bg-peacock/90"
                disabled={submitting || !feedback.trim()}
                onClick={async () => {
                  setSubmitting(true)
                  try {
                    await apiSubmitFeedback(feedback, user?.email)
                    setFeedback('')
                    toast.success(t('common.success'))
                  } catch {
                    toast.error(t('common.error'))
                  } finally {
                    setSubmitting(false)
                  }
                }}
              >
                {t('help.contact.submit')}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('help.about.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted">{t('help.about.description')}</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Button variant="link" className="h-auto p-0 text-peacock">
                  {t('help.privacyPolicy')}
                </Button>
                <Button variant="link" className="h-auto p-0 text-peacock">
                  {t('help.terms')}
                </Button>
                <Button variant="link" className="h-auto p-0 text-peacock">
                  {t('help.reportProblem')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </>
  )
}
