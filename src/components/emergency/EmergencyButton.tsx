import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Phone } from 'lucide-react'
import { cn } from '@/lib/utils'

export function EmergencyButton({ className }: { className?: string }) {
  const { t } = useTranslation()

  return (
    <Link
      to="/app/emergency"
      className={cn(
        'emergency-pulse fixed bottom-6 right-6 z-[100] flex items-center gap-2 rounded-full bg-alert px-5 py-3 text-sm font-semibold text-white shadow-lg transition-transform duration-300 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-alert focus-visible:ring-offset-2',
        className
      )}
      aria-label={t('emergency.button')}
    >
      <Phone className="h-4 w-4" aria-hidden="true" />
      <span>{t('emergency.button')}</span>
    </Link>
  )
}
