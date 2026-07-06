import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Search,
  Bell,
  Moon,
  Sun,
  Globe,
  User,
  Crown,
} from 'lucide-react'
import { useAppStore, useAuthStore, useWellnessStore } from '@/features/stores'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { MobileSidebar } from '@/components/AppSidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function TopNav() {
  const { t, i18n } = useTranslation()
  const { theme, setTheme, language, setLanguage } = useAppStore()
  const { user } = useAuthStore()
  const { notifications } = useWellnessStore()
  const unreadCount = notifications.filter((n) => !n.read).length

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  const toggleLanguage = () => {
    const next = language === 'bn' ? 'en' : 'bn'
    setLanguage(next)
    i18n.changeLanguage(next)
  }

  const initials = user?.fullName
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-paper/80 px-4 backdrop-blur-sm dark:bg-surface/80">
      <div className="flex items-center gap-3">
        <MobileSidebar />
        <Button variant="ghost" size="icon" aria-label={t('common.search')}>
          <Search className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        <Button variant="ghost" size="icon" className="relative" aria-label={t('nav.notifications')}>
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-turmeric text-[10px] font-bold text-dusk">
              {unreadCount}
            </span>
          )}
        </Button>

        <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label={t('settings.appearance.darkMode')}>
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        <Button variant="ghost" size="sm" onClick={toggleLanguage} className="gap-1 px-2">
          <Globe className="h-4 w-4" />
          <span className="text-xs font-medium uppercase">{language}</span>
        </Button>

        <span className="hidden items-center gap-1 rounded-full bg-turmeric/20 px-2 py-1 text-xs font-medium text-turmeric-deep sm:flex">
          <Crown className="h-3 w-3" />
          {t('nav.freePlan')}
        </span>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full" aria-label={t('nav.profile')}>
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-dusk text-white text-xs">{initials}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem asChild>
              <Link to="/app/profile">
                <User className="mr-2 h-4 w-4" />
                {t('nav.profile')}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/app/settings">{t('nav.settings')}</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/app/help">{t('nav.help')}</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
