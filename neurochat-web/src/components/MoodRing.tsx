import { cn } from '@/lib/utils'

export type MoodType = 'positive' | 'neutral' | 'tense' | 'playful' | 'supportive'

const MOOD_STYLES: Record<MoodType, { colors: string; label: string }> = {
  positive:   { colors: 'from-emerald-400 via-cyan-400 to-emerald-400', label: 'Positive vibes' },
  neutral:    { colors: 'from-blue-400 via-indigo-400 to-blue-400',      label: 'Chill conversation' },
  tense:      { colors: 'from-orange-400 via-red-400 to-orange-400',     label: 'Needs care' },
  playful:    { colors: 'from-pink-400 via-purple-400 to-pink-400',      label: 'Fun energy' },
  supportive: { colors: 'from-violet-400 via-blue-400 to-violet-400',    label: 'Supportive' },
}

interface MoodRingProps {
  mood?: MoodType
  isOnline?: boolean
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
  className?: string
  showLabel?: boolean
}

export function MoodRing({
  mood,
  isOnline,
  children,
  size = 'md',
  className,
  showLabel = false,
}: MoodRingProps) {
  const sizeClass = {
    sm: 'w-8 h-8',
    md: 'w-11 h-11',
    lg: 'w-14 h-14',
  }[size]

  const ringPadding = {
    sm: 'p-[2px]',
    md: 'p-[3px]',
    lg: 'p-[3px]',
  }[size]

  const moodStyle = mood ? MOOD_STYLES[mood] : null

  return (
    <div className={cn('relative inline-flex flex-col items-center gap-1', className)}>
      {/* Outer mood ring */}
      <div
        className={cn(
          'relative rounded-full',
          ringPadding,
          moodStyle
            ? `bg-gradient-to-r ${moodStyle.colors} animate-breathe`
            : 'bg-border'
        )}
      >
        {/* Inner avatar container */}
        <div className={cn(sizeClass, 'rounded-full overflow-hidden bg-background')}>
          {children}
        </div>

        {/* Online status dot */}
        {isOnline !== undefined && (
          <div
            className={cn(
              'absolute bottom-0 right-0 rounded-full border-2 border-background',
              size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3',
              isOnline
                ? 'bg-emerald-400 animate-status-pulse text-emerald-400'
                : 'bg-muted-foreground/50'
            )}
          />
        )}
      </div>

      {/* Mood label */}
      {showLabel && moodStyle && (
        <span className="text-[9px] text-muted-foreground font-medium tracking-wide">
          {moodStyle.label}
        </span>
      )}
    </div>
  )
}
