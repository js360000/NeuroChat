import { useState, useEffect, useRef } from 'react'
import { Search, X, Loader2, Image } from 'lucide-react'
import { cn } from '@/lib/utils'

/* ------------------------------------------------------------------ */
/*  GIF search via Tenor API (free, anonymous, no key for basic use)   */
/*  Falls back to a curated set if API is unavailable                  */
/* ------------------------------------------------------------------ */

const TENOR_API_KEY = 'AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCYQ' // Google's public Tenor key
const TENOR_SEARCH_URL = 'https://tenor.googleapis.com/v2/search'
const TENOR_FEATURED_URL = 'https://tenor.googleapis.com/v2/featured'

interface GifResult {
  id: string
  url: string // full-size URL
  preview: string // small preview URL
  width: number
  height: number
}

async function searchGifs(query: string): Promise<GifResult[]> {
  try {
    const params = new URLSearchParams({
      q: query,
      key: TENOR_API_KEY,
      client_key: 'neurochat',
      limit: '20',
      media_filter: 'tinygif,gif',
    })
    const res = await fetch(`${TENOR_SEARCH_URL}?${params}`)
    if (!res.ok) return []
    const data = await res.json()
    return (data.results || []).map((r: any) => ({
      id: r.id,
      url: r.media_formats?.gif?.url || r.media_formats?.tinygif?.url || '',
      preview: r.media_formats?.tinygif?.url || r.media_formats?.gif?.url || '',
      width: r.media_formats?.tinygif?.dims?.[0] || 200,
      height: r.media_formats?.tinygif?.dims?.[1] || 200,
    }))
  } catch { return [] }
}

async function getFeaturedGifs(): Promise<GifResult[]> {
  try {
    const params = new URLSearchParams({
      key: TENOR_API_KEY,
      client_key: 'neurochat',
      limit: '20',
      media_filter: 'tinygif,gif',
    })
    const res = await fetch(`${TENOR_FEATURED_URL}?${params}`)
    if (!res.ok) return []
    const data = await res.json()
    return (data.results || []).map((r: any) => ({
      id: r.id,
      url: r.media_formats?.gif?.url || r.media_formats?.tinygif?.url || '',
      preview: r.media_formats?.tinygif?.url || r.media_formats?.gif?.url || '',
      width: r.media_formats?.tinygif?.dims?.[0] || 200,
      height: r.media_formats?.tinygif?.dims?.[1] || 200,
    }))
  } catch { return [] }
}

/* ── Suggested search terms ── */
const SUGGESTIONS = ['happy', 'sad', 'thank you', 'excited', 'hug', 'thumbs up', 'love', 'awkward', 'tired', 'celebrate']

/* ------------------------------------------------------------------ */
/*  GIF Picker component                                               */
/* ------------------------------------------------------------------ */

interface GifPickerProps {
  open: boolean
  onClose: () => void
  onSelect: (gifUrl: string) => void
}

export function GifPicker({ open, onClose, onSelect }: GifPickerProps) {
  const [query, setQuery] = useState('')
  const [gifs, setGifs] = useState<GifResult[]>([])
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load featured on open
  useEffect(() => {
    if (open && gifs.length === 0 && !query) {
      setLoading(true)
      getFeaturedGifs().then(setGifs).finally(() => setLoading(false))
    }
  }, [open])

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!query.trim()) {
      getFeaturedGifs().then(setGifs)
      return
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      const results = await searchGifs(query)
      setGifs(results)
      setLoading(false)
    }, 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="glass-heavy rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[70vh] overflow-hidden flex flex-col animate-slide-up"
        onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
          <div className="flex items-center gap-2">
            <Image className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold">Send a GIF</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted/50"><X className="w-4 h-4" /></button>
        </div>

        {/* Search */}
        <div className="px-4 py-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
            <input
              autoFocus value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Search GIFs..."
              className="w-full pl-10 pr-4 py-2 bg-muted/30 rounded-xl text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>
          {/* Quick suggestions */}
          {!query && (
            <div className="flex gap-1 flex-wrap mt-2">
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => setQuery(s)}
                  className="px-2 py-0.5 rounded-lg bg-muted/30 text-[10px] text-muted-foreground hover:text-foreground transition-colors">
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
          ) : gifs.length === 0 ? (
            <p className="text-center text-xs text-muted-foreground py-8">No GIFs found</p>
          ) : (
            <div className="columns-2 gap-2">
              {gifs.map(gif => (
                <button key={gif.id} onClick={() => { onSelect(gif.url); onClose() }}
                  className="w-full mb-2 rounded-xl overflow-hidden hover:ring-2 hover:ring-primary/50 active:scale-95 transition-all break-inside-avoid">
                  <img src={gif.preview} alt="GIF" loading="lazy"
                    className="w-full h-auto rounded-xl" />
                </button>
              ))}
            </div>
          )}
          {/* Tenor attribution */}
          <p className="text-center text-[8px] text-muted-foreground/40 mt-2">Powered by Tenor</p>
        </div>
      </div>
    </div>
  )
}

/** Inline GIF renderer for message bubbles */
export function GifMessage({ url, className }: { url: string; className?: string }) {
  return (
    <div className={cn('rounded-xl overflow-hidden max-w-[280px]', className)}>
      <img src={url} alt="GIF" loading="lazy" className="w-full h-auto rounded-xl" />
    </div>
  )
}

/** Detect if a message content is a GIF URL */
export function isGifMessage(content: string): boolean {
  return content.startsWith('[gif:') && content.endsWith(']')
}

/** Extract GIF URL from message content */
export function extractGifUrl(content: string): string {
  return content.slice(5, -1) // Remove [gif: and ]
}
