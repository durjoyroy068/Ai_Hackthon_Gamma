import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { TopNav } from '@/components/TopNav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useAuthStore, useWellnessStore, useChatStore } from '@/features/stores'
import { apiUpdateUser, apiDeleteAccount, apiChangePassword, apiClearChatMemory } from '@/lib/api'

const slowTransition = { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const }

export function ProfilePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user, updateUser, logout } = useAuthStore()
  const { notifications } = useWellnessStore()
  const [saving, setSaving] = useState(false)
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const initials = user?.fullName
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)

  if (!user) {
    return (
      <>
        <TopNav />
        <main className="flex flex-1 items-center justify-center p-6">
          <p className="text-muted">{t('common.loading')}</p>
        </main>
      </>
    )
  }

  return (
    <>
      <TopNav />
      <main className="flex-1 overflow-y-auto">
        <motion.div
          className="mx-auto max-w-2xl space-y-6 p-6 pb-24"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={slowTransition}
        >
          <div>
            <h1 className="font-display text-3xl text-foreground">{t('profile.title')}</h1>
          </div>

          <Card>
            <CardContent className="flex flex-col items-center gap-4 pt-8">
              <Avatar className="h-24 w-24">
                <AvatarFallback className="bg-dusk text-2xl text-white">{initials}</AvatarFallback>
              </Avatar>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toast(t('profile.changePhotoSoon', { defaultValue: 'Photo upload coming soon' }))}
              >
                {t('profile.changePhoto')}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('profile.editProfile')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">{t('profile.fullName')}</Label>
                <Input
                  id="fullName"
                  value={user.fullName}
                  onChange={(e) => updateUser({ fullName: e.target.value })}
                />
              </div>
              <Button
                disabled={saving}
                onClick={async () => {
                  setSaving(true)
                  try {
                    const updated = await apiUpdateUser({
                      fullName: user.fullName,
                      isAnonymous: user.isAnonymous,
                    })
                    updateUser(updated)
                    toast.success(t('common.success'))
                  } catch {
                    toast.error(t('common.error'))
                  } finally {
                    setSaving(false)
                  }
                }}
              >
                {t('common.save')}
              </Button>
              <div className="space-y-2">
                <Label htmlFor="email">{t('profile.email')}</Label>
                <Input id="email" type="email" value={user.email} readOnly />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">{t('profile.phone')}</Label>
                <Input id="phone" value={user.phone} readOnly />
              </div>
              <div className="space-y-2">
                <Label htmlFor="recoveryEmail">{t('profile.recoveryEmail')}</Label>
                <Input id="recoveryEmail" value={user.recoveryEmail ?? ''} readOnly />
              </div>
              <div className="space-y-2">
                <Label htmlFor="recoveryPhone">{t('profile.recoveryPhone')}</Label>
                <Input id="recoveryPhone" value={user.recoveryPhone ?? ''} readOnly />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <Label htmlFor="anonymous">{t('profile.anonymous')}</Label>
                <Switch
                  id="anonymous"
                  checked={user.isAnonymous}
                  onCheckedChange={(v) => updateUser({ isAnonymous: v })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('profile.aiMemory.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted">{t('profile.aiMemory.description')}</p>
              <Button
                variant="outline"
                onClick={async () => {
                  if (!confirm(t('profile.aiMemory.confirm', { defaultValue: 'Clear all chat history?' }))) return
                  try {
                    await apiClearChatMemory()
                    useChatStore.setState({ conversations: [] })
                    toast.success(t('common.success'))
                  } catch {
                    toast.error(t('common.error'))
                  }
                }}
              >
                {t('profile.aiMemory.reset')}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('profile.notifications')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted">
                {notifications.filter((n) => !n.read).length} — {t('notifications.title')}
              </p>
            </CardContent>
          </Card>

          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => setShowPasswordForm((v) => !v)}>
              {t('profile.changePassword')}
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (!confirm(t('settings.dataPrivacy.deleteWarning'))) return
                try {
                  await apiDeleteAccount()
                  logout()
                  navigate('/')
                } catch {
                  toast.error(t('common.error'))
                }
              }}
            >
              {t('profile.deleteAccount')}
            </Button>
          </div>

          {showPasswordForm && (
            <Card>
              <CardHeader>
                <CardTitle>{t('profile.changePassword')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  type="password"
                  placeholder={t('auth.login.password')}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
                <Input
                  type="password"
                  placeholder={t('auth.resetPassword.password')}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <Input
                  type="password"
                  placeholder={t('auth.resetPassword.confirmPassword')}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <Button
                  onClick={async () => {
                    if (newPassword.length < 8 || newPassword !== confirmPassword) {
                      toast.error(t('auth.errors.weakPassword'))
                      return
                    }
                    try {
                      await apiChangePassword(currentPassword, newPassword, confirmPassword)
                      toast.success(t('common.success'))
                      setShowPasswordForm(false)
                      setCurrentPassword('')
                      setNewPassword('')
                      setConfirmPassword('')
                    } catch {
                      toast.error(t('common.error'))
                    }
                  }}
                >
                  {t('common.save')}
                </Button>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </main>
    </>
  )
}
