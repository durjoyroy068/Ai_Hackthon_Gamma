export type Language = 'bn' | 'en'
export type AgeBand = '13-17' | '18-24' | '25+'
export type ScaleType = 'PHQ-9' | 'GAD-7' | 'PHQ-A' | 'RCADS'
export type RiskLevel = 'minimal' | 'mild' | 'moderate' | 'high'
export type ThemeMode = 'light' | 'dark' | 'system'

export interface GuardianConsent {
  guardianName: string
  guardianEmail: string
  guardianPhone: string
  consentGiven: boolean
  consentDate: string
}

export interface User {
  id: string
  fullName: string
  email: string
  phone: string
  recoveryEmail?: string
  recoveryPhone?: string
  ageBand: AgeBand
  language: Language
  country: string
  dateOfBirth?: string
  gender?: string
  isAnonymous: boolean
  avatarUrl?: string
  guardianConsent?: GuardianConsent
  createdAt: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  createdAt: string
  safetyLevel?: 'none' | 'moderate' | 'high'
  liked?: boolean | null
}

export interface Conversation {
  id: string
  title: string
  messages: ChatMessage[]
  pinned: boolean
  folderId?: string
  createdAt: string
  updatedAt: string
}

export interface ChatFolder {
  id: string
  name: string
  color?: string
}

export interface AssessmentQuestion {
  id: string
  textKey: string
  scaleType: ScaleType
}

export interface AssessmentResult {
  id: string
  userId: string
  scaleType: ScaleType
  responses: Record<string, number>
  totalScore: number
  riskLevel: RiskLevel
  mindDialogueSummary: string
  createdAt: string
}

export interface MoodEntry {
  id: string
  userId: string
  date: string
  moodScore: number
  emotions: string[]
  note?: string
  sleep?: number
  hydration?: number
  exercise?: boolean
  meditation?: boolean
  gratitude?: string
  reflection?: string
}

export interface HabitEntry {
  id: string
  userId: string
  date: string
  habits: Record<string, boolean>
  streak: number
}

export interface RecoveryPlanDay {
  day: number
  goals: string[]
  activities: { id: string; labelKey: string; completed: boolean }[]
  tipKey: string
  completedPercent: number
}

export interface RecoveryPlan {
  id: string
  userId: string
  startDate: string
  currentDay: number
  days: RecoveryPlanDay[]
  riskProfile: RiskLevel
}

export interface Achievement {
  id: string
  titleKey: string
  descriptionKey: string
  icon: string
  unlockedAt?: string
  gentle: boolean
}

export interface TrustedContact {
  id: string
  name: string
  phone: string
  relationship: string
}

export interface SafetyPlan {
  id: string
  warningSigns: string[]
  copingStrategies: string[]
  distractions: string[]
  trustedPeople: TrustedContact[]
  professionalContacts: string[]
  safeEnvironment: string[]
}

export interface NotificationItem {
  id: string
  titleKey: string
  bodyKey: string
  read: boolean
  createdAt: string
}

export interface DashboardMetrics {
  wellnessScore: number
  stressScore: number
  moodTrend: number[]
  recoveryProgress: number
  dailyActivity: Record<string, number>
  riskCategories: Record<string, number>
  aiInsights: string[]
}

export interface WeeklyReport {
  id: string
  weekStart: string
  summaryKey: string
  moodAverage: number
  checkIns: number
  highlights: string[]
}

export interface MonthlyReport {
  id: string
  month: string
  summaryKey: string
  moodAverage: number
  assessmentChange: number
  trends: Record<string, number>
}

export interface MindGymScenario {
  id: string
  code: string
  titleBn: string
  titleEn: string
  category: string
  difficulty: string
  durationMinutes: number
  recommended: boolean
  settingBn: string
  settingEn: string
}

export interface MindGymChoice {
  id: string
  text: string
}

export interface MindGymSessionState {
  sessionId: string
  status: string
  currentNodeId: string
  scenario: {
    id: string
    code: string
    title: string
    setting: string
    category: string
    difficulty: string
  }
  sceneText: string | null
  choices: MindGymChoice[]
  scores: {
    coping: number
    avoidance: number
    clarity: number
    overall: number | null
  }
  feedback: string | null
  isComplete: boolean
}

export interface MindGymProgress {
  category: string
  currentLevel: number
  xp: number
  sessionsCompleted: number
  avgScore: number
  unlockedScenarios: string[]
}
