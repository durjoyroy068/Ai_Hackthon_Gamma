import * as React from 'react'
import { cn } from '@/lib/utils'

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        'flex min-h-[100px] w-full rounded-xl border border-border bg-paper px-4 py-3 text-sm text-foreground transition-colors duration-300 placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-turmeric disabled:cursor-not-allowed disabled:opacity-50 dark:bg-surface',
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = 'Textarea'

export { Textarea }
