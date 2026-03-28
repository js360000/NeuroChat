import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Sparkles, Heart, MessageCircle, Filter } from 'lucide-react'
import { discoverApi } from '@/lib/api/discover'
import { MoodRing } from '@/components/MoodRing'
import { getInitials } from '@/lib/utils'
import { ConversationSkeleton } from '@/components/MessageSkeleton'
import type { DiscoverProfile } from '@/types'

export function DiscoverPage() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [profiles, setProfiles] = useState<DiscoverProfile[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadProfiles()
  }, [])

  async function loadProfiles() {
    setIsLoading(true)
    try {
      const data = await discoverApi.getProfiles()
      setProfiles(data.profiles)
    } catch (err) {
      console.error('Failed to load profiles:', err)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSearch() {
    setIsLoading(true)
    try {
      const data = await discoverApi.getProfiles(searchQuery.trim() || undefined)
      setProfiles(data.profiles)
    } catch (err) {
      console.error('Search failed:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch()
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  return (
    <div className="min-h-screen bg-neural pb-24 md:pb-8">
      <div className="sticky top-0 z-10 glass-heavy border-b border-border/50">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <h1 className="text-lg font-semibold">Discover</h1>
            </div>
            <button className="p-2 rounded-xl hover:bg-muted/50 transition-colors">
              <Filter className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or interest..."
              className="w-full pl-9 pr-4 py-2.5 bg-muted/40 glass rounded-xl text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <p className="text-xs text-muted-foreground mb-4">
          People who share your interests and communication style
        </p>

        {isLoading ? (
          <ConversationSkeleton count={4} />
        ) : (
          <div className="space-y-3">
            {profiles.map((profile, i) => (
              <div
                key={profile.id}
                className="rounded-2xl glass p-4 hover:glow-sm transition-all animate-slide-up group"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="flex items-start gap-3">
                  <MoodRing mood="positive" size="md">
                    <div className="w-full h-full bg-gradient-to-br from-primary/70 to-secondary/70 flex items-center justify-center text-white text-sm font-medium">
                      {getInitials(profile.name)}
                    </div>
                  </MoodRing>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-semibold">{profile.name}</h3>
                        <span className="text-[11px] text-muted-foreground">{profile.pronouns}</span>
                      </div>
                      <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-accent/10">
                        <Heart className="w-3 h-3 text-accent" />
                        <span className="text-xs font-bold text-accent">{profile.compatibility}%</span>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed line-clamp-2">
                      {profile.bio}
                    </p>

                    <div className="flex flex-wrap gap-1 mt-2">
                      {profile.commStyle && (
                        <span className="px-2 py-0.5 rounded-md bg-secondary/10 text-secondary text-[10px] font-medium">
                          {profile.commStyle}
                        </span>
                      )}
                      {(profile.interests || []).slice(0, 3).map((interest) => (
                        <span key={interest} className="px-2 py-0.5 rounded-md bg-muted/50 text-[10px] text-muted-foreground">
                          {interest}
                        </span>
                      ))}
                      {(profile.interests || []).length > 3 && (
                        <span className="px-2 py-0.5 rounded-md bg-muted/50 text-[10px] text-muted-foreground">
                          +{(profile.interests || []).length - 3}
                        </span>
                      )}
                    </div>

                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => navigate(`/messages/${profile.id}`)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:brightness-110 active:scale-95 transition-all"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        Say hi
                      </button>
                      <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted/50 text-muted-foreground text-xs hover:bg-muted transition-all">
                        View profile
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && profiles.length === 0 && (
          <div className="text-center py-12 animate-fade-in">
            <div className="w-14 h-14 rounded-2xl bg-muted/30 flex items-center justify-center mx-auto mb-3">
              <Search className="w-6 h-6 text-muted-foreground/40" />
            </div>
            <p className="text-sm text-muted-foreground">No matches found</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Try broadening your search</p>
          </div>
        )}
      </div>
    </div>
  )
}
