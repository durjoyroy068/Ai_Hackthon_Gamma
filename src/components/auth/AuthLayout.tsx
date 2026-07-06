import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { PageShell } from '@/components/ThemeProvider'
import { AlponaThread, BrandMark } from '@/components/AlponaThread'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface AuthLayoutProps {
  title: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
}

export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  const { t } = useTranslation()

  return (
    <PageShell className="relative flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <AlponaThread
        variant="watermark"
        className="pointer-events-none absolute inset-x-0 top-8 mx-auto w-full max-w-lg opacity-10"
      />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative z-10 w-full max-w-md"
      >
        <Link to="/" className="mb-8 flex items-center justify-center gap-2 no-underline">
          <BrandMark />
          <span className="font-display text-xl font-semibold text-foreground">
            {t('common.appName')}
          </span>
        </Link>
        <Card className="border-border/80 shadow-md">
          <CardHeader className="text-center">
            <CardTitle className="font-display text-2xl">{title}</CardTitle>
            {subtitle && <CardDescription className="text-base">{subtitle}</CardDescription>}
          </CardHeader>
          <CardContent>{children}</CardContent>
        </Card>
        {footer && <div className="mt-6 text-center text-sm text-muted">{footer}</div>}
      </motion.div>
    </PageShell>
  )
}
