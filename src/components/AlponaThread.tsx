import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

interface AlponaThreadProps {
  className?: string
  animate?: boolean
  opacity?: number
  variant?: 'hero' | 'progress' | 'watermark' | 'sidebar'
  progress?: number
  dotCount?: number
}

const PATHS = {
  hero: 'M20,180 Q80,80 160,120 T300,60 T480,140 T640,90 T780,160',
  watermark: 'M10,50 Q60,20 110,45 T210,30 T310,55 T400,25',
  sidebar: 'M5,20 Q40,5 75,25 T145,15 T215,35',
  progress: 'M0,20 Q50,5 100,20 T200,20',
}

export function AlponaThread({
  className,
  animate = true,
  opacity = 0.15,
  variant = 'watermark',
  progress = 0,
  dotCount = 5,
}: AlponaThreadProps) {
  const pathRef = useRef<SVGPathElement>(null)
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  useEffect(() => {
    if (!animate || prefersReducedMotion || !pathRef.current) return
    const length = pathRef.current.getTotalLength()
    pathRef.current.style.strokeDasharray = `${length}`
    pathRef.current.style.strokeDashoffset = `${length}`
    requestAnimationFrame(() => {
      if (pathRef.current) {
        pathRef.current.style.transition = 'stroke-dashoffset 2s var(--ease-settle)'
        pathRef.current.style.strokeDashoffset = '0'
      }
    })
  }, [animate, prefersReducedMotion])

  const path = PATHS[variant === 'progress' ? 'progress' : variant] ?? PATHS.watermark

  if (variant === 'progress') {
    const activeDots = Math.round((progress / 100) * dotCount)
    return (
      <div className={cn('relative w-full', className)}>
        <svg viewBox="0 0 200 40" className="w-full h-10" aria-hidden="true">
          <path
            d={PATHS.progress}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-turmeric/30"
          />
          {Array.from({ length: dotCount }).map((_, i) => {
            const t = dotCount > 1 ? i / (dotCount - 1) : 0
            const x = t * 200
            const y = 20 + Math.sin(t * Math.PI) * -8
            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r={i < activeDots ? 5 : 3}
                className={cn(
                  'transition-all duration-500',
                  i < activeDots ? 'fill-turmeric' : 'fill-muted/40'
                )}
              />
            )
          })}
        </svg>
      </div>
    )
  }

  return (
    <svg
      className={cn('pointer-events-none', className)}
      viewBox={variant === 'hero' ? '0 0 800 200' : variant === 'sidebar' ? '0 0 220 40' : '0 0 400 60'}
      aria-hidden="true"
      style={{ opacity }}
    >
      <path
        ref={pathRef}
        d={path}
        fill="none"
        stroke="currentColor"
        strokeWidth={variant === 'hero' ? 2 : 1.5}
        strokeLinecap="round"
        className="text-turmeric"
      />
      {variant === 'hero' && (
        <>
          <circle cx="160" cy="120" r="4" className="fill-peacock" />
          <circle cx="480" cy="140" r="3" className="fill-turmeric" />
          <circle cx="640" cy="90" r="3" className="fill-peacock" />
        </>
      )}
    </svg>
  )
}

export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn('h-8 w-8', className)} aria-hidden="true">
      <circle cx="16" cy="16" r="14" className="fill-dusk" />
      <path
        d="M6 16 Q10 8 16 12 Q22 16 26 10"
        fill="none"
        stroke="#F0C33F"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="16" cy="20" r="3" fill="#B9D2C4" />
    </svg>
  )
}
