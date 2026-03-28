import { useState, useEffect } from 'react'
import { Sparkles, RefreshCw } from 'lucide-react'
import { aiApi } from '@/lib/api/ai'
import { cn } from '@/lib/utils'
import type { Message } from '@/types'

interface SmartRepliesProps {
  lastMessage?: Message
  onSelect: (text: string) => void
  className?: string
}

const FALLBACK_REPLIES = [
  "That's interesting, tell me more!",
  "I appreciate you sharing that",
  "How does that make you feel?",
  "I see what you mean",
]

export function SmartReplies({ lastMessage, onSelect, className }: SmartRepliesProps) {
  const [replies, setReplies] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (!lastMessage || lastMessage.isMe) {
      setReplies([])
      setDismissed(false)
      return
    }
    generateReplies()
  }, [lastMessage?.id])

  async function generateReplies() {
    if (!lastMessage) return
    setIsLoading(true)
    setDismissed(false)
    try {
      const data = await aiApi.getSuggestions({
        userInterests: [],
        myInterests: [],
        previousMessages: [{ sender: lastMessage.sender.name, content: lastMessage.content }],
      })
      setReplies(data.suggestions?.slice(0, 4) || FALLBACK_REPLIES.slice(0, 3))
    } catch {
      // Use context-aware fallbacks
      setReplies(FALLBACK_REPLIES.slice(0, 3))
    } finally {
      setIsLoading(false)
    }
  }

  if (dismissed || (!replies.length && !isLoading) || !lastMessage || lastMessage.isMe) {
    return null
  }

  return (
    <div className={cn('animate-slide-up', className)}>
      <div className="flex items-center gap-1.5 mb-2 px-1">
        <Sparkles className="w-3 h-3 text-primary/60" />
        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
          Quick replies
        </span>
        <button
          onClick={generateReplies}
          disabled={isLoading}
          className="ml-auto p-1 rounded hover:bg-muted/50 disabled:opacity-50"
          title="Refresh suggestions"
        >
          <RefreshCw className={cn('w-3 h-3 text-muted-foreground', isLoading && 'animate-spin')} />
        </button>
      </div>
      <div className="flex gap-1.5 flex-wrap">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-8 rounded-xl bg-muted animate-shimmer bg-shimmer bg-shimmer"
              style={{ width: `${80 + Math.random() * 60}px`, animationDelay: `${i * 100}ms` }}
            />
          ))
        ) : (
          replies.map((reply, i) => (
            <button
              key={i}
              onClick={() => { onSelect(reply); setDismissed(true) }}
              className={cn(
                'px-3 py-1.5 rounded-xl text-xs font-medium transition-all',
                'glass hover:bg-primary/10 hover:text-primary hover:glow-sm',
                'active:scale-95'
              )}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              {reply}
            </button>
          ))
        )}
      </div>
    </div>
  )
}
