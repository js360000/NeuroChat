import { useState, useEffect } from 'react'
import { Settings2, Type, Grid3X3, Volume2, Eye, Palette, X, Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getAACPrefs, saveAACPrefs, type AACDisplayPrefs } from './AACMessageRenderer'
import { toast } from 'sonner'

interface AACPreferencesPanelProps {
  open: boolean
  onClose: () => void
}

export function AACPreferencesPanel({ open, onClose }: AACPreferencesPanelProps) {
  const [prefs, setPrefs] = useState<AACDisplayPrefs>(getAACPrefs)

  useEffect(() => {
    if (open) setPrefs(getAACPrefs())
  }, [open])

  function update(patch: Partial<AACDisplayPrefs>) {
    const updated = { ...prefs, ...patch }
    setPrefs(updated)
    saveAACPrefs(updated)
  }

  const [newWord, setNewWord] = useState('')
  const [newEmoji, setNewEmoji] = useState('')

  function addMapping() {
    if (!newWord.trim() || !newEmoji.trim()) return
    const word = newWord.trim().toLowerCase()
    update({
      customMappings: {
        ...prefs.customMappings,
        [word]: { emoji: newEmoji.trim(), label: word },
      },
    })
    setNewWord('')
    setNewEmoji('')
    toast.success(`Mapped "${word}" to ${newEmoji.trim()}`)
  }

  function removeMapping(word: string) {
    const next = { ...prefs.customMappings }
    delete next[word]
    update({ customMappings: next })
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="glass-heavy rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[85vh] overflow-y-auto p-5 space-y-5 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">AAC Display Preferences</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted/50"><X className="w-4 h-4" /></button>
        </div>

        {/* Symbol size */}
        <section>
          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-2">
            <Grid3X3 className="w-3.5 h-3.5" /> Symbol size
          </label>
          <div className="flex gap-2">
            {(['small', 'medium', 'large'] as const).map(size => (
              <button
                key={size}
                onClick={() => update({ symbolSize: size })}
                className={cn(
                  'flex-1 py-2 rounded-xl text-xs font-medium transition-all capitalize',
                  prefs.symbolSize === size ? 'bg-primary text-primary-foreground' : 'glass text-muted-foreground hover:text-foreground'
                )}
              >
                {size}
              </button>
            ))}
          </div>
        </section>

        {/* Show labels */}
        <section className="flex items-center justify-between">
          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <Type className="w-3.5 h-3.5" /> Show text labels under symbols
          </label>
          <button
            onClick={() => update({ showLabels: !prefs.showLabels })}
            className={cn('relative w-10 h-5 rounded-full transition-colors', prefs.showLabels ? 'bg-primary' : 'bg-muted')}
          >
            <span className={cn('block w-4 h-4 rounded-full bg-white shadow transition-transform', prefs.showLabels ? 'translate-x-[22px]' : 'translate-x-[2px]')} />
          </button>
        </section>

        {/* Auto-read */}
        <section className="flex items-center justify-between">
          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5" /> Auto-read incoming messages
          </label>
          <button
            onClick={() => update({ autoRead: !prefs.autoRead })}
            className={cn('relative w-10 h-5 rounded-full transition-colors', prefs.autoRead ? 'bg-primary' : 'bg-muted')}
          >
            <span className={cn('block w-4 h-4 rounded-full bg-white shadow transition-transform', prefs.autoRead ? 'translate-x-[22px]' : 'translate-x-[2px]')} />
          </button>
        </section>

        {/* Translation style */}
        <section>
          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-2">
            <Eye className="w-3.5 h-3.5" /> How to show translated messages
          </label>
          <div className="space-y-1.5">
            {([
              { value: 'symbols-only', label: 'Symbols only', desc: 'Just show symbol cards' },
              { value: 'symbols-text', label: 'Symbols + text below', desc: 'Symbol cards with small text underneath' },
              { value: 'text-symbols', label: 'Text + symbols below', desc: 'Regular text with symbol cards underneath' },
            ] as const).map(opt => (
              <button
                key={opt.value}
                onClick={() => update({ translationStyle: opt.value })}
                className={cn(
                  'w-full text-left px-3 py-2.5 rounded-xl transition-all',
                  prefs.translationStyle === opt.value
                    ? 'bg-primary/10 ring-1 ring-primary/20 text-foreground'
                    : 'glass text-muted-foreground hover:text-foreground'
                )}
              >
                <span className="text-xs font-medium">{opt.label}</span>
                <p className="text-[10px] text-muted-foreground/70 mt-0.5">{opt.desc}</p>
              </button>
            ))}
          </div>
        </section>

        {/* Custom mappings */}
        <section>
          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-2">
            <Palette className="w-3.5 h-3.5" /> Custom word → symbol mappings
          </label>
          <p className="text-[10px] text-muted-foreground/60 mb-2">
            Map specific words to custom emoji symbols. These take priority over built-in mappings.
          </p>

          {/* Existing mappings */}
          {Object.keys(prefs.customMappings).length > 0 && (
            <div className="space-y-1 mb-3">
              {Object.entries(prefs.customMappings).map(([word, mapping]) => (
                <div key={word} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg glass">
                  <span className="text-lg">{mapping.emoji}</span>
                  <span className="text-xs font-medium flex-1">{word}</span>
                  <button onClick={() => removeMapping(word)} className="p-1 rounded hover:bg-red-500/10 hover:text-red-400">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add new mapping */}
          <div className="flex gap-2">
            <input
              value={newWord}
              onChange={e => setNewWord(e.target.value)}
              placeholder="Word..."
              className="flex-1 px-2.5 py-2 rounded-lg bg-muted/30 text-xs focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
            <input
              value={newEmoji}
              onChange={e => setNewEmoji(e.target.value)}
              placeholder="Emoji"
              className="w-16 px-2.5 py-2 rounded-lg bg-muted/30 text-xs text-center focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
            <button
              onClick={addMapping}
              disabled={!newWord.trim() || !newEmoji.trim()}
              className="p-2 rounded-lg bg-primary text-primary-foreground disabled:opacity-30"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </section>

        {/* Preview */}
        <section className="pt-3 border-t border-border/30">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Preview</p>
          <div className="glass rounded-xl p-3 space-y-2">
            <p className="text-[10px] text-muted-foreground">Incoming: "Hi, I'm happy to see you"</p>
            <div className="flex flex-wrap gap-1.5">
              {[
                { emoji: '👋', label: 'Hello' },
                { emoji: '😊', label: 'Happy' },
                { emoji: '👀', label: 'Look' },
              ].map((s, i) => (
                <div
                  key={i}
                  className={cn(
                    'flex flex-col items-center justify-center gap-0.5 rounded-xl bg-white/5 border border-white/10 p-1.5',
                    prefs.symbolSize === 'small' && 'min-w-[40px] min-h-[40px] text-lg',
                    prefs.symbolSize === 'medium' && 'min-w-[56px] min-h-[56px] text-2xl',
                    prefs.symbolSize === 'large' && 'min-w-[72px] min-h-[72px] text-3xl',
                  )}
                >
                  <span>{s.emoji}</span>
                  {prefs.showLabels && <span className="text-[9px] font-medium text-muted-foreground">{s.label}</span>}
                </div>
              ))}
            </div>
            {prefs.translationStyle !== 'symbols-only' && (
              <p className="text-[10px] text-muted-foreground/50">Hi, I'm happy to see you</p>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
