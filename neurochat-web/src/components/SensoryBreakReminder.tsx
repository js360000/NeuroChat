import { useState, useEffect } from 'react'
import { Flower2, X, Timer } from 'lucide-react'
import { useChatStore } from '@/stores/chatStore'
import { cn } from '@/lib/utils'

export function SensoryBreakReminder() {
  const [visible, setVisible] = useState(false)
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale')
  const [showBreathing, setShowBreathing] = useState(false)
  const { shouldShowBreakReminder, recordBreakReminder, sensoryBreakInterval } = useChatStore()

  useEffect(() => {
    if (sensoryBreakInterval === 0) return

    const check = setInterval(() => {
      if (shouldShowBreakReminder()) {
        setVisible(true)
      }
    }, 30000) // check every 30s

    return () => clearInterval(check)
  }, [sensoryBreakInterval, shouldShowBreakReminder])

  useEffect(() => {
    if (!showBreathing) return
    const phases: Array<'inhale' | 'hold' | 'exhale'> = ['inhale', 'hold', 'exhale']
    let idx = 0
    const cycle = setInterval(() => {
      idx = (idx + 1) % 3
      setBreathPhase(phases[idx])
    }, 4000)
    return () => clearInterval(cycle)
  }, [showBreathing])

  function dismiss() {
    setVisible(false)
    setShowBreathing(false)
    recordBreakReminder()
  }

  if (!visible) return null

  return (
    <div className="fixed inset-x-0 bottom-20 md:bottom-6 flex justify-center z-50 px-4 animate-slide-up">
      <div className="glass-heavy rounded-2xl p-4 max-w-sm w-full shadow-glow-md">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
            <Flower2 className="w-5 h-5 text-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">Time for a breather</h4>
              <button onClick={dismiss} className="p-1 rounded-lg hover:bg-muted/50">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              You've been chatting for {sensoryBreakInterval} minutes. A short break can help reset your social energy.
            </p>

            {showBreathing ? (
              <div className="mt-3 flex flex-col items-center py-4">
                <div
                  className={cn(
                    'w-16 h-16 rounded-full transition-all duration-[4000ms] ease-in-out',
                    'bg-gradient-to-br from-primary/30 to-accent/30',
                    breathPhase === 'inhale' && 'scale-125 opacity-100',
                    breathPhase === 'hold' && 'scale-125 opacity-80',
                    breathPhase === 'exhale' && 'scale-100 opacity-60',
                  )}
                />
                <p className="mt-3 text-xs font-medium text-primary capitalize">{breathPhase}...</p>
                <button
                  onClick={dismiss}
                  className="mt-3 text-xs text-muted-foreground hover:text-foreground"
                >
                  I'm good, thanks
                </button>
              </div>
            ) : (
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => setShowBreathing(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
                >
                  <Flower2 className="w-3 h-3" />
                  Breathing exercise
                </button>
                <button
                  onClick={dismiss}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted text-muted-foreground text-xs hover:bg-muted/80 transition-colors"
                >
                  <Timer className="w-3 h-3" />
                  Remind later
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
