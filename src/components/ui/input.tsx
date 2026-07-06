import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-11 w-full rounded-xl border border-border bg-paper px-4 py-2 text-sm text-foreground transition-colors duration-300 placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-turmeric disabled:cursor-not-allowed disabled:opacity-50 dark:bg-surface',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

export { Input }
