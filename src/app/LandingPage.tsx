import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import {
  ChevronDown,
  Shield,
  ClipboardList,
  Heart,
  Phone,
  MessageSquare,
} from 'lucide-react'
import { PageShell } from '@/components/ThemeProvider'
import { AlponaThread, BrandMark } from '@/components/AlponaThread'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] as const },
}

const FAQ_KEYS = ['q1', 'q2', 'q3', 'q4', 'q5'] as const
const STEP_KEYS = ['step1', 'step2', 'step3'] as const
const TESTIMONIAL_KEYS = ['quote1', 'quote2', 'quote3'] as const
const PRIVACY_KEYS = ['statement1', 'statement2', 'statement3', 'statement4'] as const

export function LandingPage() {
  const { t } = useTranslation()
  const [openFaq, setOpenFaq] = useState<string | null>('q1')

  return (
    <PageShell className="text-left">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-[var(--background)]/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2 no-underline">
            <BrandMark />
            <span className="font-display text-lg font-semibold text-foreground">
              {t('common.appName')}
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm">
              <Link to="/login">{t('auth.login.submit')}</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/register">{t('landing.hero.ctaPrimary')}</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-dusk px-4 py-20 text-ink-light sm:px-6 sm:py-28">
        <AlponaThread
          variant="hero"
          className="absolute inset-x-0 bottom-0 w-full opacity-20"
          opacity={0.25}
        />
        <div className="relative mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="max-w-2xl"
          >
            <p className="mb-4 text-sm font-medium text-turmeric">{t('common.tagline')}</p>
            <h1 className="font-display text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
              {t('landing.hero.headline')}
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-ink-light/80">
              {t('landing.hero.subheading')}
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Button asChild size="lg">
                <Link to="/register">{t('landing.hero.ctaPrimary')}</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-ink-light/30 text-ink-light hover:bg-white/10">
                <a href="#how-it-works">{t('landing.hero.ctaSecondary')}</a>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <motion.h2 {...fadeUp} className="font-display text-3xl font-semibold text-foreground">
            {t('landing.howItWorks.title')}
          </motion.h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {STEP_KEYS.map((key, index) => {
              const icons = [ClipboardList, MessageSquare, Heart]
              const Icon = icons[index]
              return (
                <motion.div key={key} {...fadeUp} transition={{ ...fadeUp.transition, delay: index * 0.1 }}>
                  <Card className="h-full border-border/80">
                    <CardContent className="p-6">
                      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-peacock-soft text-peacock">
                        <Icon className="h-6 w-6" />
                      </div>
                      <span className="text-sm font-medium text-turmeric-deep">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <h3 className="mt-2 font-display text-xl font-semibold">
                        {t(`landing.howItWorks.${key}.title`)}
                      </h3>
                      <p className="mt-3 text-sm leading-relaxed text-muted">
                        {t(`landing.howItWorks.${key}.description`)}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Privacy */}
      <section className="px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <motion.div {...fadeUp} className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-peacock" />
            <h2 className="font-display text-3xl font-semibold text-foreground">
              {t('landing.privacy.title')}
            </h2>
          </motion.div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {PRIVACY_KEYS.map((key, index) => (
              <motion.div key={key} {...fadeUp} transition={{ ...fadeUp.transition, delay: index * 0.08 }}>
                <Card className="h-full border-border/80">
                  <CardContent className="flex gap-4 p-5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-peacock-soft text-sm font-semibold text-peacock">
                      {index + 1}
                    </span>
                    <p className="text-sm leading-relaxed text-foreground">
                      {t(`landing.privacy.${key}`)}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-mist px-4 py-20 dark:bg-dusk-3/50 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <motion.h2 {...fadeUp} className="font-display text-3xl font-semibold text-foreground">
            {t('landing.testimonials.title')}
          </motion.h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {TESTIMONIAL_KEYS.map((key, index) => (
              <motion.div key={key} {...fadeUp} transition={{ ...fadeUp.transition, delay: index * 0.1 }}>
                <Card className="h-full border-none bg-paper shadow-sm dark:bg-surface">
                  <CardContent className="p-6">
                    <p className="font-display text-lg italic leading-relaxed text-foreground">
                      &ldquo;{t(`landing.testimonials.${key}.text`)}&rdquo;
                    </p>
                    <p className="mt-4 text-sm text-muted">
                      {t(`landing.testimonials.${key}.attribution`)}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ accordion */}
      <section className="px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <motion.h2 {...fadeUp} className="font-display text-3xl font-semibold text-foreground">
            {t('landing.faq.title')}
          </motion.h2>
          <div className="mt-10 space-y-3">
            {FAQ_KEYS.map((key, index) => {
              const isOpen = openFaq === key
              return (
                <motion.div key={key} {...fadeUp} transition={{ ...fadeUp.transition, delay: index * 0.05 }}>
                  <Card className="overflow-hidden border-border/80">
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-4 p-5 text-left transition-colors hover:bg-dusk/5 dark:hover:bg-white/5"
                      aria-expanded={isOpen}
                      onClick={() => setOpenFaq(isOpen ? null : key)}
                    >
                      <span className="font-medium text-foreground">
                        {t(`landing.faq.${key}.question`)}
                      </span>
                      <ChevronDown
                        className={cn(
                          'h-5 w-5 shrink-0 text-muted transition-transform duration-300',
                          isOpen && 'rotate-180'
                        )}
                      />
                    </button>
                    <motion.div
                      initial={false}
                      animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
                      transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-border/60 px-5 pb-5 pt-0">
                        <p className="pt-4 text-sm leading-relaxed text-muted">
                          {t(`landing.faq.${key}.answer`)}
                        </p>
                      </div>
                    </motion.div>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Footer with crisis numbers */}
      <footer className="border-t border-border bg-dusk px-4 py-12 text-ink-light sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <div className="flex items-center gap-2">
                <BrandMark />
                <span className="font-display text-lg font-semibold">{t('common.appName')}</span>
              </div>
              <p className="mt-3 text-sm text-ink-light/70">{t('landing.footer.tagline')}</p>
            </div>
            <div>
              <h3 className="flex items-center gap-2 font-semibold text-turmeric">
                <Phone className="h-4 w-4" />
                {t('landing.footer.crisisTitle')}
              </h3>
              <ul className="mt-4 space-y-2 text-sm">
                <li>
                  <a href="tel:1098" className="text-ink-light/90 hover:text-turmeric">
                    {t('landing.footer.helpline1098')}
                  </a>
                </li>
                <li>
                  <a href="tel:+8809604445555" className="text-ink-light/90 hover:text-turmeric">
                    {t('landing.footer.kaanPeteRoi')}
                  </a>
                </li>
                <li>
                  <a href="tel:+8801787111111" className="text-ink-light/90 hover:text-turmeric">
                    {t('landing.footer.alapon')}
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/help" className="text-ink-light/70 hover:text-ink-light">
                    {t('landing.footer.privacy')}
                  </Link>
                </li>
                <li>
                  <Link to="/help" className="text-ink-light/70 hover:text-ink-light">
                    {t('landing.footer.terms')}
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <p className="mt-10 border-t border-ink-light/10 pt-6 text-center text-xs text-ink-light/50">
            {t('landing.footer.copyright')}
          </p>
        </div>
      </footer>
    </PageShell>
  )
}
