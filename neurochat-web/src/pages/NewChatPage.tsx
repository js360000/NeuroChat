import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Search, MessageCircle, Phone, Loader2, UserPlus } from 'lucide-react'
import { getInitials } from '@/lib/utils'
import { contactsApi } from '@/lib/api/contacts'
import { messagesApi } from '@/lib/api/messages'
import { looksLikePhoneNumber, formatE164, hashPhoneNumber } from '@/lib/phone'
import { MoodRing } from '@/components/MoodRing'
import { toast } from 'sonner'

interface SearchResult {
  id: string
  name: string
  avatar?: string
  pronouns?: string
  bio?: string
  isOnline?: boolean
  commStyle?: string
  interests?: string[]
  matchedByPhone?: boolean
}

export function NewChatPage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [starting, setStarting] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!query.trim()) { setResults([]); return }

    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        if (looksLikePhoneNumber(query)) {
          const e164 = formatE164(query)
          if (e164) {
            const hash = await hashPhoneNumber(e164)
            const data = await contactsApi.search('', hash)
            setResults(data.results)
          } else {
            setResults([])
          }
        } else {
          const data = await contactsApi.search(query)
          setResults(data.results)
        }
      } catch {
        toast.error('Search failed')
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query])

  async function startConversation(userId: string) {
    setStarting(userId)
    try {
      const data = await messagesApi.createConversation(userId)
      navigate(`/messages/${data.conversation.id}`)
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Could not start conversation')
    } finally {
      setStarting(null)
    }
  }

  return (
    <div className="min-h-screen bg-neural pb-24 md:pb-8">
      {/* Header */}
      <div className="sticky top-0 z-10 glass-heavy border-b border-border/50">
        <div className="max-w-2xl mx-auto px-4 py-3 space-y-3">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <UserPlus className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-semibold">New Chat</h1>
          </div>

          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or phone number..."
              className="w-full pl-10 pr-4 py-2.5 bg-muted/40 glass rounded-xl text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all"
            />
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4">
        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Results */}
        {!loading && results.length > 0 && (
          <div className="space-y-2">
            {results.map((user, i) => (
              <div
                key={user.id}
                className="flex items-center gap-3 p-3 rounded-2xl glass hover:glow-sm transition-all animate-slide-up"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <MoodRing mood="neutral" isOnline={user.isOnline} size="md">
                  <div className="w-full h-full bg-gradient-to-br from-primary/80 to-secondary/80 flex items-center justify-center text-white text-sm font-medium">
                    {getInitials(user.name)}
                  </div>
                </MoodRing>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-sm truncate">{user.name}</span>
                    {user.pronouns && <span className="text-[11px] text-muted-foreground">{user.pronouns}</span>}
                  </div>
                  {user.bio && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{user.bio}</p>
                  )}
                  {user.matchedByPhone && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-primary/70 mt-0.5">
                      <Phone className="w-2.5 h-2.5" /> Found via phone number
                    </span>
                  )}
                </div>

                <button
                  onClick={() => startConversation(user.id)}
                  disabled={starting === user.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
                >
                  {starting === user.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <MessageCircle className="w-3.5 h-3.5" />
                  )}
                  Message
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Empty states */}
        {!loading && query.trim() && results.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center animate-fade-in">
            <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mb-3">
              {looksLikePhoneNumber(query) ? (
                <Phone className="w-6 h-6 text-muted-foreground/50" />
              ) : (
                <Search className="w-6 h-6 text-muted-foreground/50" />
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {looksLikePhoneNumber(query)
                ? 'This number is not registered on NeuroChat'
                : 'No users found'}
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              {looksLikePhoneNumber(query)
                ? 'They may need to sign up and add their phone number first'
                : 'Try a different name or search by phone number'}
            </p>
          </div>
        )}

        {/* Initial state */}
        {!loading && !query.trim() && (
          <div className="flex flex-col items-center justify-center py-12 text-center animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center mb-4">
              <UserPlus className="w-7 h-7 text-primary/40" />
            </div>
            <p className="text-sm text-muted-foreground">Start a new conversation</p>
            <p className="text-xs text-muted-foreground/60 mt-1 max-w-xs">
              Search for someone by name or phone number. They need to have NeuroChat too.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
