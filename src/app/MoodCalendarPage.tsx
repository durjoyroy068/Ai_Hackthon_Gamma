import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { TopNav } from '@/components/TopNav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAppStore, useWellnessStore } from '@/features/stores'
import { cn, formatDate } from '@/lib/utils'

const slowTransition = { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const }

function moodColor(score: number): string {
  if (score <= 3) return 'bg-alert/70'
  if (score <= 6) return 'bg-turmeric'
  return 'bg-dusk'
}

export function MoodCalendarPage() {
  const { t } = useTranslation()
  const { language, useBanglaNumerals } = useAppStore()
  const { moodEntries } = useWellnessStore()
  const [viewDate, setViewDate] = useState(() => new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const entryMap = useMemo(
    () => new Map(moodEntries.map((e) => [e.date, e])),
    [moodEntries]
  )

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const calendarDays = useMemo(() => {
    const days: (number | null)[] = Array(firstDay).fill(null)
    for (let d = 1; d <= daysInMonth; d++) days.push(d)
    return days
  }, [firstDay, daysInMonth])

  const dateKey = (day: number) =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`

  const selectedEntry = selectedDate ? entryMap.get(selectedDate) : undefined
  const sortedEntries = useMemo(
    () => [...moodEntries].sort((a, b) => b.date.localeCompare(a.date)),
    [moodEntries]
  )

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1))
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1))

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
          <div>
            <h1 className="font-display text-3xl text-foreground">{t('mood.calendar.title')}</h1>
            <p className="mt-2 text-muted">{t('mood.calendar.subtitle')}</p>
          </div>

          <Tabs defaultValue="calendar">
            <TabsList>
              <TabsTrigger value="calendar">{t('nav.moodCalendar')}</TabsTrigger>
              <TabsTrigger value="timeline">{t('mood.calendar.timeline')}</TabsTrigger>
            </TabsList>

            <TabsContent value="calendar" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <Button variant="ghost" size="icon" onClick={prevMonth} aria-label={t('common.back')}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <CardTitle className="text-lg">
                    {formatDate(viewDate, language, useBanglaNumerals)}
                  </CardTitle>
                  <Button variant="ghost" size="icon" onClick={nextMonth} aria-label={t('common.next')}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                      <span key={i}>{d}</span>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((day, i) => {
                      if (day === null) return <div key={`empty-${i}`} />
                      const key = dateKey(day)
                      const entry = entryMap.get(key)
                      const isSelected = selectedDate === key
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setSelectedDate(key)}
                          className={cn(
                            'flex aspect-square flex-col items-center justify-center rounded-lg text-sm transition-all duration-300',
                            isSelected && 'ring-2 ring-peacock',
                            entry ? moodColor(entry.moodScore) : 'bg-mist dark:bg-dusk-2',
                            entry ? 'text-white' : 'text-muted'
                          )}
                        >
                          {day}
                          {entry && (
                            <span className="text-[10px] font-bold">{entry.moodScore}</span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              {selectedDate && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={slowTransition}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle>
                        {formatDate(selectedDate, language, useBanglaNumerals)}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {selectedEntry ? (
                        <div className="space-y-2">
                          <p className="text-sm">
                            {t('mood.score.title')}:{' '}
                            <span className="font-semibold text-peacock">
                              {selectedEntry.moodScore}/10
                            </span>
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {selectedEntry.emotions.map((em) => (
                              <span
                                key={em}
                                className="rounded-full bg-peacock-soft px-2 py-0.5 text-xs text-peacock dark:bg-peacock/20"
                              >
                                {t(`mood.emotions.${em}`)}
                              </span>
                            ))}
                          </div>
                          {selectedEntry.note && (
                            <p className="text-sm text-muted">{selectedEntry.note}</p>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-muted">{t('mood.calendar.noEntry')}</p>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </TabsContent>

            <TabsContent value="timeline">
              <div className="relative space-y-4 pl-6 before:absolute before:left-2 before:top-2 before:h-[calc(100%-1rem)] before:w-0.5 before:bg-turmeric/30">
                {sortedEntries.map((entry, i) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ ...slowTransition, delay: i * 0.05 }}
                  >
                    <Card>
                      <CardContent className="relative pt-4">
                        <span
                          className={cn(
                            'absolute -left-[1.35rem] top-5 h-3 w-3 rounded-full border-2 border-paper',
                            moodColor(entry.moodScore)
                          )}
                        />
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-sm font-medium">
                              {formatDate(entry.date, language, useBanglaNumerals)}
                            </p>
                            <p className="text-xs text-muted">
                              {t('mood.score.title')}: {entry.moodScore}/10
                            </p>
                            {entry.note && (
                              <p className="mt-1 text-sm text-muted">{entry.note}</p>
                            )}
                          </div>
                          <span
                            className={cn(
                              'rounded-full px-2 py-1 text-xs font-bold text-white',
                              moodColor(entry.moodScore)
                            )}
                          >
                            {entry.moodScore}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>
    </>
  )
}
