import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date, locale: string, useBanglaNumerals = false): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const formatted = d.toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  if (useBanglaNumerals && locale === 'bn') {
    return formatted.replace(/\d/g, (digit) => '০১২৩৪৫৬৭৮৯'[parseInt(digit, 10)] ?? digit)
  }
  return formatted
}

export function formatRelativeGroup(date: string, _locale: string): 'today' | 'week' | 'month' | 'older' {
  const d = new Date(date)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'today'
  if (diffDays <= 7) return 'week'
  if (diffDays <= 30) return 'month'
  return 'older'
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
