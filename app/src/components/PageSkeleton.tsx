import { cn } from '@/lib/utils';

function Bone({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-xl bg-muted animate-pulse',
        className
      )}
    />
  );
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-2xl border border-border bg-card p-6 space-y-4', className)}>
      <div className="flex items-center gap-3">
        <Bone className="w-12 h-12 rounded-full" />
        <div className="space-y-2 flex-1">
          <Bone className="h-4 w-2/3" />
          <Bone className="h-3 w-1/3" />
        </div>
      </div>
      <Bone className="h-3 w-full" />
      <Bone className="h-3 w-4/5" />
      <div className="flex gap-2 pt-2">
        <Bone className="h-8 w-20 rounded-lg" />
        <Bone className="h-8 w-20 rounded-lg" />
      </div>
    </div>
  );
}

export function DiscoverySkeleton() {
  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 sm:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Bone className="h-7 w-64" />
            <Bone className="h-4 w-48" />
          </div>
          <div className="flex gap-2">
            <Bone className="h-10 w-32 rounded-xl" />
            <Bone className="h-10 w-24 rounded-xl" />
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Bone key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
        <Bone className="h-12 rounded-2xl" />
        <div className="grid lg:grid-cols-[2fr,1fr] gap-6">
          <Bone className="h-[420px] rounded-3xl" />
          <div className="space-y-4">
            <CardSkeleton />
            <Bone className="h-32 rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function MessagesSkeleton() {
  return (
    <div className="flex h-[calc(100vh-4rem)]">
      <div className="w-80 border-r border-border p-4 space-y-3">
        <Bone className="h-10 rounded-xl" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-3 p-3">
            <Bone className="w-10 h-10 rounded-full flex-shrink-0" />
            <div className="space-y-2 flex-1">
              <Bone className="h-4 w-3/4" />
              <Bone className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
      <div className="flex-1 p-6 space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-border">
          <Bone className="w-10 h-10 rounded-full" />
          <Bone className="h-5 w-32" />
        </div>
        <div className="flex-1 space-y-4 py-8">
          <div className="flex justify-end"><Bone className="h-12 w-48 rounded-2xl" /></div>
          <div className="flex justify-start"><Bone className="h-12 w-56 rounded-2xl" /></div>
          <div className="flex justify-end"><Bone className="h-16 w-52 rounded-2xl" /></div>
          <div className="flex justify-start"><Bone className="h-12 w-40 rounded-2xl" /></div>
        </div>
        <Bone className="h-12 rounded-xl" />
      </div>
    </div>
  );
}

export function MatchesSkeleton() {
  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <Bone className="h-7 w-48" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="flex items-center gap-6">
        <Bone className="w-24 h-24 rounded-full" />
        <div className="space-y-3 flex-1">
          <Bone className="h-7 w-48" />
          <Bone className="h-4 w-32" />
        </div>
      </div>
      <Bone className="h-32 rounded-2xl" />
      <div className="grid md:grid-cols-2 gap-4">
        <Bone className="h-40 rounded-2xl" />
        <Bone className="h-40 rounded-2xl" />
      </div>
    </div>
  );
}

export function GenericPageSkeleton() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Bone className="h-8 w-64" />
      <Bone className="h-4 w-96" />
      <div className="space-y-3">
        <Bone className="h-4 w-full" />
        <Bone className="h-4 w-full" />
        <Bone className="h-4 w-3/4" />
      </div>
      <Bone className="h-48 rounded-2xl" />
    </div>
  );
}
