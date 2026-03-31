import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Plus, Sparkles, Users, Search, Loader2,
  Star, Music, Gamepad2, BookOpen, Palette, Code, Microscope, Film,
  Camera, TreePine, Utensils, Heart, Dumbbell, Plane, PawPrint,
} from 'lucide-react'
import { cn, getInitials } from '@/lib/utils'
import { roomsApi } from '@/lib/api/rooms'
import { MoodRing } from '@/components/MoodRing'
import { toast } from 'sonner'

const INTEREST_TAGS = [
  { tag: 'music', label: 'Music', icon: <Music className="w-4 h-4" />, color: 'text-pink-400 bg-pink-500/10' },
  { tag: 'gaming', label: 'Gaming', icon: <Gamepad2 className="w-4 h-4" />, color: 'text-violet-400 bg-violet-500/10' },
  { tag: 'reading', label: 'Reading', icon: <BookOpen className="w-4 h-4" />, color: 'text-amber-400 bg-amber-500/10' },
  { tag: 'art', label: 'Art & Crafts', icon: <Palette className="w-4 h-4" />, color: 'text-cyan-400 bg-cyan-500/10' },
  { tag: 'coding', label: 'Coding', icon: <Code className="w-4 h-4" />, color: 'text-emerald-400 bg-emerald-500/10' },
  { tag: 'science', label: 'Science', icon: <Microscope className="w-4 h-4" />, color: 'text-blue-400 bg-blue-500/10' },
  { tag: 'film', label: 'Film & TV', icon: <Film className="w-4 h-4" />, color: 'text-red-400 bg-red-500/10' },
  { tag: 'photography', label: 'Photography', icon: <Camera className="w-4 h-4" />, color: 'text-orange-400 bg-orange-500/10' },
  { tag: 'nature', label: 'Nature', icon: <TreePine className="w-4 h-4" />, color: 'text-green-400 bg-green-500/10' },
  { tag: 'cooking', label: 'Cooking', icon: <Utensils className="w-4 h-4" />, color: 'text-yellow-400 bg-yellow-500/10' },
  { tag: 'fitness', label: 'Fitness', icon: <Dumbbell className="w-4 h-4" />, color: 'text-teal-400 bg-teal-500/10' },
  { tag: 'travel', label: 'Travel', icon: <Plane className="w-4 h-4" />, color: 'text-sky-400 bg-sky-500/10' },
  { tag: 'pets', label: 'Pets', icon: <PawPrint className="w-4 h-4" />, color: 'text-amber-400 bg-amber-500/10' },
  { tag: 'other', label: 'Other', icon: <Star className="w-4 h-4" />, color: 'text-muted-foreground bg-muted/30' },
]

interface Room {
  id: string; name: string; activity?: string; roomType: string; interestTag?: string
  description?: string; allowChat: boolean; maxParticipants: number; participants: any[]
}

export function InterestRoomsPage() {
  const navigate = useNavigate()
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [filterTag, setFilterTag] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newRoom, setNewRoom] = useState({ name: '', description: '', interestTag: 'other', allowChat: true, maxParticipants: 12 })

  useEffect(() => { loadRooms() }, [filterTag])

  async function loadRooms() {
    setLoading(true)
    try {
      const data = await roomsApi.list({ type: 'interest', tag: filterTag || undefined })
      setRooms(data.rooms)
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }

  async function createRoom() {
    if (!newRoom.name.trim()) { toast.error('Room name required'); return }
    setCreating(true)
    try {
      await roomsApi.create({
        name: newRoom.name.trim(),
        activity: newRoom.interestTag,
        roomType: 'interest',
        interestTag: newRoom.interestTag,
        description: newRoom.description.trim() || undefined,
        allowChat: newRoom.allowChat,
        maxParticipants: newRoom.maxParticipants,
      })
      toast.success('Room created!')
      setShowCreate(false)
      setNewRoom({ name: '', description: '', interestTag: 'other', allowChat: true, maxParticipants: 12 })
      loadRooms()
    } catch {
      toast.error('Failed to create room')
    } finally { setCreating(false) }
  }

  async function joinRoom(roomId: string) {
    try {
      await roomsApi.join(roomId)
      toast.success('Joined!')
      loadRooms()
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Could not join')
    }
  }

  const filtered = rooms.filter(r =>
    !searchQuery.trim() || r.name.toLowerCase().includes(searchQuery.toLowerCase()) || r.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-neural pb-24 md:pb-8">
      {/* Header */}
      <div className="sticky top-0 z-10 glass-heavy border-b border-border/50">
        <div className="max-w-2xl mx-auto px-4 py-3 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-muted/50">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <Sparkles className="w-5 h-5 text-primary" />
              <h1 className="text-lg font-semibold">Special Interest Rooms</h1>
            </div>
            <button onClick={() => setShowCreate(true)}
              className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-medium flex items-center gap-1 hover:brightness-110 active:scale-95">
              <Plus className="w-3.5 h-3.5" /> Create
            </button>
          </div>

          {/* Info banner */}
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-primary/5 border border-primary/10">
            <Heart className="w-4 h-4 text-primary shrink-0" />
            <p className="text-[11px] text-muted-foreground">
              Infodumping is <span className="text-primary font-medium">celebrated</span> here. Share your passions freely.
            </p>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search rooms..."
              className="w-full pl-10 pr-4 py-2 bg-muted/40 glass rounded-xl text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/30" />
          </div>

          {/* Interest tags */}
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
            <button onClick={() => setFilterTag(null)} className={cn('px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap shrink-0 transition-all',
              !filterTag ? 'bg-primary text-primary-foreground' : 'glass text-muted-foreground')}>All</button>
            {INTEREST_TAGS.map(t => (
              <button key={t.tag} onClick={() => setFilterTag(filterTag === t.tag ? null : t.tag)}
                className={cn('px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap shrink-0 transition-all flex items-center gap-1',
                  filterTag === t.tag ? 'bg-primary text-primary-foreground' : t.color)}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center animate-fade-in">
            <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mb-3">
              <Sparkles className="w-6 h-6 text-muted-foreground/50" />
            </div>
            <p className="text-sm text-muted-foreground">No rooms yet</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Create the first one and share your passion!</p>
          </div>
        ) : (
          filtered.map((room, i) => {
            const tagConfig = INTEREST_TAGS.find(t => t.tag === room.interestTag)
            return (
              <div key={room.id} className="rounded-2xl glass p-4 space-y-3 animate-slide-up hover:glow-sm transition-all"
                style={{ animationDelay: `${i * 40}ms` }}>
                <div className="flex items-start gap-3">
                  <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center shrink-0', tagConfig?.color || 'bg-muted/30 text-muted-foreground')}>
                    {tagConfig?.icon || <Star className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold truncate">{room.name}</h3>
                      {room.allowChat && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-medium shrink-0">Chat</span>
                      )}
                    </div>
                    {room.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{room.description}</p>}
                    {tagConfig && (
                      <span className={cn('inline-flex items-center gap-1 text-[10px] font-medium mt-1 px-1.5 py-0.5 rounded-md', tagConfig.color)}>
                        {tagConfig.icon} {tagConfig.label}
                      </span>
                    )}
                  </div>
                </div>

                {/* Participants */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <div className="flex -space-x-2">
                      {room.participants.slice(0, 5).map((p: any) => (
                        <MoodRing key={p.userId} mood="neutral" size="sm">
                          <div className="w-full h-full bg-gradient-to-br from-primary/70 to-secondary/70 flex items-center justify-center text-white text-[8px] font-medium">
                            {getInitials(p.name)}
                          </div>
                        </MoodRing>
                      ))}
                    </div>
                    <span className="text-[10px] text-muted-foreground ml-1">
                      {room.participants.length}/{room.maxParticipants}
                    </span>
                  </div>
                  <button onClick={() => joinRoom(room.id)}
                    className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:brightness-110 active:scale-95 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" /> Join
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Create room modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowCreate(false)}>
          <div className="glass-heavy rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md p-5 space-y-4 animate-slide-up" onClick={e => e.stopPropagation()}>
            <h2 className="font-semibold text-sm flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" /> Create Interest Room</h2>

            <input value={newRoom.name} onChange={e => setNewRoom(p => ({ ...p, name: e.target.value }))} placeholder="Room name (e.g. 'Train Enthusiasts')" maxLength={60}
              className="w-full px-3 py-2.5 rounded-xl bg-muted/30 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/30" />

            <textarea value={newRoom.description} onChange={e => setNewRoom(p => ({ ...p, description: e.target.value }))} placeholder="What's this room about? Infodump welcome!" rows={3} maxLength={300}
              className="w-full px-3 py-2 rounded-xl bg-muted/30 text-sm resize-none placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/30" />

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Interest</label>
              <div className="flex flex-wrap gap-1.5">
                {INTEREST_TAGS.map(t => (
                  <button key={t.tag} onClick={() => setNewRoom(p => ({ ...p, interestTag: t.tag }))}
                    className={cn('px-2 py-1 rounded-lg text-[10px] font-medium flex items-center gap-1 transition-all',
                      newRoom.interestTag === t.tag ? 'bg-primary text-primary-foreground' : t.color)}>
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs">Allow chat messages</span>
              <button onClick={() => setNewRoom(p => ({ ...p, allowChat: !p.allowChat }))}
                className={cn('relative w-9 h-5 rounded-full transition-colors', newRoom.allowChat ? 'bg-primary' : 'bg-muted')}>
                <span className={cn('block w-4 h-4 rounded-full bg-white shadow transition-transform', newRoom.allowChat ? 'translate-x-[18px]' : 'translate-x-[2px]')} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs">Max participants</span>
              <div className="flex items-center gap-2">
                <input type="range" min={2} max={25} value={newRoom.maxParticipants} onChange={e => setNewRoom(p => ({ ...p, maxParticipants: parseInt(e.target.value) }))}
                  className="w-24 h-1 rounded-full accent-primary" />
                <span className="text-xs text-muted-foreground w-5 text-right">{newRoom.maxParticipants}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setShowCreate(false)} className="flex-1 py-2.5 rounded-xl glass text-sm font-medium">Cancel</button>
              <button onClick={createRoom} disabled={creating || !newRoom.name.trim()}
                className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium glow-sm hover:brightness-110 disabled:opacity-50">
                {creating ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Create Room'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
