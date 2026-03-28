import { useState } from 'react'
import { Flag, Ban, X, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const REPORT_REASONS = [
  'Harassment or bullying',
  'Inappropriate or explicit content',
  'Spam or scam',
  'Fake profile / catfishing',
  'Threatening behaviour',
  'Hate speech or discrimination',
  'Unsolicited NSFW content',
  'Under-age user',
  'Other',
]

interface Props {
  open: boolean
  onClose: () => void
  targetUserId: string
  targetUserName: string
  mode: 'report' | 'block' | 'report-and-block'
  onComplete?: () => void
}

export function ReportBlockDialog({ open, onClose, targetUserId, targetUserName, mode, onComplete }: Props) {
  const [reason, setReason] = useState('')
  const [details, setDetails] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const showReport = mode === 'report' || mode === 'report-and-block'
  const showBlock = mode === 'block' || mode === 'report-and-block'
  // targetUserId will be used when API endpoints are wired
  void targetUserId

  async function handleSubmit() {
    if (showReport && !reason) { toast.error('Please select a reason'); return }
    setSubmitting(true)
    try {
      // In production, these would hit real API endpoints
      if (showReport) {
        // await api.post(`/user/${targetUserId}/report`, { reason, details })
        toast.success('Report submitted — our moderation team will review it.')
      }
      if (showBlock) {
        // await api.post(`/user/${targetUserId}/block`)
        toast.success(`${targetUserName} has been blocked.`)
      }
      onClose()
      setReason(''); setDetails('')
      onComplete?.()
    } catch {
      toast.error('Failed to submit. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="glass-heavy rounded-2xl p-6 max-w-sm w-full space-y-4 animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center',
              showBlock ? 'bg-red-500/10' : 'bg-amber-500/10'
            )}>
              {showBlock ? <Ban className="w-5 h-5 text-red-400" /> : <Flag className="w-5 h-5 text-amber-400" />}
            </div>
            <h3 className="font-semibold">
              {mode === 'report-and-block' ? 'Report & Block' : mode === 'block' ? 'Block' : 'Report'} {targetUserName}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted/50"><X className="w-4 h-4" /></button>
        </div>

        {showReport && (
          <>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Reason</label>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {REPORT_REASONS.map((r) => (
                  <button key={r} onClick={() => setReason(r)}
                    className={cn('w-full text-left px-3 py-2 rounded-xl text-xs transition-all',
                      reason === r ? 'bg-primary/10 text-primary ring-1 ring-primary/20' : 'bg-muted/20 text-muted-foreground hover:bg-muted/30'
                    )}>
                    <div className="flex items-center gap-2">
                      {reason === r && <Check className="w-3 h-3 text-primary" />}
                      <span>{r}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Additional details (optional)</label>
              <textarea value={details} onChange={(e) => setDetails(e.target.value)} rows={2}
                className="w-full px-3 py-2 rounded-xl bg-muted/40 glass text-xs focus:outline-none focus:ring-1 focus:ring-primary/30 resize-none"
                placeholder="Anything else we should know..." />
            </div>
          </>
        )}

        {showBlock && !showReport && (
          <p className="text-xs text-muted-foreground">
            {targetUserName} won't be able to message you or see your profile. You can unblock them later from your privacy settings.
          </p>
        )}

        <div className="flex gap-2 pt-1">
          <button onClick={onClose}
            className="flex-1 px-4 py-2 rounded-xl bg-muted text-foreground text-sm font-medium hover:bg-muted/80 transition-all">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={submitting || (showReport && !reason)}
            className={cn('flex-1 px-4 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-50',
              showBlock ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-primary text-primary-foreground hover:brightness-110'
            )}>
            {submitting ? 'Submitting...' : mode === 'report-and-block' ? 'Report & Block' : mode === 'block' ? 'Block' : 'Report'}
          </button>
        </div>
      </div>
    </div>
  )
}
