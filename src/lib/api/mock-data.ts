import type {
  User,
  Conversation,
  ChatFolder,
  MoodEntry,
  AssessmentResult,
  RecoveryPlan,
  Achievement,
  TrustedContact,
  SafetyPlan,
  NotificationItem,
  DashboardMetrics,
  WeeklyReport,
  MonthlyReport,
  ChatMessage,
} from '@/types'
import { sleep } from '@/lib/utils'

export const mockUser: User = {
  id: 'user-1',
  fullName: 'আয়েশা রহমান',
  email: 'ayesha@example.com',
  phone: '+8801712345678',
  recoveryEmail: 'ayesha.recovery@example.com',
  recoveryPhone: '+8801812345678',
  ageBand: '18-24',
  language: 'bn',
  country: 'Bangladesh',
  dateOfBirth: '2003-05-15',
  gender: 'female',
  isAnonymous: false,
  createdAt: '2025-09-01T08:00:00Z',
}

export const mockFolders: ChatFolder[] = [
  { id: 'f1', name: 'পরীক্ষার চাপ', color: '#F0C33F' },
  { id: 'f2', name: 'রাতের ভাবনা', color: '#B9D2C4' },
]

const welcomeMessage: ChatMessage = {
  id: 'msg-welcome',
  role: 'assistant',
  content: '',
  createdAt: new Date().toISOString(),
}

export const mockConversations: Conversation[] = [
  {
    id: 'conv-1',
    title: 'আজকের মনের অবস্থা',
    pinned: true,
    folderId: 'f1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messages: [
      welcomeMessage,
      {
        id: 'msg-1',
        role: 'user',
        content: 'আজ মনটা একটু ভারী লাগছে, পরীক্ষা কাছে এসেছে।',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: 'msg-2',
        role: 'assistant',
        content:
          'পরীক্ষার চাপ অনেকের জন্যই ভারী হয় — তুমি একা নও। চল, একটু ধীরে ধীরে বলো, কোন বিষয়টা সবচেয়ে বেশি চাপ দিচ্ছে?',
        createdAt: new Date(Date.now() - 3500000).toISOString(),
      },
    ],
  },
  {
    id: 'conv-2',
    title: 'ঘুমের সমস্যা',
    pinned: false,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    messages: [
      {
        id: 'msg-3',
        role: 'user',
        content: 'রাতে ঘুমাতে পারি না, মাথায় অনেক কিছু ঘুরতে থাকে।',
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
      {
        id: 'msg-4',
        role: 'assistant',
        content:
          'ঘুম না হলে শরীর-মন দুটোই ক্লান্ত হয়। তুমি কি চেষ্টা করেছো একই সময়ে বিছানায় যাওয়ার?',
        createdAt: new Date(Date.now() - 86400000 * 2 + 60000).toISOString(),
      },
    ],
  },
  {
    id: 'conv-3',
    title: 'বন্ধুত্ব নিয়ে',
    pinned: false,
    folderId: 'f2',
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    messages: [
      {
        id: 'msg-5',
        role: 'user',
        content: 'আমার এক বন্ধু আর আগের মতো কথা বলে না।',
        createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
      },
    ],
  },
]

export const mockMoodEntries: MoodEntry[] = [
  {
    id: 'mood-1',
    userId: 'user-1',
    date: new Date().toISOString().split('T')[0]!,
    moodScore: 6,
    emotions: ['anxious', 'hopeful'],
    note: 'সকালে একটু চিন্তিত ছিলাম, বিকেলে ভালো লাগছে।',
    sleep: 6,
    hydration: 7,
    exercise: true,
    meditation: false,
    gratitude: 'আজ মায়ের সাথে ভালো কথা হয়েছে।',
  },
  {
    id: 'mood-2',
    userId: 'user-1',
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0]!,
    moodScore: 4,
    emotions: ['sad', 'tired'],
    note: 'পরীক্ষার প্রস্তুতি নিয়ে চাপ।',
    sleep: 5,
    hydration: 5,
    exercise: false,
    meditation: true,
  },
  {
    id: 'mood-3',
    userId: 'user-1',
    date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0]!,
    moodScore: 7,
    emotions: ['calm', 'content'],
    sleep: 8,
    hydration: 8,
    exercise: true,
    meditation: true,
    gratitude: 'বন্ধুর সাথে হাঁটা ভালো লেগেছে।',
  },
  {
    id: 'mood-4',
    userId: 'user-1',
    date: new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0]!,
    moodScore: 5,
    emotions: ['neutral'],
    sleep: 7,
    hydration: 6,
  },
  {
    id: 'mood-5',
    userId: 'user-1',
    date: new Date(Date.now() - 86400000 * 5).toISOString().split('T')[0]!,
    moodScore: 3,
    emotions: ['lonely', 'sad'],
    note: 'একটু একা লাগছিল।',
    sleep: 4,
  },
  {
    id: 'mood-6',
    userId: 'user-1',
    date: new Date(Date.now() - 86400000 * 7).toISOString().split('T')[0]!,
    moodScore: 8,
    emotions: ['happy', 'energetic'],
    exercise: true,
    meditation: true,
  },
]

export const mockAssessments: AssessmentResult[] = [
  {
    id: 'assess-1',
    userId: 'user-1',
    scaleType: 'PHQ-9',
    responses: { q1: 1, q2: 2, q3: 1, q4: 2, q5: 1, q6: 1, q7: 0, q8: 1, q9: 0 },
    totalScore: 9,
    riskLevel: 'mild',
    mindDialogueSummary: 'assessment.summary.mild',
    createdAt: new Date(Date.now() - 86400000 * 14).toISOString(),
  },
]

export const mockRecoveryPlan: RecoveryPlan = {
  id: 'plan-1',
  userId: 'user-1',
  startDate: new Date(Date.now() - 86400000 * 5).toISOString(),
  currentDay: 6,
  riskProfile: 'mild',
  days: Array.from({ length: 30 }, (_, i) => ({
    day: i + 1,
    goals: ['recovery.goals.breathing', 'recovery.goals.walk'],
    activities: [
      { id: 'a1', labelKey: 'recovery.activities.meditation', completed: i < 5 },
      { id: 'a2', labelKey: 'recovery.activities.walking', completed: i < 4 },
      { id: 'a3', labelKey: 'recovery.activities.hydration', completed: i < 6 },
      { id: 'a4', labelKey: 'recovery.activities.sleep', completed: i < 3 },
      { id: 'a5', labelKey: 'recovery.activities.reading', completed: i < 2 },
    ],
    tipKey: 'recovery.tips.mild',
    completedPercent: Math.min(100, 20 + i * 3),
  })),
}

export const mockAchievements: Achievement[] = [
  {
    id: 'ach-1',
    titleKey: 'achievements.firstCheckIn.title',
    descriptionKey: 'achievements.firstCheckIn.description',
    icon: 'heart',
    unlockedAt: '2025-09-02T10:00:00Z',
    gentle: true,
  },
  {
    id: 'ach-2',
    titleKey: 'achievements.weekOfReflection.title',
    descriptionKey: 'achievements.weekOfReflection.description',
    icon: 'calendar',
    unlockedAt: '2025-09-08T10:00:00Z',
    gentle: true,
  },
  {
    id: 'ach-3',
    titleKey: 'achievements.firstChat.title',
    descriptionKey: 'achievements.firstChat.description',
    icon: 'message',
    gentle: true,
  },
  {
    id: 'ach-4',
    titleKey: 'achievements.breathingBuddy.title',
    descriptionKey: 'achievements.breathingBuddy.description',
    icon: 'wind',
    unlockedAt: '2025-09-15T10:00:00Z',
    gentle: true,
  },
]

export const mockTrustedContacts: TrustedContact[] = [
  { id: 'tc-1', name: 'মা', phone: '+8801711111111', relationship: 'guardian' },
]

export const mockSafetyPlan: SafetyPlan = {
  id: 'sp-1',
  warningSigns: ['ঘুম না হওয়া', 'খাওয়ার ইচ্ছা কমে যাওয়া'],
  copingStrategies: ['গভীর শ্বাস', 'পছন্দের গান শোনা'],
  distractions: ['বন্ধুর সাথে কথা', 'হাঁটা'],
  trustedPeople: mockTrustedContacts,
  professionalContacts: ['1098'],
  safeEnvironment: ['নিজের ঘর', 'বাড়ির ছাদ'],
}

export const mockNotifications: NotificationItem[] = [
  {
    id: 'n1',
    titleKey: 'notifications.moodReminder.title',
    bodyKey: 'notifications.moodReminder.body',
    read: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'n2',
    titleKey: 'notifications.weeklyReport.title',
    bodyKey: 'notifications.weeklyReport.body',
    read: true,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
]

export const mockDashboardMetrics: DashboardMetrics = {
  wellnessScore: 68,
  stressScore: 42,
  moodTrend: [5, 4, 7, 6, 5, 6, 6],
  recoveryProgress: 35,
  dailyActivity: { meditation: 4, exercise: 3, hydration: 6, sleep: 5, breathing: 7 },
  riskCategories: { stress: 42, depression: 28, anxiety: 35, burnout: 38, loneliness: 22 },
  aiInsights: [
    'dashboard.insights.sleep',
    'dashboard.insights.exercise',
    'dashboard.insights.gratitude',
  ],
}

export const mockWeeklyReport: WeeklyReport = {
  id: 'wr-1',
  weekStart: new Date(Date.now() - 86400000 * 7).toISOString(),
  summaryKey: 'reports.weekly.summary',
  moodAverage: 5.8,
  checkIns: 5,
  highlights: ['reports.weekly.highlight1', 'reports.weekly.highlight2'],
}

export const mockMonthlyReport: MonthlyReport = {
  id: 'mr-1',
  month: '2025-09',
  summaryKey: 'reports.monthly.summary',
  moodAverage: 5.5,
  assessmentChange: -2,
  trends: { mood: 5.5, stress: 40, anxiety: 32, sleep: 6.2 },
}

export const AI_RESPONSES: Record<string, string[]> = {
  default: [
    'তোমার কথা শুনছি। একটু বিস্তারিত বলতে পারো?',
    'এটা শুনে মনে হচ্ছে তুমি সত্যিই চেষ্টা করছ। তোমার অনুভূতি স্বাভাবিক।',
    'চল, একসাথে একটা ছোট পদক্ষেপ ভাবি — আজ রাতে কী করা সম্ভব?',
  ],
  stress: [
    'চাপ অনুভব করা মানে তুমি দুর্বল নও — তুমি মানুষ। কোন কাজটা সবচেয়ে বেশি ভারী লাগছে?',
  ],
}

export async function initializeMockData() {
  await sleep(300)
  return {
    user: mockUser,
    conversations: mockConversations,
    folders: mockFolders,
    moodEntries: mockMoodEntries,
    assessments: mockAssessments,
    recoveryPlan: mockRecoveryPlan,
    achievements: mockAchievements,
    trustedContacts: mockTrustedContacts,
    safetyPlan: mockSafetyPlan,
    notifications: mockNotifications,
    dashboard: mockDashboardMetrics,
    weeklyReport: mockWeeklyReport,
    monthlyReport: mockMonthlyReport,
  }
}

export async function simulateStreamingResponse(
  prompt: string,
  onChunk: (chunk: string) => void
): Promise<string> {
  const responses = prompt.includes('চাপ') || prompt.includes('stress')
    ? AI_RESPONSES.stress!
    : AI_RESPONSES.default!
  const fullResponse = responses[Math.floor(Math.random() * responses.length)]!
  const words = fullResponse.split(' ')
  let accumulated = ''
  for (const word of words) {
    await sleep(80 + Math.random() * 60)
    accumulated += (accumulated ? ' ' : '') + word
    onChunk(accumulated)
  }
  return fullResponse
}
