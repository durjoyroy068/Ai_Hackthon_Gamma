import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { apiLogout } from '@/lib/api'
import { setToken } from '@/lib/api/client'
import type {
  User,
  Language,
  ThemeMode,
  Conversation,
  ChatFolder,
  MoodEntry,
  AssessmentResult,
  RecoveryPlan,
  Achievement,
  TrustedContact,
  SafetyPlan,
  NotificationItem,
} from '@/types'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  onboardingComplete: boolean
  login: (user: User) => void
  logout: () => void
  updateUser: (updates: Partial<User>) => void
  setOnboardingComplete: (value: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      onboardingComplete: false,
      login: (user) => set({ user, isAuthenticated: true }),
      logout: () => {
        apiLogout().catch(() => undefined)
        setToken(null)
        set({ user: null, isAuthenticated: false, onboardingComplete: false })
      },
      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),
      setOnboardingComplete: (value) => set({ onboardingComplete: value }),
    }),
    { name: 'mon-songlap-auth' }
  )
)

interface AppState {
  language: Language
  theme: ThemeMode
  sidebarCollapsed: boolean
  highContrast: boolean
  useBanglaNumerals: boolean
  setLanguage: (lang: Language) => void
  setTheme: (theme: ThemeMode) => void
  toggleSidebar: () => void
  setSidebarCollapsed: (value: boolean) => void
  setHighContrast: (value: boolean) => void
  setUseBanglaNumerals: (value: boolean) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      language: 'bn',
      theme: 'light',
      sidebarCollapsed: false,
      highContrast: false,
      useBanglaNumerals: false,
      setLanguage: (language) => set({ language }),
      setTheme: (theme) => set({ theme }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      setHighContrast: (highContrast) => set({ highContrast }),
      setUseBanglaNumerals: (useBanglaNumerals) => set({ useBanglaNumerals }),
    }),
    { name: 'mon-songlap-app' }
  )
)

interface ChatState {
  conversations: Conversation[]
  folders: ChatFolder[]
  activeConversationId: string | null
  isStreaming: boolean
  setActiveConversation: (id: string | null) => void
  addConversation: (conversation: Conversation) => void
  updateConversation: (id: string, updates: Partial<Conversation>) => void
  deleteConversation: (id: string) => void
  setStreaming: (value: boolean) => void
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      conversations: [],
      folders: [],
      activeConversationId: null,
      isStreaming: false,
      setActiveConversation: (activeConversationId) => set({ activeConversationId }),
      addConversation: (conversation) =>
        set((s) => ({ conversations: [conversation, ...s.conversations] })),
      updateConversation: (id, updates) =>
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
          ),
        })),
      deleteConversation: (id) =>
        set((s) => ({
          conversations: s.conversations.filter((c) => c.id !== id),
          activeConversationId: s.activeConversationId === id ? null : s.activeConversationId,
        })),
      setStreaming: (isStreaming) => set({ isStreaming }),
    }),
    {
      name: 'mon-songlap-chat',
      // Never persist in-flight UI locks — a refresh mid-send used to freeze chat forever.
      partialize: (state) => ({
        conversations: state.conversations,
        folders: state.folders,
        activeConversationId: state.activeConversationId,
      }),
    }
  )
)

interface WellnessState {
  moodEntries: MoodEntry[]
  assessments: AssessmentResult[]
  recoveryPlan: RecoveryPlan | null
  achievements: Achievement[]
  trustedContacts: TrustedContact[]
  safetyPlan: SafetyPlan | null
  notifications: NotificationItem[]
  setMoodEntries: (entries: MoodEntry[]) => void
  addMoodEntry: (entry: MoodEntry) => void
  setAssessments: (assessments: AssessmentResult[]) => void
  addAssessment: (assessment: AssessmentResult) => void
  setRecoveryPlan: (plan: RecoveryPlan | null) => void
  setAchievements: (achievements: Achievement[]) => void
  setTrustedContacts: (contacts: TrustedContact[]) => void
  setSafetyPlan: (plan: SafetyPlan | null) => void
  setNotifications: (notifications: NotificationItem[]) => void
  markNotificationRead: (id: string) => void
}

export const useWellnessStore = create<WellnessState>()(
  persist(
    (set) => ({
      moodEntries: [],
      assessments: [],
      recoveryPlan: null,
      achievements: [],
      trustedContacts: [],
      safetyPlan: null,
      notifications: [],
      setMoodEntries: (moodEntries) => set({ moodEntries }),
      addMoodEntry: (entry) => set((s) => ({ moodEntries: [entry, ...s.moodEntries] })),
      setAssessments: (assessments) => set({ assessments }),
      addAssessment: (assessment) =>
        set((s) => ({ assessments: [assessment, ...s.assessments] })),
      setRecoveryPlan: (recoveryPlan) => set({ recoveryPlan }),
      setAchievements: (achievements) => set({ achievements }),
      setTrustedContacts: (trustedContacts) => set({ trustedContacts }),
      setSafetyPlan: (safetyPlan) => set({ safetyPlan }),
      setNotifications: (notifications) => set({ notifications }),
      markNotificationRead: (id) =>
        set((s) => ({
          notifications: s.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        })),
    }),
    { name: 'mon-songlap-wellness' }
  )
)
