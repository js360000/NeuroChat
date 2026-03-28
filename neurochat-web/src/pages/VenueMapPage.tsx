import { useState, useEffect, useMemo } from 'react'
import {
  Search, MapPin, Plus, Star, X, ArrowLeft, Clock, ChevronDown,
  Coffee, UtensilsCrossed, BookOpen, Trees, Dumbbell, ShoppingBag,
  Clapperboard, Landmark, Wine, MoreHorizontal, Loader2,
  Volume2, Sun, Users, Wind, Shield, Send, SortAsc,
} from 'lucide-react'
import { venuesApi, type Venue, type VenueReview } from '@/lib/api/venues'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// ═══════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════

const CATEGORIES = [
  { id: 'cafe', label: 'Cafe', icon: Coffee },
  { id: 'restaurant', label: 'Restaurant', icon: UtensilsCrossed },
  { id: 'library', label: 'Library', icon: BookOpen },
  { id: 'park', label: 'Park', icon: Trees },
  { id: 'gym', label: 'Gym', icon: Dumbbell },
  { id: 'shop', label: 'Shop', icon: ShoppingBag },
  { id: 'cinema', label: 'Cinema', icon: Clapperboard },
  { id: 'museum', label: 'Museum', icon: Landmark },
  { id: 'bar', label: 'Bar', icon: Wine },
  { id: 'other', label: 'Other', icon: MoreHorizontal },
] as const

const SORT_OPTIONS = [
  { id: 'sensory', label: 'Sensory-friendly first' },
  { id: 'reviews', label: 'Most reviewed' },
  { id: 'newest', label: 'Newest' },
] as const

const DIMENSIONS = [
  { key: 'noise' as const, label: 'Noise', icon: Volume2, emoji: '🔊' },
  { key: 'lighting' as const, label: 'Lighting', icon: Sun, emoji: '💡' },
  { key: 'crowding' as const, label: 'Crowding', icon: Users, emoji: '👥' },
  { key: 'scents' as const, label: 'Scents', icon: Wind, emoji: '👃' },
  { key: 'predictability' as const, label: 'Predictability', icon: Shield, emoji: '🔮' },
] as const

const TIME_SLOTS = ['Morning', 'Afternoon', 'Evening', 'Night', 'Weekend'] as const

type DimensionKey = typeof DIMENSIONS[number]['key']
type SortId = typeof SORT_OPTIONS[number]['id']

// ═══════════════════════════════════════════
// Sensory helpers
// ═══════════════════════════════════════════

function getOverallScore(scores: Record<DimensionKey, number>): number {
  const vals = DIMENSIONS.map(d => scores[d.key] || 0).filter(v => v > 0)
  if (vals.length === 0) return 0
  return vals.reduce((a, b) => a + b, 0) / vals.length
}

function getScoreColor(score: number): string {
  if (score <= 2) return 'text-emerald-400'
  if (score <= 3) return 'text-amber-400'
  return 'text-red-400'
}

function getScoreBg(score: number): string {
  if (score <= 2) return 'bg-emerald-500/15 text-emerald-400 ring-emerald-500/20'
  if (score <= 3) return 'bg-amber-500/15 text-amber-400 ring-amber-500/20'
  return 'bg-red-500/15 text-red-400 ring-red-500/20'
}

function getScoreLabel(score: number): string {
  if (score <= 2) return 'Calm'
  if (score <= 3) return 'Moderate'
  return 'Intense'
}

function getScoreFill(score: number): string {
  if (score <= 2) return 'rgba(52, 211, 153, 0.25)'
  if (score <= 3) return 'rgba(251, 191, 36, 0.25)'
  return 'rgba(248, 113, 113, 0.25)'
}

function getScoreStroke(score: number): string {
  if (score <= 2) return 'rgba(52, 211, 153, 0.7)'
  if (score <= 3) return 'rgba(251, 191, 36, 0.7)'
  return 'rgba(248, 113, 113, 0.7)'
}

function getDimensionBarColor(val: number): string {
  if (val <= 2) return 'bg-emerald-400'
  if (val <= 3) return 'bg-amber-400'
  return 'bg-red-400'
}

// ═══════════════════════════════════════════
// SVG Radar / Spider Chart
// ═══════════════════════════════════════════

function RadarChart({
  scores,
  size = 120,
  className,
}: {
  scores: Record<DimensionKey, number>
  size?: number
  className?: string
}) {
  const cx = size / 2
  const cy = size / 2
  const maxR = size / 2 - 14
  const dims = DIMENSIONS.map(d => d.key)

  // Compute pentagon vertex positions for a given radius
  function getPoint(index: number, radius: number): [number, number] {
    // Start from top (-90deg) and go clockwise
    const angle = (Math.PI * 2 * index) / 5 - Math.PI / 2
    return [cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)]
  }

  // Build polygon path for grid level
  function gridPath(level: number): string {
    const r = (level / 5) * maxR
    const points = Array.from({ length: 5 }, (_, i) => getPoint(i, r))
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ') + ' Z'
  }

  // Build the data polygon
  const dataPoints = dims.map((key, i) => {
    const val = Math.max(0, Math.min(5, scores[key] || 0))
    const r = (val / 5) * maxR
    return getPoint(i, r)
  })
  const dataPath = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ') + ' Z'

  const overall = getOverallScore(scores)

  // Label positions slightly beyond the pentagon
  const labelPoints = Array.from({ length: 5 }, (_, i) => getPoint(i, maxR + 11))
  const shortLabels = ['N', 'L', 'C', 'S', 'P']

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={className}>
      {/* Grid levels 1-5 */}
      {[1, 2, 3, 4, 5].map(level => (
        <path
          key={level}
          d={gridPath(level)}
          fill="none"
          stroke="currentColor"
          strokeWidth={level === 5 ? 0.8 : 0.4}
          className="text-muted-foreground/20"
        />
      ))}

      {/* Axes */}
      {Array.from({ length: 5 }, (_, i) => {
        const [px, py] = getPoint(i, maxR)
        return (
          <line
            key={i}
            x1={cx} y1={cy}
            x2={px} y2={py}
            stroke="currentColor"
            strokeWidth={0.4}
            className="text-muted-foreground/15"
          />
        )
      })}

      {/* Data polygon fill */}
      <path
        d={dataPath}
        fill={getScoreFill(overall)}
        stroke={getScoreStroke(overall)}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />

      {/* Data point dots */}
      {dataPoints.map(([px, py], i) => (
        <circle
          key={i}
          cx={px} cy={py}
          r={2.5}
          fill={getScoreStroke(overall)}
          stroke="currentColor"
          strokeWidth={0.5}
          className="text-background"
        />
      ))}

      {/* Axis labels */}
      {labelPoints.map(([px, py], i) => (
        <text
          key={i}
          x={px} y={py}
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-muted-foreground text-[8px] font-medium"
          style={{ fontSize: size < 100 ? '7px' : '8px' }}
        >
          {shortLabels[i]}
        </text>
      ))}
    </svg>
  )
}

// Larger radar for detail view with full labels
function RadarChartLarge({
  scores,
  size = 240,
  className,
}: {
  scores: Record<DimensionKey, number>
  size?: number
  className?: string
}) {
  const cx = size / 2
  const cy = size / 2
  const maxR = size / 2 - 30

  function getPoint(index: number, radius: number): [number, number] {
    const angle = (Math.PI * 2 * index) / 5 - Math.PI / 2
    return [cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)]
  }

  function gridPath(level: number): string {
    const r = (level / 5) * maxR
    const points = Array.from({ length: 5 }, (_, i) => getPoint(i, r))
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ') + ' Z'
  }

  const dims = DIMENSIONS.map(d => d.key)
  const dataPoints = dims.map((key, i) => {
    const val = Math.max(0, Math.min(5, scores[key] || 0))
    const r = (val / 5) * maxR
    return getPoint(i, r)
  })
  const dataPath = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ') + ' Z'

  const overall = getOverallScore(scores)
  const labelPoints = Array.from({ length: 5 }, (_, i) => getPoint(i, maxR + 22))
  const labels = DIMENSIONS.map(d => d.label)

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={className}>
      {/* Grid levels */}
      {[1, 2, 3, 4, 5].map(level => (
        <path
          key={level}
          d={gridPath(level)}
          fill="none"
          stroke="currentColor"
          strokeWidth={level === 5 ? 1 : 0.5}
          className="text-muted-foreground/20"
        />
      ))}

      {/* Level numbers on first axis */}
      {[1, 2, 3, 4, 5].map(level => {
        const r = (level / 5) * maxR
        const [px, py] = getPoint(0, r)
        return (
          <text
            key={level}
            x={px + 6} y={py - 4}
            className="fill-muted-foreground/40 text-[9px]"
            style={{ fontSize: '9px' }}
          >
            {level}
          </text>
        )
      })}

      {/* Axes */}
      {Array.from({ length: 5 }, (_, i) => {
        const [px, py] = getPoint(i, maxR)
        return (
          <line
            key={i}
            x1={cx} y1={cy}
            x2={px} y2={py}
            stroke="currentColor"
            strokeWidth={0.5}
            className="text-muted-foreground/15"
          />
        )
      })}

      {/* Data polygon */}
      <path
        d={dataPath}
        fill={getScoreFill(overall)}
        stroke={getScoreStroke(overall)}
        strokeWidth={2}
        strokeLinejoin="round"
      />

      {/* Data dots */}
      {dataPoints.map(([px, py], i) => (
        <circle
          key={i}
          cx={px} cy={py}
          r={4}
          fill={getScoreStroke(overall)}
          stroke="currentColor"
          strokeWidth={1}
          className="text-background"
        />
      ))}

      {/* Full labels */}
      {labelPoints.map(([px, py], i) => (
        <text
          key={i}
          x={px} y={py}
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-muted-foreground text-[10px] font-medium"
          style={{ fontSize: '10px' }}
        >
          {labels[i]}
        </text>
      ))}
    </svg>
  )
}

// ═══════════════════════════════════════════
// Category icon helper
// ═══════════════════════════════════════════

function getCategoryIcon(cat?: string) {
  const found = CATEGORIES.find(c => c.id === cat?.toLowerCase())
  return found?.icon || MapPin
}

function getCategoryLabel(cat?: string) {
  const found = CATEGORIES.find(c => c.id === cat?.toLowerCase())
  return found?.label || cat || 'Venue'
}

// ═══════════════════════════════════════════
// Venue Card
// ═══════════════════════════════════════════

function VenueCard({
  venue,
  onClick,
}: {
  venue: Venue
  onClick: () => void
}) {
  const overall = getOverallScore(venue.averageScores)
  const CatIcon = getCategoryIcon(venue.category)

  return (
    <button
      onClick={onClick}
      className="w-full text-left p-4 rounded-2xl glass hover:glow-sm transition-all animate-slide-up group"
    >
      <div className="flex gap-3">
        {/* Radar chart thumbnail */}
        <div className="shrink-0">
          <RadarChart scores={venue.averageScores} size={80} />
        </div>

        <div className="flex-1 min-w-0">
          {/* Name + category */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                {venue.name}
              </h3>
              {venue.address && (
                <p className="text-[11px] text-muted-foreground truncate mt-0.5 flex items-center gap-1">
                  <MapPin className="w-3 h-3 shrink-0" />
                  {venue.address}
                </p>
              )}
            </div>

            {/* Overall score badge */}
            {overall > 0 && (
              <span className={cn(
                'shrink-0 px-2 py-0.5 rounded-lg text-[10px] font-bold ring-1 tabular-nums',
                getScoreBg(overall),
              )}>
                {overall.toFixed(1)} {getScoreLabel(overall)}
              </span>
            )}
          </div>

          {/* Category + reviews */}
          <div className="flex items-center gap-2 mt-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted/30 text-[10px] font-medium text-muted-foreground">
              <CatIcon className="w-3 h-3" />
              {getCategoryLabel(venue.category)}
            </span>
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Star className="w-3 h-3" />
              {venue.reviewCount} {venue.reviewCount === 1 ? 'review' : 'reviews'}
            </span>
          </div>
        </div>
      </div>
    </button>
  )
}

// ═══════════════════════════════════════════
// Sensory Forecast Grid
// ═══════════════════════════════════════════

function SensoryForecast({ reviews }: { reviews: VenueReview[] }) {
  // Group reviews by time of visit and compute averages per dimension
  const forecast = useMemo(() => {
    const grouped: Record<string, VenueReview[]> = {}
    TIME_SLOTS.forEach(slot => { grouped[slot] = [] })

    reviews.forEach(r => {
      if (r.timeOfVisit && grouped[r.timeOfVisit]) {
        grouped[r.timeOfVisit].push(r)
      }
    })

    return TIME_SLOTS.map(slot => {
      const slotReviews = grouped[slot]
      if (slotReviews.length === 0) return { slot, count: 0, scores: null }

      const scores: Record<DimensionKey, number> = {
        noise: 0, lighting: 0, crowding: 0, scents: 0, predictability: 0,
      }
      const counts: Record<DimensionKey, number> = {
        noise: 0, lighting: 0, crowding: 0, scents: 0, predictability: 0,
      }

      slotReviews.forEach(r => {
        DIMENSIONS.forEach(d => {
          const val = r[d.key]
          if (val && val > 0) {
            scores[d.key] += val
            counts[d.key]++
          }
        })
      })

      DIMENSIONS.forEach(d => {
        scores[d.key] = counts[d.key] > 0 ? scores[d.key] / counts[d.key] : 0
      })

      return { slot, count: slotReviews.length, scores }
    })
  }, [reviews])

  function getCellBg(val: number): string {
    if (val === 0) return 'bg-muted/10'
    if (val <= 2) return 'bg-emerald-500/20 text-emerald-400'
    if (val <= 3) return 'bg-amber-500/20 text-amber-400'
    return 'bg-red-500/20 text-red-400'
  }

  const totalWithTime = forecast.reduce((s, f) => s + f.count, 0)

  if (totalWithTime === 0) {
    return (
      <div className="text-center py-6">
        <Clock className="w-6 h-6 text-muted-foreground/30 mx-auto mb-2" />
        <p className="text-xs text-muted-foreground">No time-based data yet</p>
        <p className="text-[10px] text-muted-foreground/60 mt-0.5">Add reviews with a time of visit to build forecasts</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Header row */}
      <div className="grid grid-cols-6 gap-1 text-center">
        <div /> {/* Empty corner cell */}
        {DIMENSIONS.map(d => (
          <div key={d.key} className="text-[9px] text-muted-foreground font-medium truncate" title={d.label}>
            {d.emoji}
          </div>
        ))}
      </div>

      {/* Data rows */}
      {forecast.map(row => (
        <div key={row.slot} className="grid grid-cols-6 gap-1 items-center">
          <div className="text-[10px] text-muted-foreground font-medium truncate pr-1">
            {row.slot}
          </div>
          {DIMENSIONS.map(d => (
            <div
              key={d.key}
              className={cn(
                'h-7 rounded-md flex items-center justify-center text-[10px] font-bold tabular-nums transition-colors',
                row.scores ? getCellBg(row.scores[d.key]) : 'bg-muted/10 text-muted-foreground/30',
              )}
            >
              {row.scores && row.scores[d.key] > 0 ? row.scores[d.key].toFixed(1) : '-'}
            </div>
          ))}
        </div>
      ))}

      <p className="text-[10px] text-muted-foreground/60 text-center">
        Based on {totalWithTime} {totalWithTime === 1 ? 'review' : 'reviews'} with time data
      </p>
    </div>
  )
}

// ═══════════════════════════════════════════
// Review Rating Selector (colored 1-5 buttons)
// ═══════════════════════════════════════════

function RatingSelector({
  label,
  emoji,
  value,
  onChange,
}: {
  label: string
  emoji: string
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm w-32 shrink-0">{emoji} {label}</span>
      <div className="flex-1 flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={cn(
              'flex-1 h-8 rounded-lg text-xs font-medium transition-all',
              value >= n
                ? n <= 2 ? 'bg-emerald-500/20 text-emerald-400' : n <= 3 ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'
                : 'bg-muted/20 text-muted-foreground hover:bg-muted/30'
            )}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════
// Add Review Form
// ═══════════════════════════════════════════

function AddReviewForm({
  venueId,
  onSubmitted,
}: {
  venueId: string
  onSubmitted: (venue: Venue) => void
}) {
  const [noise, setNoise] = useState(0)
  const [lighting, setLighting] = useState(0)
  const [crowding, setCrowding] = useState(0)
  const [scents, setScents] = useState(0)
  const [predictability, setPredictability] = useState(0)
  const [notes, setNotes] = useState('')
  const [timeOfVisit, setTimeOfVisit] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit() {
    if (noise === 0 && lighting === 0 && crowding === 0 && scents === 0 && predictability === 0) {
      toast.error('Please rate at least one sensory dimension')
      return
    }
    setSubmitting(true)
    try {
      const data = await venuesApi.review(venueId, {
        noise: noise || undefined,
        lighting: lighting || undefined,
        crowding: crowding || undefined,
        scents: scents || undefined,
        predictability: predictability || undefined,
        notes: notes.trim() || undefined,
        timeOfVisit: timeOfVisit || undefined,
      })
      toast.success('Review submitted! Thank you for helping the community.')
      onSubmitted(data.venue)
      setNoise(0)
      setLighting(0)
      setCrowding(0)
      setScents(0)
      setPredictability(0)
      setNotes('')
      setTimeOfVisit('')
    } catch {
      toast.error('Failed to submit review. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <RatingSelector label="Noise" emoji="🔊" value={noise} onChange={setNoise} />
      <RatingSelector label="Lighting" emoji="💡" value={lighting} onChange={setLighting} />
      <RatingSelector label="Crowding" emoji="👥" value={crowding} onChange={setCrowding} />
      <RatingSelector label="Scents" emoji="👃" value={scents} onChange={setScents} />
      <RatingSelector label="Predictability" emoji="🔮" value={predictability} onChange={setPredictability} />

      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Time of visit</label>
        <div className="flex flex-wrap gap-1.5">
          {TIME_SLOTS.map(slot => (
            <button
              key={slot}
              type="button"
              onClick={() => setTimeOfVisit(timeOfVisit === slot ? '' : slot)}
              className={cn(
                'px-3 py-1.5 rounded-xl text-xs font-medium transition-all',
                timeOfVisit === slot
                  ? 'bg-primary/10 text-primary ring-1 ring-primary/20'
                  : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
              )}
            >
              {slot}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Notes (optional)</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={3}
          maxLength={500}
          placeholder="Describe your sensory experience here... Was it quiet? Bright? How did it feel?"
          className="w-full px-3 py-2.5 rounded-xl bg-muted/40 glass text-sm focus:outline-none focus:ring-1 focus:ring-primary/30 resize-none"
        />
        <p className="text-[10px] text-muted-foreground text-right mt-0.5">{notes.length}/500</p>
      </div>

      <button
        onClick={handleSubmit}
        disabled={submitting}
        className={cn(
          'w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all',
          'bg-primary text-primary-foreground glow-primary hover:brightness-110 active:scale-[0.98] disabled:opacity-50'
        )}
      >
        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        {submitting ? 'Submitting...' : 'Submit Review'}
      </button>
    </div>
  )
}

// ═══════════════════════════════════════════
// Review Card
// ═══════════════════════════════════════════

function ReviewCard({ review }: { review: VenueReview }) {
  const reviewScores: Record<DimensionKey, number> = {
    noise: review.noise || 0,
    lighting: review.lighting || 0,
    crowding: review.crowding || 0,
    scents: review.scents || 0,
    predictability: review.predictability || 0,
  }

  const ratedDimensions = DIMENSIONS.filter(d => reviewScores[d.key] > 0)
  const timeSince = getTimeSince(review.createdAt)

  return (
    <div className="p-3 rounded-xl bg-muted/20 space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary/50 to-secondary/50 flex items-center justify-center text-[10px] font-bold text-white">
            {review.userName?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <span className="text-xs font-medium">{review.userName || 'Anonymous'}</span>
        </div>
        <div className="flex items-center gap-2">
          {review.timeOfVisit && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {review.timeOfVisit}
            </span>
          )}
          <span className="text-[10px] text-muted-foreground">{timeSince}</span>
        </div>
      </div>

      {/* Dimension ratings inline */}
      {ratedDimensions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {ratedDimensions.map(d => (
            <span
              key={d.key}
              className={cn(
                'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ring-1 tabular-nums',
                getScoreBg(reviewScores[d.key])
              )}
            >
              {d.emoji} {reviewScores[d.key]}
            </span>
          ))}
        </div>
      )}

      {/* Notes */}
      {review.notes && (
        <p className="text-xs text-foreground/80 leading-relaxed">{review.notes}</p>
      )}
    </div>
  )
}

function getTimeSince(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ═══════════════════════════════════════════
// Venue Detail View
// ═══════════════════════════════════════════

function VenueDetail({
  venue,
  onBack,
  onUpdate,
}: {
  venue: Venue
  onBack: () => void
  onUpdate: (v: Venue) => void
}) {
  const overall = getOverallScore(venue.averageScores)
  const CatIcon = getCategoryIcon(venue.category)
  const [showReviewForm, setShowReviewForm] = useState(false)

  function handleReviewSubmitted(updated: Venue) {
    onUpdate(updated)
    setShowReviewForm(false)
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Back button + header */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to venues
      </button>

      {/* Venue header card */}
      <div className="p-5 rounded-2xl glass">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">{venue.name}</h2>
            {venue.address && (
              <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                {venue.address}
              </p>
            )}
            <div className="flex items-center gap-2 mt-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted/30 text-xs font-medium text-muted-foreground">
                <CatIcon className="w-3.5 h-3.5" />
                {getCategoryLabel(venue.category)}
              </span>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Star className="w-3.5 h-3.5" />
                {venue.reviewCount} {venue.reviewCount === 1 ? 'review' : 'reviews'}
              </span>
            </div>
          </div>

          {overall > 0 && (
            <div className={cn(
              'shrink-0 px-3 py-1.5 rounded-xl text-sm font-bold ring-1 text-center',
              getScoreBg(overall),
            )}>
              <div className="text-lg tabular-nums">{overall.toFixed(1)}</div>
              <div className="text-[10px] font-medium">{getScoreLabel(overall)}</div>
            </div>
          )}
        </div>
      </div>

      {/* Large radar chart */}
      <div className="p-5 rounded-2xl glass">
        <h3 className="text-sm font-semibold mb-3">Sensory Profile</h3>
        <div className="flex justify-center">
          <RadarChartLarge scores={venue.averageScores} size={220} />
        </div>

        {/* Dimension bars */}
        <div className="space-y-3 mt-5">
          {DIMENSIONS.map(d => {
            const val = venue.averageScores[d.key] || 0
            const DimIcon = d.icon
            return (
              <div key={d.key} className="flex items-center gap-3">
                <div className="flex items-center gap-2 w-32 shrink-0">
                  <DimIcon className={cn('w-4 h-4', getScoreColor(val || 3))} />
                  <span className="text-xs font-medium">{d.label}</span>
                </div>
                <div className="flex-1 h-2 rounded-full bg-muted/20 overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all duration-500', getDimensionBarColor(val || 3))}
                    style={{ width: val > 0 ? `${(val / 5) * 100}%` : '0%' }}
                  />
                </div>
                <span className={cn(
                  'text-xs font-bold tabular-nums w-8 text-right',
                  val > 0 ? getScoreColor(val) : 'text-muted-foreground/40'
                )}>
                  {val > 0 ? val.toFixed(1) : '-'}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Sensory Forecast */}
      <div className="p-5 rounded-2xl glass">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          Sensory Forecast
        </h3>
        <p className="text-[11px] text-muted-foreground mb-3">
          Expected sensory levels by time of day, based on community reviews.
        </p>
        <SensoryForecast reviews={venue.reviews || []} />
      </div>

      {/* Reviews */}
      <div className="p-5 rounded-2xl glass">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">Reviews ({venue.reviewCount})</h3>
          <button
            onClick={() => setShowReviewForm(!showReviewForm)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all',
              showReviewForm
                ? 'bg-muted/30 text-muted-foreground'
                : 'bg-primary text-primary-foreground glow-primary hover:brightness-110 active:scale-95'
            )}
          >
            {showReviewForm ? (
              <><X className="w-3.5 h-3.5" /> Cancel</>
            ) : (
              <><Plus className="w-3.5 h-3.5" /> Add Review</>
            )}
          </button>
        </div>

        {/* Review form */}
        {showReviewForm && (
          <div className="mb-4 p-4 rounded-xl bg-muted/10 border border-border/30 animate-fade-in">
            <h4 className="text-xs font-semibold text-primary mb-3">Your Sensory Review</h4>
            <AddReviewForm venueId={venue.id} onSubmitted={handleReviewSubmitted} />
          </div>
        )}

        {/* Review list */}
        {venue.reviews && venue.reviews.length > 0 ? (
          <div className="space-y-2">
            {venue.reviews.map(review => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Star className="w-6 h-6 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">No reviews yet</p>
            <p className="text-[10px] text-muted-foreground/60 mt-0.5">Be the first to share your sensory experience</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════
// Add Venue Modal
// ═══════════════════════════════════════════

function AddVenueModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  onCreated: (venue: Venue) => void
}) {
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [category, setCategory] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleCreate() {
    if (!name.trim()) {
      toast.error('Please enter a venue name')
      return
    }
    setSubmitting(true)
    try {
      const data = await venuesApi.create({
        name: name.trim(),
        address: address.trim() || undefined,
        category: category || undefined,
      })
      toast.success(`${name.trim()} added! You can now review it.`)
      onCreated(data.venue)
      setName('')
      setAddress('')
      setCategory('')
    } catch {
      toast.error('Failed to add venue. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-2xl glass-heavy border border-border/50 p-6 space-y-4 animate-slide-up">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" />
            Add New Venue
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <p className="text-xs text-muted-foreground">
          Add a place so the community can share sensory reviews and help each other.
        </p>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              Venue name <span className="text-red-400">*</span>
            </label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={100}
              placeholder="e.g. The Quiet Owl Cafe"
              className="w-full px-3 py-2.5 rounded-xl bg-muted/40 glass text-sm focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Address</label>
            <input
              value={address}
              onChange={e => setAddress(e.target.value)}
              maxLength={200}
              placeholder="e.g. 42 High Street, Manchester"
              className="w-full px-3 py-2.5 rounded-xl bg-muted/40 glass text-sm focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Category</label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map(cat => {
                const CIcon = cat.icon
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(category === cat.id ? '' : cat.id)}
                    className={cn(
                      'inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all',
                      category === cat.id
                        ? 'bg-primary/10 text-primary ring-1 ring-primary/20'
                        : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
                    )}
                  >
                    <CIcon className="w-3 h-3" />
                    {cat.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl glass text-sm font-medium hover:bg-muted/30 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!name.trim() || submitting}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all',
              'bg-primary text-primary-foreground glow-primary hover:brightness-110 active:scale-[0.98] disabled:opacity-50'
            )}
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {submitting ? 'Adding...' : 'Add Venue'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════
// Main VenueMapPage
// ═══════════════════════════════════════════

export function VenueMapPage() {
  const [venues, setVenues] = useState<Venue[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>()
  const [sortBy, setSortBy] = useState<SortId>('sensory')
  const [showSortMenu, setShowSortMenu] = useState(false)
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)

  // Fetch venues
  useEffect(() => {
    loadVenues()
  }, [selectedCategory])

  async function loadVenues() {
    setIsLoading(true)
    try {
      const data = await venuesApi.list({
        q: searchQuery.trim() || undefined,
        category: selectedCategory,
      })
      setVenues(data.venues)
    } catch {
      toast.error('Failed to load venues')
    } finally {
      setIsLoading(false)
    }
  }

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      loadVenues()
    }, 400)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery])

  // Sort venues
  const sortedVenues = useMemo(() => {
    const sorted = [...venues]
    switch (sortBy) {
      case 'sensory':
        sorted.sort((a, b) => {
          const scoreA = getOverallScore(a.averageScores)
          const scoreB = getOverallScore(b.averageScores)
          return scoreA - scoreB // lower = calmer = first
        })
        break
      case 'reviews':
        sorted.sort((a, b) => b.reviewCount - a.reviewCount)
        break
      case 'newest':
        sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        break
    }
    return sorted
  }, [venues, sortBy])

  function handleVenueClick(venue: Venue) {
    // Fetch full venue detail with reviews
    setSelectedVenue(venue)
    venuesApi.get(venue.id).then(data => {
      setSelectedVenue(data.venue)
    }).catch(() => {
      // Already showing the list version; detail fetch failed silently
    })
  }

  function handleVenueUpdate(updated: Venue) {
    setSelectedVenue(updated)
    setVenues(prev => prev.map(v => v.id === updated.id ? updated : v))
  }

  function handleVenueCreated(venue: Venue) {
    setVenues(prev => [venue, ...prev])
    setShowAddModal(false)
    setSelectedVenue(venue)
  }

  return (
    <div className="min-h-screen bg-neural pb-24 md:pb-8">
      {/* Header */}
      <div className="sticky top-0 z-10 glass-heavy border-b border-border/50">
        <div className="max-w-3xl mx-auto px-4 py-3">
          {/* Title row */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              <h1 className="text-lg font-semibold">Sensory Venues</h1>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-medium glow-primary hover:brightness-110 active:scale-95 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Venue
            </button>
          </div>

          {/* Search bar */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search venues by name or address..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-muted/40 glass text-sm focus:outline-none focus:ring-1 focus:ring-primary/30 placeholder:text-muted-foreground/50"
            />
          </div>

          {/* Category filter chips */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
            <button
              onClick={() => setSelectedCategory(undefined)}
              className={cn(
                'px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all shrink-0',
                !selectedCategory ? 'bg-primary text-primary-foreground' : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
              )}
            >
              All
            </button>
            {CATEGORIES.map(cat => {
              const CIcon = cat.icon
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(selectedCategory === cat.id ? undefined : cat.id)}
                  className={cn(
                    'inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all shrink-0',
                    selectedCategory === cat.id ? 'bg-primary text-primary-foreground' : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
                  )}
                >
                  <CIcon className="w-3 h-3" />
                  {cat.label}
                </button>
              )
            })}
          </div>

          {/* Sort row */}
          <div className="flex items-center justify-between mt-2">
            <span className="text-[10px] text-muted-foreground">
              {sortedVenues.length} {sortedVenues.length === 1 ? 'venue' : 'venues'}
            </span>
            <div className="relative">
              <button
                onClick={() => setShowSortMenu(!showSortMenu)}
                className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              >
                <SortAsc className="w-3 h-3" />
                {SORT_OPTIONS.find(s => s.id === sortBy)?.label}
                <ChevronDown className={cn('w-3 h-3 transition-transform', showSortMenu && 'rotate-180')} />
              </button>
              {showSortMenu && (
                <div className="absolute right-0 top-full mt-1 w-48 rounded-xl glass-heavy border border-border/50 py-1 shadow-lg z-20 animate-fade-in">
                  {SORT_OPTIONS.map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => { setSortBy(opt.id); setShowSortMenu(false) }}
                      className={cn(
                        'w-full text-left px-3 py-2 text-xs transition-colors',
                        sortBy === opt.id ? 'text-primary bg-primary/5' : 'text-muted-foreground hover:bg-muted/30'
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-4">
        {selectedVenue ? (
          <VenueDetail
            venue={selectedVenue}
            onBack={() => setSelectedVenue(null)}
            onUpdate={handleVenueUpdate}
          />
        ) : isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl glass p-4 animate-shimmer bg-shimmer"
                style={{ height: '120px', animationDelay: `${i * 80}ms` }}
              />
            ))}
          </div>
        ) : sortedVenues.length === 0 ? (
          <div className="text-center py-16 animate-fade-in">
            <MapPin className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No venues found</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              {searchQuery || selectedCategory
                ? 'Try adjusting your search or filters'
                : 'Be the first to add a venue for the community'}
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-medium glow-primary hover:brightness-110 active:scale-95 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Add a Venue
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {sortedVenues.map((venue, i) => (
              <div key={venue.id} style={{ animationDelay: `${i * 40}ms` }}>
                <VenueCard venue={venue} onClick={() => handleVenueClick(venue)} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Venue Modal */}
      <AddVenueModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onCreated={handleVenueCreated}
      />

      {/* Close sort menu on outside click */}
      {showSortMenu && (
        <div className="fixed inset-0 z-10" onClick={() => setShowSortMenu(false)} />
      )}
    </div>
  )
}
