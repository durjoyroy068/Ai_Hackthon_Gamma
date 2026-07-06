import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  MessageSquarePlus,
  Search,
  Pin,
  FolderOpen,
  BookHeart,
  Calendar,
  ClipboardList,
  Dumbbell,
  Route,
  LayoutDashboard,
  FileText,
  Trophy,
  Settings,
  HelpCircle,
  MessageCircle,
  LogOut,
  ChevronLeft,
  Menu,
  X,
} from 'lucide-react'
import { cn, formatRelativeGroup } from '@/lib/utils'
import { useAppStore, useAuthStore, useChatStore } from '@/features/stores'
import { apiCreateConversation } from '@/lib/api'
import { AlponaThread, BrandMark } from '@/components/AlponaThread'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { EmergencyButton } from '@/components/emergency/EmergencyButton'

const navItems = [
  { key: 'moodJournal', path: '/app/mood-journal', icon: BookHeart },
  { key: 'moodCalendar', path: '/app/mood-calendar', icon: Calendar },
  { key: 'assessment', path: '/app/assessment', icon: ClipboardList },
  { key: 'mindGym', path: '/app/mind-gym', icon: Dumbbell },
  { key: 'recoveryPlan', path: '/app/recovery-plan', icon: Route },
  { key: 'dashboard', path: '/app/dashboard', icon: LayoutDashboard },
  { key: 'reports', path: '/app/reports/weekly', icon: FileText },
  { key: 'achievements', path: '/app/achievements', icon: Trophy },
]

const bottomItems = [
  { key: 'settings', path: '/app/settings', icon: Settings },
  { key: 'help', path: '/app/help', icon: HelpCircle },
  { key: 'feedback', path: '/app/help#feedback', icon: MessageCircle },
]

interface SidebarProps {
  mobile?: boolean
  onClose?: () => void
}

function SidebarContent({ mobile, onClose }: SidebarProps) {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const { sidebarCollapsed, toggleSidebar } = useAppStore()
  const { logout } = useAuthStore()
  const { conversations, addConversation, setActiveConversation } = useChatStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [creatingChat, setCreatingChat] = useState(false)

  const pinned = conversations.filter((c) => c.pinned)
  const filtered = conversations.filter(
    (c) => !searchQuery || c.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const grouped = {
    today: filtered.filter((c) => formatRelativeGroup(c.updatedAt, 'bn') === 'today'),
    week: filtered.filter((c) => formatRelativeGroup(c.updatedAt, 'bn') === 'week'),
    month: filtered.filter((c) => formatRelativeGroup(c.updatedAt, 'bn') === 'month'),
    older: filtered.filter((c) => formatRelativeGroup(c.updatedAt, 'bn') === 'older'),
  }

  const handleNav = (path: string) => {
    navigate(path)
    onClose?.()
  }

  const handleNewChat = async () => {
    if (creatingChat) return
    setCreatingChat(true)
    try {
      const newConv = await apiCreateConversation(t('nav.newChat'))
      addConversation(newConv)
      setActiveConversation(newConv.id)
      navigate(`/app/chat/${newConv.id}`)
      onClose?.()
    } catch {
      toast.error(t('common.error'))
    } finally {
      setCreatingChat(false)
    }
  }

  const collapsed = !mobile && sidebarCollapsed

  return (
    <div
      className={cn(
        'relative flex h-full flex-col bg-dusk text-ink-light',
        collapsed ? 'w-[72px]' : 'w-[280px]'
      )}
    >
      <AlponaThread variant="sidebar" className="absolute inset-x-0 top-0 opacity-[0.15]" animate={false} />

      <div className="relative z-10 flex items-center justify-between p-4">
        <Link to="/app" className="flex items-center gap-2" onClick={onClose}>
          <BrandMark />
          {!collapsed && (
            <span className="font-display text-lg text-ink-light">{t('common.appName')}</span>
          )}
        </Link>
        {!mobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="text-ink-light/70 hover:bg-white/10 hover:text-ink-light"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <ChevronLeft className={cn('h-4 w-4 transition-transform', collapsed && 'rotate-180')} />
          </Button>
        )}
        {mobile && (
          <Button variant="ghost" size="icon" onClick={onClose} className="text-ink-light">
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      <div className="relative z-10 px-3">
        <Button
          className="w-full justify-start gap-2 bg-turmeric text-dusk hover:bg-turmeric-deep"
          onClick={handleNewChat}
          disabled={creatingChat}
        >
          <MessageSquarePlus className="h-4 w-4" />
          {!collapsed && t('nav.newChat')}
        </Button>
      </div>

      {!collapsed && (
        <div className="relative z-10 px-3 pt-3">
          <div className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2">
            <Search className="h-4 w-4 text-ink-light/50" />
            <input
              type="search"
              placeholder={t('nav.searchChats')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-sm text-ink-light placeholder:text-ink-light/40 focus:outline-none"
              aria-label={t('nav.searchChats')}
            />
          </div>
        </div>
      )}

      <ScrollArea className="relative z-10 flex-1 px-3 py-4">
        {!collapsed && pinned.length > 0 && (
          <div className="mb-4">
            <p className="mb-2 flex items-center gap-1 px-2 text-xs font-medium uppercase tracking-wider text-ink-light/50">
              <Pin className="h-3 w-3" />
              {t('nav.pinned')}
            </p>
            {pinned.map((conv) => (
              <button
                key={conv.id}
                onClick={() => handleNav(`/app/chat/${conv.id}`)}
                className={cn(
                  'mb-1 w-full rounded-lg px-3 py-2 text-left text-sm transition-colors duration-300 hover:bg-white/10',
                  location.pathname.includes(conv.id) && 'bg-white/10'
                )}
              >
                {conv.title}
              </button>
            ))}
          </div>
        )}

        {!collapsed && (
          <div className="mb-4">
            <p className="mb-2 px-2 text-xs font-medium uppercase tracking-wider text-ink-light/50">
              {t('nav.recent')}
            </p>
            {(['today', 'week', 'month'] as const).map((group) => {
              const items = grouped[group]
              if (items.length === 0) return null
              return (
                <div key={group} className="mb-2">
                  <p className="px-2 py-1 text-xs text-ink-light/40">
                    {t(`nav.${group === 'today' ? 'today' : group === 'week' ? 'lastWeek' : 'lastMonth'}`)}
                  </p>
                  {items.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => handleNav(`/app/chat/${conv.id}`)}
                      className={cn(
                        'mb-0.5 w-full rounded-lg px-3 py-2 text-left text-sm transition-colors duration-300 hover:bg-white/10',
                        location.pathname.includes(conv.id) && 'bg-white/10'
                      )}
                    >
                      {conv.title}
                    </button>
                  ))}
                </div>
              )
            })}
          </div>
        )}

        {!collapsed && (
          <div className="mb-4">
            <p className="mb-2 flex items-center gap-1 px-2 text-xs font-medium uppercase tracking-wider text-ink-light/50">
              <FolderOpen className="h-3 w-3" />
              {t('nav.folders')}
            </p>
          </div>
        )}

        <Separator className="my-3 bg-white/10" />

        {navItems.map(({ key, path, icon: Icon }) => (
          <button
            key={key}
            onClick={() => handleNav(path)}
            className={cn(
              'mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors duration-300 hover:bg-white/10',
              location.pathname.startsWith(path) && 'bg-white/10 text-turmeric',
              collapsed && 'justify-center px-2'
            )}
            title={collapsed ? t(`nav.${key}`) : undefined}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {!collapsed && t(`nav.${key}`)}
          </button>
        ))}

        <Separator className="my-3 bg-white/10" />

        {bottomItems.map(({ key, path, icon: Icon }) => (
          <button
            key={key}
            onClick={() => handleNav(path)}
            className={cn(
              'mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors duration-300 hover:bg-white/10',
              location.pathname.startsWith(path) && 'bg-white/10',
              collapsed && 'justify-center px-2'
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {!collapsed && t(`nav.${key}`)}
          </button>
        ))}

        <button
          onClick={() => {
            logout()
            navigate('/login')
          }}
          className={cn(
            'mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-alert-soft transition-colors duration-300 hover:bg-alert/20',
            collapsed && 'justify-center px-2'
          )}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && t('nav.logout')}
        </button>
      </ScrollArea>
    </div>
  )
}

export function AppSidebar() {
  return (
    <aside className="hidden h-screen shrink-0 md:block">
      <SidebarContent />
    </aside>
  )
}

export function MobileSidebar() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </Button>
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-dusk/60 backdrop-blur-sm md:hidden"
              onClick={() => setOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="fixed inset-y-0 left-0 z-50 md:hidden"
            >
              <SidebarContent mobile onClose={() => setOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-[var(--background)]">
      <AppSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        {children}
      </div>
      <EmergencyButton />
    </div>
  )
}
