import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { TopNav } from '@/components/TopNav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAppStore } from '@/features/stores'
import { apiExportUserData, apiDeleteUserData, apiGetSettings, apiUpdateSettings } from '@/lib/api'
import type { Language, ThemeMode } from '@/types'

const slowTransition = { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const }

export function SettingsPage() {
  const { t, i18n } = useTranslation()
  const {
    theme,
    setTheme,
    language,
    setLanguage,
    highContrast,
    setHighContrast,
    useBanglaNumerals,
    setUseBanglaNumerals,
  } = useAppStore()

  const [moodReminders, setMoodReminders] = useState(true)
  const [weeklyReports, setWeeklyReports] = useState(true)
  const [achievementsNotif, setAchievementsNotif] = useState(true)
  const [aiTone, setAiTone] = useState('warm')

  useEffect(() => {
    apiGetSettings()
      .then((s) => {
        setTheme(s.theme as ThemeMode)
        setHighContrast(s.highContrast)
        setUseBanglaNumerals(s.useBanglaNumerals)
        setAiTone(s.aiTone)
        setMoodReminders(s.moodReminders)
        setWeeklyReports(s.weeklyReports)
      })
      .catch(() => undefined)
  }, [])

  const persistSettings = async (patch: Record<string, unknown>) => {
    try {
      await apiUpdateSettings(patch)
    } catch {
      toast.error(t('common.error'))
    }
  }

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang)
    i18n.changeLanguage(lang)
    persistSettings({ language: lang })
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
            <h1 className="font-display text-3xl text-foreground">{t('settings.title')}</h1>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t('settings.appearance.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{t('settings.appearance.theme')}</Label>
                <Select
                  value={theme}
                  onValueChange={(v) => {
                    setTheme(v as ThemeMode)
                    persistSettings({ theme: v })
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">{t('common.lightMode')}</SelectItem>
                    <SelectItem value="dark">{t('common.darkMode')}</SelectItem>
                    <SelectItem value="system">{t('settings.appearance.system')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="highContrast">{t('settings.appearance.highContrast')}</Label>
                <Switch
                  id="highContrast"
                  checked={highContrast}
                  onCheckedChange={(v) => {
                    setHighContrast(v)
                    persistSettings({ highContrast: v })
                  }}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('settings.language.title')}</CardTitle>
              <p className="text-sm text-muted">{t('settings.language.description')}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={language} onValueChange={(v) => handleLanguageChange(v as Language)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bn">{t('common.bn')}</SelectItem>
                  <SelectItem value="en">{t('common.en')}</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center justify-between">
                <Label htmlFor="banglaNumerals">{t('common.bn')}</Label>
                <Switch
                  id="banglaNumerals"
                  checked={useBanglaNumerals}
                  onCheckedChange={(v) => {
                    setUseBanglaNumerals(v)
                    persistSettings({ useBanglaNumerals: v })
                  }}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('settings.notifications.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>{t('settings.notifications.moodReminder')}</Label>
                <Switch
                  checked={moodReminders}
                  onCheckedChange={(v) => {
                    setMoodReminders(v)
                    persistSettings({ moodReminders: v })
                  }}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>{t('settings.notifications.weeklyReport')}</Label>
                <Switch
                  checked={weeklyReports}
                  onCheckedChange={(v) => {
                    setWeeklyReports(v)
                    persistSettings({ weeklyReports: v })
                  }}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>{t('settings.notifications.achievements')}</Label>
                <Switch checked={achievementsNotif} onCheckedChange={setAchievementsNotif} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('settings.ai.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Label>{t('settings.ai.tone')}</Label>
              <Select
                value={aiTone}
                onValueChange={(v) => {
                  setAiTone(v)
                  persistSettings({ aiTone: v })
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="warm">{t('settings.ai.toneWarm')}</SelectItem>
                  <SelectItem value="direct">{t('settings.ai.toneDirect')}</SelectItem>
                  <SelectItem value="gentle">{t('settings.ai.toneGentle')}</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('settings.dataPrivacy.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full"
                onClick={async () => {
                  try {
                    const blob = await apiExportUserData('')
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = 'mon-songlap-export.json'
                    a.click()
                    URL.revokeObjectURL(url)
                    toast.success(t('common.success'))
                  } catch {
                    toast.error(t('common.error'))
                  }
                }}
              >
                {t('settings.dataPrivacy.export')}
              </Button>
              <p className="text-xs text-muted">{t('settings.dataPrivacy.deleteWarning')}</p>
              <Button
                variant="destructive"
                className="w-full"
                onClick={async () => {
                  if (!confirm(t('settings.dataPrivacy.deleteWarning'))) return
                  try {
                    await apiDeleteUserData('')
                    toast.success(t('common.success'))
                  } catch {
                    toast.error(t('common.error'))
                  }
                }}
              >
                {t('settings.dataPrivacy.delete')}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </>
  )
}
