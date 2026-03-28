import { useState, useEffect } from 'react'
import {
  Hash, Send, AlertTriangle, ChevronDown, ChevronUp,
  Pin, Shield, Sparkles, Loader2, Filter, BadgeCheck,
} from 'lucide-react'
import { communityApi } from '@/lib/api/community'
import { cn, formatTime, getInitials } from '@/lib/utils'
import { MoodRing } from '@/components/MoodRing'
import { TONE_TAGS, REACTION_CONFIG, type CommunityPost, type ReactionType } from '@/types'

// ═══════════════════════════════════════════
// Post Card
// ═══════════════════════════════════════════

function PostCard({ post, onReact }: { post: CommunityPost; onReact: (postId: string, type: ReactionType) => void }) {
  const [cwExpanded, setCwExpanded] = useState(false)
  const toneConfig = TONE_TAGS.find((t) => t.tag === post.toneTag)

  return (
    <article className="p-4 rounded-2xl glass hover:glow-sm transition-all animate-slide-up">
      {/* Pinned badge */}
      {post.pinned && (
        <div className="flex items-center gap-1.5 mb-2 text-primary/70">
          <Pin className="w-3 h-3" />
          <span className="text-[10px] font-medium uppercase tracking-wider">Pinned</span>
        </div>
      )}

      {/* Author row */}
      <div className="flex items-start gap-3">
        <MoodRing mood="positive" isOnline={post.author.isOnline} size="md">
          <div className="w-full h-full bg-gradient-to-br from-primary/70 to-secondary/70 flex items-center justify-center text-white text-sm font-medium">
            {getInitials(post.author.name)}
          </div>
        </MoodRing>

        <div className="flex-1 min-w-0">
          {/* Name + meta */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-sm">{post.author.name}</span>
            {post.author.verified && <BadgeCheck className="w-3.5 h-3.5 text-primary" />}
            <span className="text-[11px] text-muted-foreground">{post.author.pronouns}</span>
            <span className="text-[10px] text-muted-foreground/50">·</span>
            <span className="text-[10px] text-muted-foreground">{formatTime(post.createdAt)}</span>
          </div>

          {/* Tone tag */}
          {toneConfig && (
            <span className={cn('inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-md mt-1', toneConfig.color)}>
              {toneConfig.emoji} {toneConfig.label}
            </span>
          )}

          {/* Content warning */}
          {post.contentWarning && (
            <div className="mt-2">
              <button
                onClick={() => setCwExpanded(!cwExpanded)}
                className="flex items-center gap-2 w-full p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/20 text-left transition-colors hover:bg-amber-500/10"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="text-xs text-amber-300">CW: {post.contentWarning}</span>
                {cwExpanded ? <ChevronUp className="w-3.5 h-3.5 text-amber-400 ml-auto" /> : <ChevronDown className="w-3.5 h-3.5 text-amber-400 ml-auto" />}
              </button>
              {cwExpanded && (
                <p className="text-sm leading-relaxed mt-2 animate-fade-in">{post.content}</p>
              )}
            </div>
          )}

          {/* Regular content (no CW) */}
          {!post.contentWarning && (
            <p className="text-sm leading-relaxed mt-1.5 text-foreground/90">{post.content}</p>
          )}

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {post.tags.map((tag) => (
                <span key={tag} className="text-[10px] text-primary/70 hover:text-primary cursor-pointer transition-colors">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Reactions bar */}
          <div className="flex items-center gap-1 mt-3 flex-wrap">
            {post.reactions.filter((r) => r.count > 0 || true).map((reaction) => {
              const config = REACTION_CONFIG[reaction.type]
              return (
                <button
                  key={reaction.type}
                  onClick={() => onReact(post.id, reaction.type)}
                  className={cn(
                    'flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-all',
                    'hover:scale-105 active:scale-95',
                    reaction.reacted
                      ? 'bg-primary/10 ring-1 ring-primary/20 text-primary'
                      : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
                  )}
                  title={config.label}
                >
                  <span className="text-sm">{config.emoji}</span>
                  {reaction.count > 0 && <span className="font-medium tabular-nums">{reaction.count}</span>}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </article>
  )
}

// ═══════════════════════════════════════════
// Post Composer
// ═══════════════════════════════════════════

function PostComposer({ onPost }: { onPost: (post: CommunityPost) => void }) {
  const [content, setContent] = useState('')
  const [toneTag, setToneTag] = useState('')
  const [contentWarning, setContentWarning] = useState('')
  const [showCwInput, setShowCwInput] = useState(false)
  const [showTones, setShowTones] = useState(false)
  const [isPosting, setIsPosting] = useState(false)

  async function handlePost() {
    if (!content.trim() || isPosting) return
    setIsPosting(true)
    try {
      // Extract hashtags from content
      const tags = content.match(/#(\w+)/g)?.map((t) => t.slice(1)) || []
      const data = await communityApi.createPost({
        content: content.trim(),
        toneTag: toneTag || undefined,
        contentWarning: contentWarning.trim() || undefined,
        tags,
      })
      onPost(data.post)
      setContent('')
      setToneTag('')
      setContentWarning('')
      setShowCwInput(false)
      setShowTones(false)
    } catch (err) {
      console.error('Failed to post:', err)
    } finally {
      setIsPosting(false)
    }
  }

  return (
    <div className="rounded-2xl glass p-4">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Share something with the community..."
        rows={3}
        maxLength={500}
        className="w-full bg-transparent text-sm resize-none placeholder:text-muted-foreground/50 focus:outline-none leading-relaxed"
      />

      {/* CW input */}
      {showCwInput && (
        <div className="flex items-center gap-2 mt-2 animate-fade-in">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <input
            value={contentWarning}
            onChange={(e) => setContentWarning(e.target.value)}
            placeholder="Content warning (e.g. mental health, spoilers)"
            className="flex-1 text-xs bg-muted/30 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-400/30"
          />
        </div>
      )}

      {/* Tone picker */}
      {showTones && (
        <div className="flex gap-1 flex-wrap mt-2 animate-fade-in">
          {TONE_TAGS.map((t) => (
            <button
              key={t.tag}
              onClick={() => { setToneTag(toneTag === t.tag ? '' : t.tag); setShowTones(false) }}
              className={cn(
                'flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium transition-all',
                toneTag === t.tag ? 'bg-primary text-primary-foreground' : t.color,
                'hover:scale-105'
              )}
            >
              {t.emoji} {t.label}
            </button>
          ))}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/30">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowTones(!showTones)}
            className={cn('p-2 rounded-lg transition-colors text-muted-foreground hover:text-primary hover:bg-primary/10', toneTag && 'text-primary bg-primary/10')}
            title="Add tone tag"
          >
            <Hash className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowCwInput(!showCwInput)}
            className={cn('p-2 rounded-lg transition-colors text-muted-foreground hover:text-amber-400 hover:bg-amber-400/10', showCwInput && 'text-amber-400 bg-amber-400/10')}
            title="Add content warning"
          >
            <AlertTriangle className="w-4 h-4" />
          </button>
          {toneTag && (
            <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-md ml-1', TONE_TAGS.find((t) => t.tag === toneTag)?.color)}>
              {TONE_TAGS.find((t) => t.tag === toneTag)?.emoji} {toneTag}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className={cn('text-[10px] tabular-nums', content.length > 450 ? 'text-amber-400' : 'text-muted-foreground/50')}>
            {content.length}/500
          </span>
          <button
            onClick={handlePost}
            disabled={!content.trim() || isPosting}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all',
              content.trim()
                ? 'bg-primary text-primary-foreground glow-primary hover:brightness-110 active:scale-95'
                : 'bg-muted text-muted-foreground'
            )}
          >
            {isPosting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            Post
          </button>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════
// Main Community Page
// ═══════════════════════════════════════════

export function CommunityPage() {
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [selectedTag, setSelectedTag] = useState<string | undefined>()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadPosts()
    loadTags()
  }, [selectedTag])

  async function loadPosts() {
    setIsLoading(true)
    try {
      const data = await communityApi.getPosts({ tag: selectedTag })
      setPosts(data.posts)
    } catch (err) {
      console.error('Failed to load posts:', err)
    } finally {
      setIsLoading(false)
    }
  }

  async function loadTags() {
    try {
      const data = await communityApi.getTags()
      setTags(data.tags)
    } catch { /* ignore */ }
  }

  async function handleReact(postId: string, type: ReactionType) {
    try {
      const data = await communityApi.react(postId, type)
      setPosts((prev) => prev.map((p) => p.id === postId ? data.post : p))
    } catch (err) {
      console.error('Failed to react:', err)
    }
  }

  function handleNewPost(post: CommunityPost) {
    setPosts((prev) => [post, ...prev])
  }

  return (
    <div className="min-h-screen bg-neural pb-24 md:pb-8">
      {/* Header */}
      <div className="sticky top-0 z-10 glass-heavy border-b border-border/50">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <h1 className="text-lg font-semibold">Community</h1>
            </div>
            <button className="p-2 rounded-xl hover:bg-muted/50 transition-colors">
              <Filter className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Community guidelines banner */}
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-accent/5 border border-accent/10 mb-3">
            <Shield className="w-4 h-4 text-accent shrink-0" />
            <p className="text-[11px] text-muted-foreground">
              This is a <span className="text-accent font-medium">safe space</span>. Be kind, use tone tags, and add content warnings where needed.
            </p>
          </div>

          {/* Tags filter */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
            <button
              onClick={() => setSelectedTag(undefined)}
              className={cn(
                'px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all shrink-0',
                !selectedTag ? 'bg-primary text-primary-foreground' : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
              )}
            >
              All
            </button>
            {tags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? undefined : tag)}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all shrink-0',
                  selectedTag === tag ? 'bg-primary text-primary-foreground' : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
                )}
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {/* Composer */}
        <PostComposer onPost={handleNewPost} />

        {/* Feed */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-2xl glass p-4 animate-shimmer bg-shimmer bg-shimmer" style={{ height: '160px', animationDelay: `${i * 100}ms` }} />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 animate-fade-in">
            <Sparkles className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No posts yet</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Be the first to share something</p>
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((post, i) => (
              <div key={post.id} style={{ animationDelay: `${i * 40}ms` }}>
                <PostCard post={post} onReact={handleReact} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
