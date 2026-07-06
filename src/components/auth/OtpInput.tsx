import { useRef, useCallback, type KeyboardEvent, type ClipboardEvent } from 'react'
import { cn } from '@/lib/utils'

interface OtpInputProps {
  value: string
  onChange: (value: string) => void
  length?: number
  disabled?: boolean
  id?: string
  'aria-label'?: string
}

export function OtpInput({
  value,
  onChange,
  length = 6,
  disabled = false,
  id = 'otp-input',
  'aria-label': ariaLabel,
}: OtpInputProps) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([])
  const digits = value.padEnd(length, ' ').slice(0, length).split('')

  const focusInput = (index: number) => {
    inputsRef.current[index]?.focus()
    inputsRef.current[index]?.select()
  }

  const updateValue = useCallback(
    (next: string) => {
      onChange(next.replace(/\D/g, '').slice(0, length))
    },
    [length, onChange]
  )

  const handleChange = (index: number, char: string) => {
    const digit = char.replace(/\D/g, '').slice(-1)
    const next = digits.map((d, i) => (i === index ? digit : d.trim())).join('')
    updateValue(next)
    if (digit && index < length - 1) focusInput(index + 1)
  }

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault()
      if (digits[index]?.trim()) {
        const next = digits
          .map((d, i) => (i === index ? '' : d.trim()))
          .join('')
        updateValue(next)
      } else if (index > 0) {
        focusInput(index - 1)
        const next = digits
          .map((d, i) => (i === index - 1 ? '' : d.trim()))
          .join('')
        updateValue(next)
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      focusInput(index - 1)
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      focusInput(index + 1)
    }
  }

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    updateValue(pasted)
    const focusIndex = Math.min(pasted.length, length - 1)
    focusInput(focusIndex)
  }

  return (
    <div
      id={id}
      role="group"
      aria-label={ariaLabel}
      className="flex justify-center gap-2 sm:gap-3"
    >
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={(el) => {
            inputsRef.current[index] = el
          }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          value={digits[index]?.trim() ?? ''}
          disabled={disabled}
          aria-label={`${ariaLabel ?? 'OTP'} ${index + 1}`}
          className={cn(
            'h-12 w-10 rounded-xl border border-border bg-paper text-center text-lg font-semibold text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-turmeric disabled:opacity-50 sm:h-14 sm:w-12 dark:bg-surface',
            digits[index]?.trim() && 'border-peacock'
          )}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
        />
      ))}
    </div>
  )
}
