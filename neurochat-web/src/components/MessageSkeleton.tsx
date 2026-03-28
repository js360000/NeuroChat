import { cn } from '@/lib/utils'

interface MessageSkeletonProps {
  count?: number
}

function SingleSkeleton({ isMe, width }: { isMe: boolean; width: string }) {
  return (
    <div className={cn('flex gap-3 animate-fade-in', isMe && 'ml-auto flex-row-reverse')}>
      {!isMe && (
        <div className="w-8 h-8 rounded-full bg-muted animate-shimmer bg-shimmer bg-shimmer shrink-0" />
      )}
      <div className={cn('flex flex-col gap-1.5', isMe ? 'items-end' : 'items-start')}>
        <div
          className="h-10 rounded-2xl bg-muted animate-shimmer bg-shimmer bg-shimmer"
          style={{ width }}
        />
        <div className="h-3 w-12 rounded bg-muted/50 animate-shimmer bg-shimmer bg-shimmer" />
      </div>
    </div>
  )
}

export function MessageSkeleton({ count = 5 }: MessageSkeletonProps) {
  const patterns = [
    { isMe: false, width: '180px' },
    { isMe: false, width: '240px' },
    { isMe: true, width: '200px' },
    { isMe: false, width: '160px' },
    { isMe: true, width: '280px' },
    { isMe: true, width: '140px' },
    { isMe: false, width: '220px' },
  ]

  return (
    <div className="space-y-4 p-4">
      {patterns.slice(0, count).map((p, i) => (
        <div key={i} style={{ animationDelay: `${i * 100}ms` }}>
          <SingleSkeleton {...p} />
        </div>
      ))}
    </div>
  )
}

export function ConversationSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-1">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-3 mx-2 rounded-xl animate-fade-in"
          style={{ animationDelay: `${i * 80}ms` }}
        >
          <div className="w-11 h-11 rounded-full bg-muted animate-shimmer bg-shimmer bg-shimmer shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="flex justify-between">
              <div className="h-4 w-24 rounded bg-muted animate-shimmer bg-shimmer bg-shimmer" />
              <div className="h-3 w-10 rounded bg-muted/50 animate-shimmer bg-shimmer bg-shimmer" />
            </div>
            <div className="h-3 w-40 rounded bg-muted/50 animate-shimmer bg-shimmer bg-shimmer" />
          </div>
        </div>
      ))}
    </div>
  )
}
