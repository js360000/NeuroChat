import { useState, useEffect, useRef } from 'react'
import {
  Users, Plus, LogOut, Hand,
  BookOpen, Gamepad2, Briefcase, Scissors, Tv, Music,
  Pencil, Coffee, Loader2, X, ChevronRight,
} from 'lucide-react'
import { cn, getInitials } from '@/lib/utils'
import { roomsApi } from '@/lib/api/rooms'
import { toast } from 'sonner'

// ═══════════════════════════════════════════
// Types
// ═══════════════════════════════════════════

interface Participant {
  id: string
  name: string
  avatar?: string
  status: 'present' | 'focused' | 'away' | 'resting'
  activity?: string
  isCreator?: boolean
}

interface Room {
  id: string
  name: string
  activity: string
  activityEmoji: string
  creator: string
  participants: Participant[]
  maxParticipants: number
  createdAt: string
}

type StatusType = 'present' | 'focused' | 'away' | 'resting'

// ═══════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════

const ACTIVITIES = [
  { label: 'Reading', emoji: '\uD83D\uDCD6', icon: BookOpen },
  { label: 'Gaming', emoji: '\uD83C\uDFAE', icon: Gamepad2 },
  { label: 'Working', emoji: '\uD83D\uDCBC', icon: Briefcase },
  { label: 'Crafting', emoji: '\u2702\uFE0F', icon: Scissors },
  { label: 'Watching', emoji: '\uD83D\uDCFA', icon: Tv },
  { label: 'Music', emoji: '\uD83C\uDFB5', icon: Music },
  { label: 'Drawing', emoji: '\uD83C\uDFA8', icon: Pencil },
  { label: 'Just vibing', emoji: '\u2615', icon: Coffee },
] as const

const STATUS_CONFIG: Record<StatusType, { label: string; color: string; ring: string; dot: string }> = {
  present: { label: 'Present', color: 'text-emerald-400', ring: 'ring-emerald-400/40', dot: 'bg-emerald-400' },
  focused: { label: 'Focused', color: 'text-amber-400', ring: 'ring-amber-400/40', dot: 'bg-amber-400' },
  away: { label: 'Away', color: 'text-zinc-400', ring: 'ring-zinc-400/40', dot: 'bg-zinc-400' },
  resting: { label: 'Resting', color: 'text-violet-400', ring: 'ring-violet-400/40', dot: 'bg-violet-400' },
}

const REACTIONS = [
  { emoji: '\uD83D\uDC4B', label: 'Wave' },
  { emoji: '\u2764\uFE0F', label: 'Heart' },
  { emoji: '\u2728', label: 'Sparkle' },
  { emoji: '\uD83D\uDC4D', label: 'Thumbs up' },
] as const

// Organic-feeling positions for participants (max 8)
const PARTICIPANT_POSITIONS = [
  { top: '18%', left: '50%', scale: 1.1 },
  { top: '35%', left: '22%', scale: 1.0 },
  { top: '32%', left: '78%', scale: 1.0 },
  { top: '55%', left: '35%', scale: 0.95 },
  { top: '52%', left: '68%', scale: 0.95 },
  { top: '70%', left: '18%', scale: 0.9 },
  { top: '72%', left: '82%', scale: 0.9 },
  { top: '72%', left: '50%', scale: 0.9 },
]

// ═══════════════════════════════════════════
// Floating Reaction
// ═══════════════════════════════════════════

function FloatingReaction({
  emoji,
  x,
  onDone,
}: {
  emoji: string
  x: number
  onDone: () => void
}) {
  useEffect(() => {
    const timer = setTimeout(onDone, 2000)
    return () => clearTimeout(timer)
  }, [onDone])

  return (
    <div
      className="absolute pointer-events-none text-2xl animate-reaction-float"
      style={{
        left: `${x}%`,
        bottom: '10%',
      }}
    >
      {emoji}
    </div>
  )
}

// ═══════════════════════════════════════════
// Ambient Background
// ═══════════════════════════════════════════

function AmbientBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        className="absolute w-[500px] h-[500px] rounded-full opacity-[0.04] animate-ambient-drift-1"
        style={{
          background: 'radial-gradient(circle, hsl(var(--primary)), transparent 70%)',
          top: '-10%',
          left: '-10%',
        }}
      />
      <div
        className="absolute w-[400px] h-[400px] rounded-full opacity-[0.03] animate-ambient-drift-2"
        style={{
          background: 'radial-gradient(circle, hsl(var(--secondary)), transparent 70%)',
          bottom: '-5%',
          right: '-5%',
        }}
      />
      <div
        className="absolute w-[300px] h-[300px] rounded-full opacity-[0.025] animate-ambient-drift-3"
        style={{
          background: 'radial-gradient(circle, hsl(var(--accent)), transparent 70%)',
          top: '40%',
          left: '60%',
        }}
      />
    </div>
  )
}

// ═══════════════════════════════════════════
// Participant Circle
// ═══════════════════════════════════════════

function ParticipantCircle({
  participant,
  position,
  isYou,
}: {
  participant: Participant
  position: { top: string; left: string; scale: number }
  isYou: boolean
}) {
  const config = STATUS_CONFIG[participant.status]

  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1.5 transition-all duration-700 ease-out"
      style={{
        top: position.top,
        left: position.left,
        transform: `translate(-50%, -50%) scale(${position.scale})`,
      }}
    >
      {/* Avatar with status ring */}
      <div className="relative group">
        <div
          className={cn(
            'w-14 h-14 rounded-full flex items-center justify-center text-base font-semibold transition-all duration-500',
            'ring-2 ring-offset-2 ring-offset-background',
            config.ring,
            isYou && 'ring-[3px]',
            'animate-participant-breathe'
          )}
          style={{
            animationDelay: `${Math.random() * 3}s`,
            background: participant.avatar
              ? `url(${participant.avatar}) center/cover`
              : undefined,
          }}
        >
          {!participant.avatar && (
            <div className="w-full h-full rounded-full bg-gradient-to-br from-primary/60 to-secondary/60 flex items-center justify-center text-white">
              {getInitials(participant.name)}
            </div>
          )}
        </div>

        {/* Status dot */}
        <div
          className={cn(
            'absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-background transition-colors',
            config.dot,
            participant.status === 'present' && 'animate-gentle-pulse'
          )}
        />

        {/* Activity tooltip on hover */}
        {participant.activity && (
          <div className="absolute -top-9 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            <div className="px-2.5 py-1 rounded-lg glass text-[10px] text-muted-foreground whitespace-nowrap">
              {participant.activity}
            </div>
          </div>
        )}
      </div>

      {/* Name */}
      <span
        className={cn(
          'text-[11px] font-medium text-foreground/80 max-w-[80px] truncate text-center',
          isYou && 'text-primary'
        )}
      >
        {isYou ? 'You' : participant.name}
      </span>

      {/* Status label */}
      <span className={cn('text-[9px] font-medium', config.color)}>
        {config.label}
      </span>
    </div>
  )
}

// ═══════════════════════════════════════════
// Room Card
// ═══════════════════════════════════════════

function RoomCard({
  room,
  onJoin,
}: {
  room: Room
  onJoin: (room: Room) => void
}) {
  const activityConfig = ACTIVITIES.find((a) => a.label === room.activity)
  const isFull = room.participants.length >= room.maxParticipants

  return (
    <button
      onClick={() => !isFull && onJoin(room)}
      disabled={isFull}
      className={cn(
        'relative w-full text-left p-5 rounded-2xl glass transition-all duration-300 group',
        'hover:glow-sm hover:scale-[1.01] active:scale-[0.99]',
        isFull && 'opacity-60 cursor-not-allowed hover:scale-100 hover:shadow-none'
      )}
    >
      {/* Breathing glow - alive indicator */}
      <div className="absolute inset-0 rounded-2xl animate-room-breathe pointer-events-none" />

      {/* Activity emoji + name */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl" role="img" aria-label={room.activity}>
            {room.activityEmoji || activityConfig?.emoji || '\u2615'}
          </span>
          <div>
            <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
              {room.name}
            </h3>
            <span className="text-[11px] text-muted-foreground">
              {room.activity}
            </span>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary/60 group-hover:translate-x-0.5 transition-all" />
      </div>

      {/* Participant avatars */}
      <div className="flex items-center gap-2 mt-1">
        <div className="flex -space-x-2">
          {room.participants.slice(0, 4).map((p) => (
            <div
              key={p.id}
              className="w-7 h-7 rounded-full border-2 border-background bg-gradient-to-br from-primary/50 to-secondary/50 flex items-center justify-center text-[9px] font-medium text-white"
              title={p.name}
            >
              {getInitials(p.name)}
            </div>
          ))}
          {room.participants.length > 4 && (
            <div className="w-7 h-7 rounded-full border-2 border-background bg-muted/60 flex items-center justify-center text-[9px] font-medium text-muted-foreground">
              +{room.participants.length - 4}
            </div>
          )}
        </div>

        <span className="text-[11px] text-muted-foreground ml-auto tabular-nums">
          {room.participants.length}/{room.maxParticipants}
        </span>
      </div>

      {/* Creator */}
      <div className="mt-3 pt-2.5 border-t border-border/30">
        <span className="text-[10px] text-muted-foreground/60">
          Created by {room.creator}
        </span>
      </div>

      {/* Full badge */}
      {isFull && (
        <div className="absolute top-3 right-3 px-2 py-0.5 rounded-md bg-muted/60 text-[10px] font-medium text-muted-foreground">
          Full
        </div>
      )}
    </button>
  )
}

// ═══════════════════════════════════════════
// Create Room Modal
// ═══════════════════════════════════════════

function CreateRoomModal({
  isOpen,
  onClose,
  onCreate,
}: {
  isOpen: boolean
  onClose: () => void
  onCreate: (room: Room) => void
}) {
  const [name, setName] = useState('')
  const [activity, setActivity] = useState('Just vibing')
  const [customActivity, setCustomActivity] = useState('')
  const [maxParticipants, setMaxParticipants] = useState(4)
  const [isCreating, setIsCreating] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      setName('')
      setActivity('Just vibing')
      setCustomActivity('')
      setMaxParticipants(4)
    }
  }, [isOpen])

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === overlayRef.current) onClose()
  }

  async function handleCreate() {
    const roomName = name.trim()
    if (!roomName) {
      toast.error('Give your room a name')
      return
    }
    setIsCreating(true)
    try {
      const selectedActivity = customActivity.trim() || activity
      const data = await roomsApi.create({
        name: roomName,
        activity: selectedActivity,
        maxParticipants,
      })
      toast.success('Room created! Welcome in.')
      onCreate(data.room || data)
      onClose()
    } catch (err) {
      console.error('Failed to create room:', err)
      toast.error('Could not create room. Try again?')
    } finally {
      setIsCreating(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
    >
      <div className="w-full max-w-md rounded-2xl glass-heavy p-6 animate-scale-in relative">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-muted/50 transition-colors"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>

        <h2 className="text-lg font-semibold mb-1">Create a room</h2>
        <p className="text-xs text-muted-foreground mb-5">
          A cozy space for parallel play. No chat -- just presence.
        </p>

        {/* Room name */}
        <label className="block mb-4">
          <span className="text-xs font-medium text-muted-foreground mb-1.5 block">
            Room name
          </span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Morning reading nook"
            maxLength={40}
            className="w-full px-3.5 py-2.5 bg-muted/30 rounded-xl text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-shadow"
          />
        </label>

        {/* Activity */}
        <div className="mb-4">
          <span className="text-xs font-medium text-muted-foreground mb-2 block">
            Activity
          </span>
          <div className="flex flex-wrap gap-1.5">
            {ACTIVITIES.map((a) => (
              <button
                key={a.label}
                onClick={() => {
                  setActivity(a.label)
                  setCustomActivity('')
                }}
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-medium transition-all',
                  'hover:scale-105 active:scale-95',
                  activity === a.label && !customActivity
                    ? 'bg-primary text-primary-foreground glow-primary'
                    : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
                )}
              >
                <span>{a.emoji}</span>
                {a.label}
              </button>
            ))}
          </div>
          <input
            value={customActivity}
            onChange={(e) => setCustomActivity(e.target.value)}
            placeholder="Or type a custom activity..."
            maxLength={30}
            className="w-full mt-2 px-3.5 py-2 bg-muted/20 rounded-xl text-xs placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-shadow"
          />
        </div>

        {/* Max participants */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">
              Max participants
            </span>
            <span className="text-sm font-semibold text-primary tabular-nums">
              {maxParticipants}
            </span>
          </div>
          <div className="relative">
            <input
              type="range"
              min={2}
              max={8}
              value={maxParticipants}
              onChange={(e) => setMaxParticipants(Number(e.target.value))}
              className="w-full h-1.5 bg-muted/40 rounded-full appearance-none cursor-pointer accent-primary [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:shadow-primary/30 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110"
            />
            <div className="flex justify-between mt-1 px-0.5">
              {Array.from({ length: 7 }, (_, i) => i + 2).map((n) => (
                <span
                  key={n}
                  className={cn(
                    'text-[9px] tabular-nums transition-colors',
                    n === maxParticipants
                      ? 'text-primary font-medium'
                      : 'text-muted-foreground/40'
                  )}
                >
                  {n}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Create button */}
        <button
          onClick={handleCreate}
          disabled={!name.trim() || isCreating}
          className={cn(
            'w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all',
            name.trim()
              ? 'bg-primary text-primary-foreground glow-primary hover:brightness-110 active:scale-[0.98]'
              : 'bg-muted text-muted-foreground cursor-not-allowed'
          )}
        >
          {isCreating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          Create & Join
        </button>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════
// Room View (inside a room)
// ═══════════════════════════════════════════

function RoomView({
  room,
  onLeave,
}: {
  room: Room
  onLeave: () => void
}) {
  const [myStatus, setMyStatus] = useState<StatusType>('present')
  const [myActivity, setMyActivity] = useState('')
  const [floatingReactions, setFloatingReactions] = useState<{ id: number; emoji: string; x: number }[]>([])
  const [showStatusPicker, setShowStatusPicker] = useState(false)
  const [nudging, setNudging] = useState(false)
  const reactionIdRef = useRef(0)

  // Simulated "you" participant
  const myParticipant: Participant = {
    id: 'me',
    name: 'You',
    status: myStatus,
    activity: myActivity || undefined,
  }

  const allParticipants = [
    myParticipant,
    ...room.participants.filter((p) => p.id !== 'me'),
  ]

  async function handleStatusChange(status: StatusType) {
    setMyStatus(status)
    setShowStatusPicker(false)
    try {
      await roomsApi.updateStatus(room.id, { status })
    } catch {
      // Silently fail - status is optimistic
    }
  }

  async function handleActivityBlur() {
    try {
      await roomsApi.updateStatus(room.id, { activity: myActivity })
    } catch {
      // Silently fail
    }
  }

  function sendReaction(emoji: string) {
    const id = reactionIdRef.current++
    const x = 30 + Math.random() * 40
    setFloatingReactions((prev) => [...prev, { id, emoji, x }])
  }

  function removeReaction(id: number) {
    setFloatingReactions((prev) => prev.filter((r) => r.id !== id))
  }

  function handleNudge() {
    if (nudging) return
    setNudging(true)
    toast('You sent a gentle wave to everyone', {
      icon: '\uD83D\uDC4B',
      duration: 2000,
    })
    setTimeout(() => setNudging(false), 3000)
  }

  async function handleLeave() {
    try {
      await roomsApi.leave(room.id)
    } catch {
      // Best effort
    }
    onLeave()
  }

  return (
    <div className="min-h-screen bg-neural relative overflow-hidden flex flex-col">
      <AmbientBackground />

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-4 py-3 glass-heavy border-b border-border/30">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">
            {ACTIVITIES.find((a) => a.label === room.activity)?.emoji || '\u2615'}
          </span>
          <div>
            <h2 className="text-sm font-semibold">{room.name}</h2>
            <span className="text-[10px] text-muted-foreground">
              {allParticipants.length} present
            </span>
          </div>
        </div>
        <button
          onClick={handleLeave}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
        >
          <LogOut className="w-3.5 h-3.5" />
          Leave
        </button>
      </div>

      {/* Participant space */}
      <div className="relative flex-1 min-h-[400px] md:min-h-[500px]">
        {/* Floating reactions */}
        {floatingReactions.map((r) => (
          <FloatingReaction
            key={r.id}
            emoji={r.emoji}
            x={r.x}
            onDone={() => removeReaction(r.id)}
          />
        ))}

        {/* Nudge wave overlay */}
        {nudging && (
          <div className="absolute inset-0 pointer-events-none z-10">
            <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-nudge-wave mx-auto my-auto w-0 h-0" />
          </div>
        )}

        {/* Participants scattered organically */}
        {allParticipants.map((participant, i) => {
          const pos = PARTICIPANT_POSITIONS[i] || {
            top: `${30 + Math.random() * 40}%`,
            left: `${20 + Math.random() * 60}%`,
            scale: 0.85,
          }
          return (
            <ParticipantCircle
              key={participant.id}
              participant={participant}
              position={pos}
              isYou={participant.id === 'me'}
            />
          )
        })}
      </div>

      {/* Bottom controls */}
      <div className="relative z-10 p-4 pb-6 md:pb-4 space-y-3">
        {/* Your status + activity */}
        <div className="flex items-center gap-2">
          {/* Status selector */}
          <div className="relative">
            <button
              onClick={() => setShowStatusPicker(!showStatusPicker)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium glass transition-all',
                'hover:glow-sm',
                STATUS_CONFIG[myStatus].color
              )}
            >
              <div className={cn('w-2 h-2 rounded-full', STATUS_CONFIG[myStatus].dot)} />
              {STATUS_CONFIG[myStatus].label}
            </button>

            {showStatusPicker && (
              <div className="absolute bottom-full mb-2 left-0 p-1.5 rounded-xl glass-heavy animate-scale-in z-20 min-w-[140px]">
                {(Object.keys(STATUS_CONFIG) as StatusType[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => handleStatusChange(s)}
                    className={cn(
                      'flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                      myStatus === s
                        ? 'bg-primary/10 text-primary'
                        : 'hover:bg-muted/50 text-muted-foreground'
                    )}
                  >
                    <div className={cn('w-2 h-2 rounded-full', STATUS_CONFIG[s].dot)} />
                    {STATUS_CONFIG[s].label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Activity text */}
          <input
            value={myActivity}
            onChange={(e) => setMyActivity(e.target.value)}
            onBlur={handleActivityBlur}
            placeholder="What are you up to?"
            maxLength={50}
            className="flex-1 px-3 py-2 bg-muted/20 rounded-xl text-xs placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/20 transition-shadow"
          />
        </div>

        {/* Reaction bar + nudge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {REACTIONS.map((r) => (
              <button
                key={r.label}
                onClick={() => sendReaction(r.emoji)}
                className="w-10 h-10 rounded-xl glass flex items-center justify-center text-lg hover:scale-110 hover:glow-sm active:scale-95 transition-all"
                title={r.label}
              >
                {r.emoji}
              </button>
            ))}
          </div>

          <button
            onClick={handleNudge}
            disabled={nudging}
            className={cn(
              'flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium glass transition-all',
              'hover:glow-sm hover:text-primary active:scale-95',
              nudging
                ? 'text-primary/60 cursor-not-allowed'
                : 'text-muted-foreground'
            )}
          >
            <Hand className="w-3.5 h-3.5" />
            Gentle nudge
          </button>
        </div>
      </div>

      {/* Inline styles for custom animations */}
      <style>{`
        @keyframes reaction-float {
          0% { opacity: 1; transform: translateY(0) scale(1); }
          50% { opacity: 0.8; transform: translateY(-80px) scale(1.2); }
          100% { opacity: 0; transform: translateY(-160px) scale(0.6); }
        }
        .animate-reaction-float {
          animation: reaction-float 2s ease-out forwards;
        }

        @keyframes ambient-drift-1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -20px) scale(1.1); }
          66% { transform: translate(-20px, 15px) scale(0.95); }
        }
        .animate-ambient-drift-1 {
          animation: ambient-drift-1 20s ease-in-out infinite;
        }

        @keyframes ambient-drift-2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-25px, 20px) scale(1.05); }
          66% { transform: translate(15px, -25px) scale(0.9); }
        }
        .animate-ambient-drift-2 {
          animation: ambient-drift-2 25s ease-in-out infinite;
        }

        @keyframes ambient-drift-3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(20px, 10px) scale(1.08); }
        }
        .animate-ambient-drift-3 {
          animation: ambient-drift-3 18s ease-in-out infinite;
        }

        @keyframes participant-breathe {
          0%, 100% { box-shadow: 0 0 0 0 transparent; }
          50% { box-shadow: 0 0 12px 2px hsl(var(--primary) / 0.08); }
        }
        .animate-participant-breathe {
          animation: participant-breathe 4s ease-in-out infinite;
        }

        @keyframes gentle-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.3); }
        }
        .animate-gentle-pulse {
          animation: gentle-pulse 2s ease-in-out infinite;
        }

        @keyframes room-breathe {
          0%, 100% { box-shadow: inset 0 0 0 1px hsl(var(--primary) / 0.0); }
          50% { box-shadow: inset 0 0 20px 0 hsl(var(--primary) / 0.04); }
        }
        .animate-room-breathe {
          animation: room-breathe 5s ease-in-out infinite;
        }

        @keyframes nudge-wave {
          0% { width: 0; height: 0; opacity: 0.6; }
          100% { width: 300%; height: 300%; opacity: 0; }
        }
        .animate-nudge-wave {
          animation: nudge-wave 1.5s ease-out forwards;
        }

        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 200ms ease-out;
        }

        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-scale-in {
          animation: scale-in 200ms ease-out;
        }

        @keyframes slide-up {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slide-up 300ms ease-out both;
        }
      `}</style>
    </div>
  )
}

// ═══════════════════════════════════════════
// Main Together Rooms Page
// ═══════════════════════════════════════════

export function TogetherRoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeRoom, setActiveRoom] = useState<Room | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null)

  useEffect(() => {
    loadRooms()
  }, [])

  async function loadRooms() {
    setIsLoading(true)
    try {
      const data = await roomsApi.list()
      setRooms(data.rooms || data || [])
    } catch (err) {
      console.error('Failed to load rooms:', err)
      toast.error('Could not load rooms')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleJoin(room: Room) {
    try {
      await roomsApi.join(room.id)
      setActiveRoom(room)
      toast.success(`Joined ${room.name}`)
    } catch (err) {
      console.error('Failed to join room:', err)
      toast.error('Could not join room')
    }
  }

  function handleLeave() {
    setActiveRoom(null)
    loadRooms()
  }

  function handleRoomCreated(room: Room) {
    setActiveRoom(room)
    loadRooms()
  }

  const filteredRooms = selectedActivity
    ? rooms.filter((r) => r.activity === selectedActivity)
    : rooms

  // ── Room View ──
  if (activeRoom) {
    return <RoomView room={activeRoom} onLeave={handleLeave} />
  }

  // ── Room Browser ──
  return (
    <div className="min-h-screen bg-neural pb-24 md:pb-8">
      {/* Header */}
      <div className="sticky top-0 z-10 glass-heavy border-b border-border/50">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <h1 className="text-lg font-semibold">Together Rooms</h1>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-primary text-primary-foreground glow-primary hover:brightness-110 active:scale-95 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Create Room
            </button>
          </div>

          {/* Description */}
          <p className="text-[11px] text-muted-foreground mb-3">
            Parallel play spaces. Be together without the pressure of conversation.
          </p>

          {/* Activity filter chips */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
            <button
              onClick={() => setSelectedActivity(null)}
              className={cn(
                'px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all shrink-0',
                !selectedActivity
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
              )}
            >
              All
            </button>
            {ACTIVITIES.map((a) => (
              <button
                key={a.label}
                onClick={() =>
                  setSelectedActivity(selectedActivity === a.label ? null : a.label)
                }
                className={cn(
                  'flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all shrink-0',
                  selectedActivity === a.label
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
                )}
              >
                <span className="text-xs">{a.emoji}</span>
                {a.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Room Grid */}
      <div className="max-w-3xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-[170px] rounded-2xl glass animate-pulse"
                style={{ animationDelay: `${i * 100}ms` }}
              />
            ))}
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="text-center py-16 animate-fade-in">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted/20 flex items-center justify-center">
              <Coffee className="w-7 h-7 text-muted-foreground/30" />
            </div>
            <p className="text-sm text-muted-foreground font-medium">
              {selectedActivity
                ? `No ${selectedActivity.toLowerCase()} rooms right now`
                : 'No rooms open yet'}
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1 mb-4">
              Create one and others will join
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium bg-primary text-primary-foreground glow-primary hover:brightness-110 active:scale-95 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Create a room
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredRooms.map((room, i) => (
              <div
                key={room.id}
                className="animate-slide-up"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <RoomCard room={room} onJoin={handleJoin} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Room Modal */}
      <CreateRoomModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleRoomCreated}
      />
    </div>
  )
}
