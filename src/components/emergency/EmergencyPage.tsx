import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { Phone, ExternalLink, Heart, Wind } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { EMERGENCY_RESOURCES } from '@/lib/assessment-data'
import { apiGetEmergencyResources, apiUpdateSafetyPlan } from '@/lib/api'
import { useWellnessStore } from '@/features/stores'

type EmergencyResource = {
  id: string
  name: string
  nameBn?: string
  phone: string
  url?: string
}

export function EmergencyPage() {
  const { t, i18n } = useTranslation()
  const { trustedContacts, safetyPlan, setSafetyPlan } = useWellnessStore()
  const [resources, setResources] = useState<EmergencyResource[]>([])
  const [warningSign, setWarningSign] = useState('')
  const [copingStrategy, setCopingStrategy] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    apiGetEmergencyResources()
      .then(setResources)
      .catch(() => {
        setResources(
          EMERGENCY_RESOURCES.map((r) => ({
            id: r.id,
            name: t(r.nameKey),
            phone: r.phone,
            url: r.url,
          }))
        )
      })
  }, [t])

  const handleSaveSafetyPlan = async () => {
    const warningSigns = [...(safetyPlan?.warningSigns ?? [])]
    const copingStrategies = [...(safetyPlan?.copingStrategies ?? [])]
    if (warningSign.trim()) warningSigns.push(warningSign.trim())
    if (copingStrategy.trim()) copingStrategies.push(copingStrategy.trim())

    setSaving(true)
    try {
      const updated = await apiUpdateSafetyPlan({
        id: safetyPlan?.id ?? 'new',
        warningSigns,
        copingStrategies,
        distractions: safetyPlan?.distractions ?? [],
        trustedPeople: safetyPlan?.trustedPeople ?? [],
        professionalContacts: safetyPlan?.professionalContacts ?? [],
        safeEnvironment: safetyPlan?.safeEnvironment ?? [],
      })
      setSafetyPlan(updated)
      setWarningSign('')
      setCopingStrategy('')
      toast.success(t('common.success'))
    } catch {
      toast.error(t('common.error'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-6 pb-24">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <h1 className="font-display text-3xl text-foreground">{t('emergency.title')}</h1>
        <p className="mt-2 text-muted">{t('emergency.subtitle')}</p>
      </motion.div>

      <section aria-labelledby="helplines-heading">
        <h2 id="helplines-heading" className="mb-4 text-lg font-semibold">
          {t('emergency.resourcesTitle')}
        </h2>
        <div className="space-y-4">
          {resources.map((resource) => (
            <Card key={resource.id} className="border-alert/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">
                  {i18n.language === 'bn' && resource.nameBn ? resource.nameBn : resource.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-3">
                  <Button asChild variant="destructive">
                    <a href={`tel:${resource.phone}`}>
                      <Phone className="h-4 w-4" />
                      {resource.phone}
                    </a>
                  </Button>
                  {resource.url && (
                    <Button asChild variant="outline">
                      <a href={resource.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                        {t('emergency.visitWebsite')}
                      </a>
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted">{t('emergency.policyNote')}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {trustedContacts.length > 0 && (
        <section aria-labelledby="trusted-heading">
          <h2 id="trusted-heading" className="mb-4 text-lg font-semibold">
            {t('emergency.trustedPerson')}
          </h2>
          {trustedContacts.map((contact) => (
            <Card key={contact.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium">{contact.name}</p>
                  <p className="text-sm text-muted">{contact.relationship}</p>
                </div>
                <Button asChild variant="secondary">
                  <a href={`tel:${contact.phone}`}>
                    <Phone className="h-4 w-4" />
                    {t('emergency.call')}
                  </a>
                </Button>
              </CardContent>
            </Card>
          ))}
        </section>
      )}

      <section aria-labelledby="breathing-heading">
        <Card className="bg-peacock-soft/30 dark:bg-peacock/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wind className="h-5 w-5 text-peacock" />
              {t('emergency.breathing.title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted">{t('emergency.breathing.description')}</p>
            <Button asChild className="mt-4" variant="secondary">
              <Link to="/app/emergency/breathing">{t('emergency.breathing.start')}</Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      <section aria-labelledby="safety-plan-heading">
        <h2 id="safety-plan-heading" className="mb-4 text-lg font-semibold">
          {t('emergency.safetyPlan.title')}
        </h2>
        <Card>
          <CardContent className="space-y-4 p-6">
            <p className="text-sm text-muted">{t('emergency.safetyPlan.description')}</p>
            {safetyPlan && (
              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-medium">{t('emergency.safetyPlan.warningSigns')}</p>
                  <ul className="mt-1 list-inside list-disc text-muted">
                    {safetyPlan.warningSigns.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="font-medium">{t('emergency.safetyPlan.coping')}</p>
                  <ul className="mt-1 list-inside list-disc text-muted">
                    {safetyPlan.copingStrategies.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="warning-sign">{t('emergency.safetyPlan.addWarning')}</Label>
                <Input
                  id="warning-sign"
                  className="mt-1"
                  value={warningSign}
                  onChange={(e) => setWarningSign(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="coping">{t('emergency.safetyPlan.addCoping')}</Label>
                <Input
                  id="coping"
                  className="mt-1"
                  value={copingStrategy}
                  onChange={(e) => setCopingStrategy(e.target.value)}
                />
              </div>
            </div>
            <Button variant="outline" disabled={saving} onClick={handleSaveSafetyPlan}>
              <Heart className="h-4 w-4" />
              {t('emergency.safetyPlan.save')}
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

export function BreathingExercisePage() {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
      <motion.div
        animate={{ scale: [1, 1.3, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="mb-8 h-40 w-40 rounded-full bg-peacock-soft dark:bg-peacock/20"
      />
      <h1 className="font-display text-2xl">{t('emergency.breathing.title')}</h1>
      <p className="mt-4 max-w-md text-muted">{t('emergency.breathing.instructions')}</p>
      <Button asChild variant="ghost" className="mt-8">
        <Link to="/app/emergency">{t('common.back')}</Link>
      </Button>
    </div>
  )
}
