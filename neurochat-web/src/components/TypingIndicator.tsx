import { cn } from '@/lib/utils'

interface TypingIndicatorProps {
  name?: string
  className?: string
}

export function TypingIndicator({ name, className }: TypingIndicatorProps) {
  return (
    <div className={cn('flex items-center gap-2 animate-fade-in', className)}>
      <div className="flex items-center gap-1 px-4 py-3 rounded-2xl bg-muted/60 glass">
        <div className="w-2 h-2 rounded-full bg-primary/60 animate-typing-1" />
        <div className="w-2 h-2 rounded-full bg-primary/60 animate-typing-2" />
        <div className="w-2 h-2 rounded-full bg-primary/60 animate-typing-3" />
      </div>
      {name && (
        <span className="text-xs text-muted-foreground">{name} is typing</span>
      )}
    </div>
  )
}
