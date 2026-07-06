import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/features/stores'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, onboardingComplete } = useAuthStore()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (!onboardingComplete && !location.pathname.startsWith('/onboarding')) {
    return <Navigate to="/onboarding/age" replace />
  }

  return <>{children}</>
}

export function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, onboardingComplete } = useAuthStore()

  if (isAuthenticated && onboardingComplete) {
    return <Navigate to="/app" replace />
  }

  return <>{children}</>
}
