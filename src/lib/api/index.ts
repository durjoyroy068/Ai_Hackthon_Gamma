import type { User, AssessmentResult, MoodEntry, Conversation } from '@/types'
import { apiRequest, setToken, simulateStream } from './client'

interface AuthResponse {
  user: User
  token: string
}

interface InitData {
  user: User
  conversations: Conversation[]
  folders: import('@/types').ChatFolder[]
  moodEntries: MoodEntry[]
  assessments: AssessmentResult[]
  recoveryPlan: import('@/types').RecoveryPlan
  achievements: import('@/types').Achievement[]
  trustedContacts: import('@/types').TrustedContact[]
  safetyPlan: import('@/types').SafetyPlan | null
  notifications: import('@/types').NotificationItem[]
}

export async function apiInit(): Promise<InitData> {
  return apiRequest<InitData>('/init')
}

export async function apiLogin(email: string, password: string): Promise<User> {
  const { user, token } = await apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  setToken(token)
  return user
}

export async function apiGoogleLogin(idToken: string, language?: 'bn' | 'en'): Promise<User> {
  const { user, token } = await apiRequest<AuthResponse>('/auth/google', {
    method: 'POST',
    body: JSON.stringify({ idToken, language }),
  })
  setToken(token)
  return user
}

export async function apiRegister(data: Partial<User> & { password?: string }): Promise<User> {
  const { user, token } = await apiRequest<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      password: data.password,
      ageBand: data.ageBand,
      language: data.language,
      country: data.country,
      dateOfBirth: data.dateOfBirth,
      gender: data.gender,
      isAnonymous: data.isAnonymous,
    }),
  })
  setToken(token)
  return user
}

export async function apiLogout(): Promise<void> {
  try {
    await apiRequest('/auth/logout', { method: 'POST' })
  } finally {
    setToken(null)
  }
}

export async function apiSendOTP(target: string, type: 'email' | 'phone'): Promise<boolean> {
  const res = await apiRequest<{ success: boolean }>('/auth/otp/send', {
    method: 'POST',
    body: JSON.stringify({ target, type }),
  })
  return res.success
}

export async function apiVerifyOTP(target: string, code: string): Promise<boolean> {
  const res = await apiRequest<{ success: boolean }>('/auth/otp/verify', {
    method: 'POST',
    body: JSON.stringify({ target, code }),
  })
  return res.success
}

export async function apiResetPassword(email: string): Promise<boolean> {
  const res = await apiRequest<{ success: boolean }>('/auth/password/forgot', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
  return res.success
}

export async function apiResetPasswordConfirm(
  email: string,
  code: string,
  password: string
): Promise<boolean> {
  const res = await apiRequest<{ success: boolean }>('/auth/password/reset', {
    method: 'POST',
    body: JSON.stringify({ email, code, password }),
  })
  return res.success
}

export async function apiUpdateUser(updates: Partial<User> & { onboardingComplete?: boolean }): Promise<User> {
  return apiRequest<User>('/user', {
    method: 'PATCH',
    body: JSON.stringify(updates),
  })
}

export async function apiGuardianConsent(consent: {
  guardianName: string
  guardianEmail: string
  guardianPhone: string
  consentGiven: boolean
}): Promise<User> {
  return apiRequest<User>('/user/guardian-consent', {
    method: 'POST',
    body: JSON.stringify(consent),
  })
}

export async function apiStreamChat(
  conversationId: string,
  message: string,
  onChunk: (chunk: string) => void
): Promise<{
  responseText: string
  userMessage: import('@/types').ChatMessage
  assistantMessage: import('@/types').ChatMessage
}> {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 70000)

  try {
    const res = await apiRequest<{
      responseText: string
      userMessage: import('@/types').ChatMessage
      assistantMessage: import('@/types').ChatMessage
    }>(`/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content: message }),
      signal: controller.signal,
    })

    const text = res.responseText || ''
    // Fast local typing effect so the UI never feels frozen.
    await simulateStream(text, onChunk, 18)

    return res
  } finally {
    window.clearTimeout(timeout)
  }
}

export async function apiCreateConversation(title?: string): Promise<Conversation> {
  return apiRequest<Conversation>('/conversations', {
    method: 'POST',
    body: JSON.stringify({ title: title ?? 'New Chat' }),
  })
}

export async function apiUpdateConversation(
  id: string,
  updates: Partial<Pick<Conversation, 'title' | 'pinned' | 'folderId'>>
): Promise<Conversation> {
  return apiRequest<Conversation>(`/conversations/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  })
}

export async function apiDeleteConversation(id: string): Promise<void> {
  await apiRequest(`/conversations/${id}`, { method: 'DELETE' })
}

export async function apiSubmitAssessment(
  data: Omit<AssessmentResult, 'id' | 'createdAt'>
): Promise<AssessmentResult> {
  return apiRequest<AssessmentResult>('/assessments', {
    method: 'POST',
    body: JSON.stringify({
      scaleType: data.scaleType,
      responses: data.responses,
    }),
  })
}

export async function apiSaveMoodEntry(entry: Omit<MoodEntry, 'id'>): Promise<MoodEntry> {
  return apiRequest<MoodEntry>('/mood-entries', {
    method: 'POST',
    body: JSON.stringify({
      date: entry.date,
      moodScore: entry.moodScore,
      emotions: entry.emotions,
      note: entry.note,
      sleep: entry.sleep,
      hydration: entry.hydration,
      exercise: entry.exercise,
      meditation: entry.meditation,
      gratitude: entry.gratitude,
      reflection: entry.reflection,
    }),
  })
}

export async function apiExportUserData(_userId: string): Promise<Blob> {
  const data = await apiRequest<unknown>('/user/export')
  return new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
}

export async function apiDeleteUserData(_userId: string): Promise<boolean> {
  await apiRequest('/user/data', { method: 'DELETE' })
  return true
}

export async function apiChangePassword(
  currentPassword: string,
  password: string,
  passwordConfirmation: string
): Promise<boolean> {
  await apiRequest('/user/password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, password, password_confirmation: passwordConfirmation }),
  })
  return true
}

export async function apiDeleteAccount(): Promise<boolean> {
  await apiRequest('/user', { method: 'DELETE' })
  setToken(null)
  return true
}

export async function apiUpdateSettings(settings: Record<string, unknown>): Promise<void> {
  await apiRequest('/user/settings', {
    method: 'PATCH',
    body: JSON.stringify(settings),
  })
}

export async function apiGetSettings(): Promise<{
  theme: string
  highContrast: boolean
  useBanglaNumerals: boolean
  aiTone: string
  moodReminders: boolean
  weeklyReports: boolean
}> {
  return apiRequest('/user/settings')
}

export async function apiClearChatMemory(): Promise<void> {
  const conversations = await apiRequest<Conversation[]>('/conversations')
  await Promise.all(conversations.map((c) => apiDeleteConversation(c.id)))
}

export async function apiUpdateSafetyPlan(plan: import('@/types').SafetyPlan): Promise<import('@/types').SafetyPlan> {
  return apiRequest('/safety-plan', {
    method: 'PUT',
    body: JSON.stringify(plan),
  })
}

export async function apiGetRecoveryPlan(): Promise<import('@/types').RecoveryPlan> {
  return apiRequest('/recovery-plan')
}

export async function apiToggleRecoveryActivity(
  activityId: string,
  completed: boolean
): Promise<{ success: boolean; completedPercent: number }> {
  return apiRequest(`/recovery-plan/activities/${activityId}`, {
    method: 'PATCH',
    body: JSON.stringify({ completed }),
  })
}

export async function apiSubmitFeedback(message: string, email?: string): Promise<boolean> {
  await apiRequest('/feedback', {
    method: 'POST',
    body: JSON.stringify({ message, email }),
  })
  return true
}

export async function apiGetEmergencyResources(): Promise<
  Array<{ id: string; name: string; nameBn?: string; phone: string; url?: string }>
> {
  return apiRequest('/emergency-resources')
}

export async function apiGetMindGymScenarios(): Promise<import('@/types').MindGymScenario[]> {
  return apiRequest('/mind-gym/scenarios')
}

export async function apiGetMindGymProgress(): Promise<import('@/types').MindGymProgress[]> {
  return apiRequest('/mind-gym/progress')
}

export async function apiGetMindGymAnalytics(): Promise<{
  protocol: { version: string; status: string; effectiveFrom?: string; disclaimer?: string }
  totalSessions: number
  uniqueUsers: number
  avgOverallScore: number
  completionRate: number
  betaFeedbackCount: number
  byCategory: Array<{ category: string; sessions: number; avgScore: number; completionRate: number }>
  corpusNote?: string
}> {
  return apiRequest('/mind-gym/analytics')
}

export async function apiGetMindGymProtocol(): Promise<{
  version: string
  status: string
  effectiveFrom?: string
  disclaimer?: string
}> {
  return apiRequest('/mind-gym/protocol')
}

export async function apiGetMindGymIntake(): Promise<import('@/types').MindGymIntake> {
  return apiRequest('/mind-gym/intake')
}

export async function apiMindGymRecommend(answers: Record<string, string>): Promise<{
  scenarioId: string
  category: string
  difficulty: string
  title: string
  setting: string
  rationale: string
  profile?: import('@/types').MindGymScenarioProfile
  openingBeat?: import('@/types').MindGymStoryBeat
  scenarios: import('@/types').MindGymScenario[]
}> {
  return apiRequest('/mind-gym/recommend', {
    method: 'POST',
    body: JSON.stringify({ answers }),
  })
}

export async function apiStartMindGymSession(
  scenarioId: string,
  moodBefore?: number,
  language?: 'bn' | 'en'
): Promise<import('@/types').MindGymSessionState> {
  return apiRequest('/mind-gym/sessions', {
    method: 'POST',
    body: JSON.stringify({
      scenarioId: Number(scenarioId),
      moodBefore,
      language: language ?? 'bn',
    }),
  })
}

export async function apiMindGymChoose(
  sessionId: string,
  choiceId: string
): Promise<import('@/types').MindGymSessionState> {
  return apiRequest(`/mind-gym/sessions/${sessionId}/choose`, {
    method: 'POST',
    body: JSON.stringify({ choiceId: Number(choiceId) }),
  })
}

export async function apiMindGymReflect(
  sessionId: string,
  reflection: string,
  moodAfter?: number
): Promise<import('@/types').MindGymSessionState> {
  return apiRequest(`/mind-gym/sessions/${sessionId}/reflect`, {
    method: 'POST',
    body: JSON.stringify({ reflection, moodAfter }),
  })
}

export async function apiMindGymNpcTurn(
  studentInput: string,
  context?: { difficulty?: number; category?: string; nodeId?: string; turn?: number; language?: string }
): Promise<import('@/types').MindGymNpcTurnResponse> {
  return apiRequest('/mind-gym/npc-turn', {
    method: 'POST',
    body: JSON.stringify({ studentInput, context }),
  })
}

export async function apiMindGymStoryTurn(
  sessionId: string,
  studentInput: string,
  language?: 'bn' | 'en'
): Promise<import('@/types').MindGymSessionState> {
  return apiRequest(`/mind-gym/sessions/${sessionId}/story`, {
    method: 'POST',
    body: JSON.stringify({
      studentInput,
      language: language ?? 'bn',
    }),
  })
}
