import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Sparkles, Plus, Users, MessageCircle, X,
  Gamepad2, Music, BookOpen, Code, Palette, Film,
  Microscope, TreePine, ChefHat, Dumbbell, Camera, Heart,
  Loader2, Send,
} from 'lucide-react'
import { roomsApi } from '@/lib/api/rooms'
import { cn, getInitials } from '@/lib/utils'
import { toast } from 'sonner'

const INTEREST_TAGS = [
  { id: 'gaming', label: 'Gaming', emoji: '🎮', icon: <Gamepad2 className="w-4 h-4" /> },
  { id: 'music', label: 'Music', emoji: '🎵', icon: <Music className="w-4 h-4" /> },
  { id: 'reading', label: 'Reading', emoji: '📚', icon: <BookOpen className="w-4 h-4" /> },
  { id: 'coding', label: 'Coding', emoji: '💻', icon: <Code className="w-4 h-4" /> },
  { id: 'art', label: 'Art & Crafts', emoji: '🎨', icon: <Palette className="w-4 h-4" /> },
  { id: 'film', label: 'Film & TV', emoji: '🎬', icon: <Film className="w-4 h-4" /> },
  { id: 'science', label: 'Science', emoji: '🔬', icon: <Microscope className="w-4 h-4" /> },
  { id: 'nature', label: 'Nature', emoji: '🌿', icon: <TreePine className="w-4 h-4" /> },
  { id: 'cooking', label: 'Cooking', emoji: '👨‍🍳', icon: <ChefHat className="w-4 h-4" /> },
  { id: 'fitness', label: 'Fitness', emoji: '💪', icon: <Dumbbell className="w-4 h-4" /> },
  { id: 'photography', label: 'Photography', emoji: '📸', icon: <Camera className="w-4 h-4" /> },
  { id: 'wellbeing', label: 'Wellbeing', emoji: '💜', icon: <Heart className="w-4 h-4" /> },
]

interface Room {
  id: string; name: string; description?: string; interestTag?: string; allowChat: boolean
  maxParticipants: number; participants: { userId: string; name: string; avatar?: string; status: string; activity?: string }[]
}

export function InterestRoomsPage() {
  const navigate = useNavigate()
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [filterTag, setFilterTag] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [joinedRoom, setJoinedRoom] = useState<string | null>(null)
  const [chatInput, setChatInput] = useState('')
  const [newName, setNewName] = useState('')
  const [newTag, setNewTag] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newAllowChat, setNewAllowChat] = useState(true)
  const [newMaxP, setNewMaxP] = useState(12)
  const [creating, setCreating] = useState(false)

  useEffect(() => { loadRooms() }, [filterTag])

  async function loadRooms() {
    setLoading(true)
    try { const data = await roomsApi.list({ type: 'interest', tag: filterTag || undefined }); setRooms(data.rooms) }
    catch { toast.error('Failed to load rooms') }
    finally { setLoading(false) }
  }

  async function handleCreate() {
    if (!newName.trim() || !newTag) return
    setCreating(true)
    try {
      await roomsApi.create({ name: newName.trim(), roomType: 'interest', interestTag: newTag, description: newDesc.trim() || undefined, allowChat: newAllowChat, maxParticipants: newMaxP })
      setShowCreate(false); setNewName(''); setNewTag(''); setNewDesc(''); loadRooms(); toast.success('Room created!')
    } catch { toast.error('Failed to create room') }
    finally { setCreating(false) }
  }

  async function handleJoin(roomId: string) {
    try { await roomsApi.join(roomId); setJoinedRoom(roomId); loadRooms() }
    catch (e: any) { toast.error(e.response?.data?.error || 'Failed to join') }
  }

  async function handleLeave(roomId: string) {
    try { await roomsApi.leave(roomId); setJoinedRoom(null); loadRooms() }
    catch { toast.error('Failed to leave') }
  }

  const activeRoom = rooms.find(r => r.id === joinedRoom)

  return (
    <div className="min-h-screen bg-neural pb-24 md:pb-8">
      <div className="sticky top-0 z-10 glass-heavy border-b border-border/50">
        <div className="max-w-2xl mx-auto px-4 py-3 space-y-3">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-muted/50"><ArrowLeft className="w-5 h-5" /></button>
            <Sparkles className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-semibold">Special Interest Rooms</h1>
          </div>
          <p className="text-xs text-muted-foreground -mt-1">Dedicated spaces for infodumping, sharing, and connecting over the things you love. No judgement, no "too much".</p>
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
            <button onClick={() => setFilterTag(null)} className={cn('px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap shrink-0', !filterTag ? 'bg-primary text-primary-foreground' : 'glass text-muted-foreground')}>All</button>
            {INTEREST_TAGS.map(tag => (
              <button key={tag.id} onClick={() => setFilterTag(filterTag === tag.id ? null : tag.id)}
                className={cn('flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap shrink-0', filterTag === tag.id ? 'bg-primary text-primary-foreground' : 'glass text-muted-foreground')}>
                <span>{tag.emoji}</span> {tag.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {activeRoom && (
          <div className="rounded-2xl glass-heavy p-5 space-y-4 animate-scale-in border border-primary/10">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{INTEREST_TAGS.find(t => t.id === activeRoom.interestTag)?.emoji || '⭐'}</span>
                  <h2 className="font-semibold">{activeRoom.name}</h2>
                </div>
                {activeRoom.description && <p className="text-xs text-muted-foreground mt-0.5">{activeRoom.description}</p>}
              </div>
              <button onClick={() => handleLeave(activeRoom.id)} className="px-3 py-1.5 rounded-xl bg-red-500/10 text-red-400 text-xs font-medium hover:bg-red-500/20">Leave</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {activeRoom.participants.map(p => (
                <div key={p.userId} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl glass text-xs">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary/60 to-secondary/60 flex items-center justify-center text-white text-[8px] font-medium">{getInitials(p.name)}</div>
                  <span className="font-medium">{p.name}</span>
                  {p.activity && <span className="text-muted-foreground">— {p.activity}</span>}
                  <span className={cn('w-1.5 h-1.5 rounded-full', p.status === 'present' ? 'bg-emerald-400' : p.status === 'focused' ? 'bg-violet-400' : 'bg-zinc-400')} />
                </div>
              ))}
            </div>
            {activeRoom.allowChat && (
              <div className="rounded-xl bg-muted/20 p-3 space-y-2">
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Room chat</p>
                <div className="flex gap-2">
                  <input value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Share something about your interest..."
                    className="flex-1 px-3 py-2 rounded-xl bg-muted/30 text-xs placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/30" />
                  <button className="p-2 rounded-xl bg-primary text-primary-foreground"><Send className="w-3.5 h-3.5" /></button>
                </div>
                <p className="text-[9px] text-muted-foreground/50">Infodumping encouraged. Go as deep as you want.</p>
              </div>
            )}
          </div>
        )}

        <button onClick={() => setShowCreate(true)} className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl glass hover:glow-sm transition-all text-sm font-medium text-muted-foreground hover:text-foreground">
          <Plus className="w-4 h-4" /> Create a Special Interest Room
        </button>

        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : rooms.filter(r => r.id !== joinedRoom).length === 0 ? (
          <div className="text-center py-12 animate-fade-in">
            <Sparkles className="w-8 h-8 text-primary/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">{filterTag ? 'No rooms for this interest yet' : 'No interest rooms yet'}</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Be the first to create one!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {rooms.filter(r => r.id !== joinedRoom).map((room, i) => {
              const tagConfig = INTEREST_TAGS.find(t => t.id === room.interestTag)
              return (
                <div key={room.id} className="flex items-center gap-3 p-3 rounded-2xl glass hover:glow-sm transition-all animate-slide-up" style={{ animationDelay: `${i * 30}ms` }}>
                  <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-lg shrink-0">{tagConfig?.emoji || '⭐'}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-sm truncate">{room.name}</span>
                      {room.allowChat && <MessageCircle className="w-3 h-3 text-primary/50 shrink-0" />}
                    </div>
                    {room.description && <p className="text-[11px] text-muted-foreground truncate">{room.description}</p>}
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><Users className="w-3 h-3" /> {room.participants.length}/{room.maxParticipants}</span>
                      {tagConfig && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{tagConfig.label}</span>}
                    </div>
                  </div>
                  <button onClick={() => handleJoin(room.id)} className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:brightness-110 active:scale-95 shrink-0">Join</button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowCreate(false)}>
          <div className="glass-heavy rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md overflow-hidden animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/30">
              <h2 className="font-semibold text-sm">Create Interest Room</h2>
              <button onClick={() => setShowCreate(false)} className="p-1 rounded-lg hover:bg-muted/50"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Room name</label>
                <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Train Enthusiasts Unite"
                  className="w-full px-3 py-2 rounded-xl bg-muted/30 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/30" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Interest</label>
                <div className="flex flex-wrap gap-1.5">
                  {INTEREST_TAGS.map(tag => (
                    <button key={tag.id} onClick={() => setNewTag(tag.id)}
                      className={cn('flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all',
                        newTag === tag.id ? 'bg-primary text-primary-foreground' : 'glass text-muted-foreground')}>
                      <span>{tag.emoji}</span> {tag.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Description</label>
                <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} rows={2} placeholder="What's this room about? Go as niche as you want."
                  className="w-full px-3 py-2 rounded-xl bg-muted/30 text-xs resize-none placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/30" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs">Allow chat</span>
                <button onClick={() => setNewAllowChat(!newAllowChat)} className={cn('relative w-9 h-5 rounded-full transition-colors', newAllowChat ? 'bg-primary' : 'bg-muted')}>
                  <span className={cn('block w-4 h-4 rounded-full bg-white shadow transition-transform', newAllowChat ? 'translate-x-[18px]' : 'translate-x-[2px]')} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs">Max people</span>
                <div className="flex items-center gap-2">
                  <input type="range" min={2} max={30} value={newMaxP} onChange={e => setNewMaxP(parseInt(e.target.value))} className="w-24 accent-primary" />
                  <span className="text-xs font-medium w-6 text-right">{newMaxP}</span>
                </div>
              </div>
              <button onClick={handleCreate} disabled={!newName.trim() || !newTag || creating}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium glow-sm hover:brightness-110 disabled:opacity-50">
                {creating ? 'Creating...' : 'Create Room'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
