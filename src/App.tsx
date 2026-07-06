import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { ThemeProvider } from '@/components/ThemeProvider'
import { AppShell } from '@/components/AppSidebar'
import { ProtectedRoute, PublicOnlyRoute } from '@/components/ProtectedRoute'
import { useInitApp, useLanguageSync } from '@/features/hooks/useInitApp'

import { LandingPage } from '@/app/LandingPage'
import { LoginPage } from '@/app/LoginPage'
import { RegisterPage } from '@/app/RegisterPage'
import { ForgotPasswordPage } from '@/app/ForgotPasswordPage'
import { ResetPasswordPage } from '@/app/ResetPasswordPage'
import { VerifyEmailPage } from '@/app/VerifyEmailPage'
import { VerifyPhonePage } from '@/app/VerifyPhonePage'
import { OnboardingAgePage } from '@/app/OnboardingAgePage'
import { OnboardingConsentPage } from '@/app/OnboardingConsentPage'
import { OnboardingLanguagePage } from '@/app/OnboardingLanguagePage'
import { ChatPage } from '@/app/ChatPage'
import { MoodJournalPage } from '@/app/MoodJournalPage'
import { MoodCalendarPage } from '@/app/MoodCalendarPage'
import { AssessmentPage } from '@/app/AssessmentPage'
import { RecoveryPlanPage } from '@/app/RecoveryPlanPage'
import { MindGymPage } from '@/app/MindGymPage'
import { DashboardPage } from '@/app/DashboardPage'
import { WeeklyReportPage } from '@/app/WeeklyReportPage'
import { MonthlyReportPage } from '@/app/MonthlyReportPage'
import { AchievementsPage } from '@/app/AchievementsPage'
import { ProfilePage } from '@/app/ProfilePage'
import { SettingsPage } from '@/app/SettingsPage'
import { HelpPage } from '@/app/HelpPage'
import { EmergencyPage, BreathingExercisePage } from '@/components/emergency/EmergencyPage'

function AppRoutes() {
  useLanguageSync()
  useInitApp()

  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicOnlyRoute>
            <RegisterPage />
          </PublicOnlyRoute>
        }
      />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/verify-phone" element={<VerifyPhonePage />} />

      {/* Onboarding */}
      <Route path="/onboarding/age" element={<OnboardingAgePage />} />
      <Route path="/onboarding/consent" element={<OnboardingConsentPage />} />
      <Route path="/onboarding/language" element={<OnboardingLanguagePage />} />

      {/* Authenticated app */}
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <AppShell>
              <ChatPage />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/chat/:id"
        element={
          <ProtectedRoute>
            <AppShell>
              <ChatPage />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/mood-journal"
        element={
          <ProtectedRoute>
            <AppShell>
              <MoodJournalPage />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/mood-calendar"
        element={
          <ProtectedRoute>
            <AppShell>
              <MoodCalendarPage />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/assessment"
        element={
          <ProtectedRoute>
            <AppShell>
              <AssessmentPage />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/mind-gym"
        element={
          <ProtectedRoute>
            <AppShell>
              <MindGymPage />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/recovery-plan"
        element={
          <ProtectedRoute>
            <AppShell>
              <RecoveryPlanPage />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/dashboard"
        element={
          <ProtectedRoute>
            <AppShell>
              <DashboardPage />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/reports/weekly"
        element={
          <ProtectedRoute>
            <AppShell>
              <WeeklyReportPage />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/reports/monthly"
        element={
          <ProtectedRoute>
            <AppShell>
              <MonthlyReportPage />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/achievements"
        element={
          <ProtectedRoute>
            <AppShell>
              <AchievementsPage />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/profile"
        element={
          <ProtectedRoute>
            <AppShell>
              <ProfilePage />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/settings"
        element={
          <ProtectedRoute>
            <AppShell>
              <SettingsPage />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/help"
        element={
          <ProtectedRoute>
            <AppShell>
              <HelpPage />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/emergency"
        element={
          <ProtectedRoute>
            <AppShell>
              <EmergencyPage />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/emergency/breathing"
        element={
          <ProtectedRoute>
            <AppShell>
              <BreathingExercisePage />
            </AppShell>
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'var(--surface)',
              color: 'var(--foreground)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
            },
          }}
        />
      </BrowserRouter>
    </ThemeProvider>
  )
}
