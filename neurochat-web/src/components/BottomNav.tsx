import { useLocation, useNavigate } from 'react-router-dom'
import { MessageCircle, User, Compass, Users, Gamepad2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { path: '/messages', icon: MessageCircle, label: 'Messages' },
  { path: '/community', icon: Users, label: 'Community' },
  { path: '/games', icon: Gamepad2, label: 'Games' },
  { path: '/discover', icon: Compass, label: 'Discover' },
  { path: '/profile', icon: User, label: 'Profile' },
]

export function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()

  // Hide on conversation view, landing, about, safety pages
  const hidden = /^\/messages\/.+/.test(location.pathname) || ['/', '/landing', '/about', '/safety'].includes(location.pathname)
  if (hidden) return null

  const isActive = (path: string) => {
    if (path === '/messages') return location.pathname.startsWith('/messages')
    return location.pathname === path
  }

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 md:hidden">
      <div className="glass-heavy border-t border-border/50">
        <div className="flex items-center justify-around px-2 py-1">
          {NAV_ITEMS.map(({ path, icon: Icon, label }) => {
            const active = isActive(path)
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={cn(
                  'flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-all min-w-[60px]',
                  active
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <div className="relative">
                  <Icon className={cn('w-5 h-5', active && 'drop-shadow-[0_0_6px_hsl(var(--primary)/0.5)]')} />
                  {active && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                  )}
                </div>
                <span className={cn('text-[10px] font-medium', active && 'text-primary')}>
                  {label}
                </span>
              </button>
            )
          })}
        </div>
      </div>
      {/* Safe area spacer for iOS */}
      <div className="h-[env(safe-area-inset-bottom)]  bg-background" />
    </nav>
  )
}
