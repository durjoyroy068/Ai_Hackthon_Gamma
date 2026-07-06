import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { apiInit } from '@/lib/api'
import {
  useAuthStore,
  useChatStore,
  useWellnessStore,
  useAppStore,
} from '@/features/stores'

export function useInitApp() {
  const { i18n } = useTranslation()
  const { language } = useAppStore()
  const { isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (language && i18n.language !== language) {
      i18n.changeLanguage(language)
    }
  }, [language, i18n])

  useEffect(() => {
    if (!isAuthenticated) return

    let cancelled = false

    async function load() {
      try {
        const data = await apiInit()
        if (cancelled) return

        useAuthStore.setState({ user: data.user })

        useChatStore.setState({
          conversations: data.conversations,
          folders: data.folders,
        })

        useWellnessStore.setState({
          moodEntries: data.moodEntries,
          assessments: data.assessments,
          recoveryPlan: data.recoveryPlan,
          achievements: data.achievements,
          trustedContacts: data.trustedContacts,
          safetyPlan: data.safetyPlan ?? undefined,
          notifications: data.notifications,
        })
      } catch {
        /* auth may be stale */
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [isAuthenticated])
}

export function useLanguageSync() {
  const { i18n } = useTranslation()
  const { language, setLanguage } = useAppStore()

  useEffect(() => {
    const stored = localStorage.getItem('mon-songlap-app')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        const lang = parsed?.state?.language
        if (lang && lang !== language) {
          setLanguage(lang)
        }
      } catch {
        /* ignore */
      }
    }

    const detected = i18n.language?.startsWith('en') ? 'en' : 'bn'
    if (!localStorage.getItem('mon-songlap-app')) {
      setLanguage('bn')
      i18n.changeLanguage('bn')
    } else if (language) {
      i18n.changeLanguage(language)
    } else {
      setLanguage(detected)
      i18n.changeLanguage(detected)
    }
  }, [])
}
