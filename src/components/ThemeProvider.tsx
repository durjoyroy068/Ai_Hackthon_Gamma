import { useEffect } from 'react'
import { useAppStore } from '@/features/stores'
import { cn } from '@/lib/utils'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme, highContrast, language } = useAppStore()

  useEffect(() => {
    const root = document.documentElement
    const applyTheme = (isDark: boolean) => {
      root.classList.toggle('dark', isDark)
    }

    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      applyTheme(mq.matches)
      const handler = (e: MediaQueryListEvent) => applyTheme(e.matches)
      mq.addEventListener('change', handler)
      return () => mq.removeEventListener('change', handler)
    }
    applyTheme(theme === 'dark')
  }, [theme])

  useEffect(() => {
    document.body.dataset.locale = language
    document.documentElement.lang = language
  }, [language])

  useEffect(() => {
    document.documentElement.classList.toggle('high-contrast', highContrast)
  }, [highContrast])

  return <>{children}</>
}

export function PageShell({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('min-h-screen bg-[var(--background)] text-[var(--foreground)]', className)}>
      {children}
    </div>
  )
}
