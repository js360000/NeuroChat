import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Sun, Moon, Monitor, Eye, Type, Waves,
  Minus, Plus, RotateCcw, Palette, Sparkles,
} from 'lucide-react'
import { useA11yStore } from '@/stores/a11yStore'
import { cn } from '@/lib/utils'

type ThemeOption = 'light' | 'dark' | 'system'

const THEMES: { value: ThemeOption; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
]

function Toggle({ checked, onChange, label, description, icon: Icon }: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  description?: string
  icon?: typeof Eye
}) {
  return (
    <label className="flex items-center justify-between py-3 cursor-pointer">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4 text-muted-foreground" />
          </div>
        )}
        <div>
          <span className="text-sm font-medium">{label}</span>
          {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
        </div>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0',
          checked ? 'bg-primary' : 'bg-muted'
        )}
      >
        <span className={cn(
          'block w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200',
          checked ? 'translate-x-[22px]' : 'translate-x-[2px]'
        )} />
      </button>
    </label>
  )
}

function Slider({ value, onChange, min, max, step, label, unit, onReset }: {
  value: number
  onChange: (v: number) => void
  min: number
  max: number
  step: number
  label: string
  unit: string
  onReset: () => void
}) {
  const percentage = ((value - min) / (max - min)) * 100
  return (
    <div className="py-2">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-mono tabular-nums">
            {typeof value === 'number' && value % 1 !== 0 ? value.toFixed(1) : value}{unit}
          </span>
          <button
            onClick={onReset}
            className="p-1 rounded-md hover:bg-muted/50 transition-colors"
            title="Reset to default"
          >
            <RotateCcw className="w-3 h-3 text-muted-foreground" />
          </button>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={() => onChange(Math.max(min, value - step))}
          className="p-1.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
        >
          <Minus className="w-3 h-3" />
        </button>
        <div className="flex-1 relative">
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-150"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="absolute inset-0 w-full opacity-0 cursor-pointer"
          />
        </div>
        <button
          onClick={() => onChange(Math.min(max, value + step))}
          className="p-1.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>
    </div>
  )
}

export function AccessibilityPage() {
  const navigate = useNavigate()
  const {
    theme, setTheme,
    highContrast, setHighContrast,
    largeText, setLargeText,
    dyslexicFont, setDyslexicFont,
    reduceMotion, setReduceMotion,
    fontSize, setFontSize,
    lineHeight, setLineHeight,
  } = useA11yStore()

  return (
    <div className="min-h-screen bg-neural pb-24 md:pb-8">
      {/* Header */}
      <div className="sticky top-0 z-10 glass-heavy border-b border-border/50">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate('/settings')} className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Sparkles className="w-5 h-5 text-violet-400" />
          <h1 className="text-lg font-semibold">Accessibility</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Theme */}
        <section className="animate-slide-up">
          <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-2">
            Appearance
          </h2>
          <div className="rounded-2xl glass p-4">
            <div className="flex items-center gap-2 mb-3">
              <Palette className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Theme</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {THEMES.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setTheme(value)}
                  className={cn(
                    'flex flex-col items-center gap-2 p-4 rounded-xl transition-all',
                    theme === value
                      ? 'glass glow-sm ring-1 ring-primary/30'
                      : 'bg-muted/20 hover:bg-muted/30'
                  )}
                >
                  <div className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center transition-all',
                    theme === value ? 'bg-primary/10' : 'bg-muted/50'
                  )}>
                    <Icon className={cn('w-5 h-5', theme === value ? 'text-primary' : 'text-muted-foreground')} />
                  </div>
                  <span className={cn(
                    'text-xs font-medium',
                    theme === value ? 'text-primary' : 'text-muted-foreground'
                  )}>
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Display */}
        <section className="animate-slide-up" style={{ animationDelay: '80ms' }}>
          <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-2">
            Display
          </h2>
          <div className="rounded-2xl glass p-4 divide-y divide-border/30">
            <Toggle
              checked={highContrast}
              onChange={setHighContrast}
              label="High contrast"
              description="Increase contrast for better readability"
              icon={Eye}
            />
            <Toggle
              checked={largeText}
              onChange={setLargeText}
              label="Large text"
              description="Make all text larger and easier to read"
              icon={Type}
            />
            <Toggle
              checked={dyslexicFont}
              onChange={setDyslexicFont}
              label="Dyslexia-friendly font"
              description="Use a font optimised for dyslexic readers"
              icon={Type}
            />
            <Toggle
              checked={reduceMotion}
              onChange={setReduceMotion}
              label="Reduce motion"
              description="Minimise animations and transitions"
              icon={Waves}
            />
          </div>
        </section>

        {/* Text */}
        <section className="animate-slide-up" style={{ animationDelay: '160ms' }}>
          <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-2">
            Text
          </h2>
          <div className="rounded-2xl glass p-4 space-y-2">
            <Slider
              value={fontSize}
              onChange={setFontSize}
              min={80}
              max={150}
              step={5}
              label="Font size"
              unit="%"
              onReset={() => setFontSize(100)}
            />
            <Slider
              value={lineHeight}
              onChange={setLineHeight}
              min={1.2}
              max={2.4}
              step={0.1}
              label="Line height"
              unit="x"
              onReset={() => setLineHeight(1.6)}
            />
          </div>
        </section>

        {/* Preview */}
        <section className="animate-slide-up" style={{ animationDelay: '240ms' }}>
          <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-2">
            Preview
          </h2>
          <div className="rounded-2xl glass p-4">
            <div className="flex gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-xs font-medium shrink-0">
                NC
              </div>
              <div className="glass rounded-2xl rounded-tl-lg px-3.5 py-2.5">
                <p className="text-sm">Hey! How are you doing today? /gen</p>
                <span className="text-[10px] text-muted-foreground/60 mt-1 block">2:30 PM</span>
              </div>
            </div>
            <div className="flex gap-2.5 justify-end">
              <div className="bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-2xl rounded-tr-lg px-3.5 py-2.5">
                <p className="text-sm">I'm doing great, thanks for asking! How about you?</p>
                <span className="text-[10px] text-primary-foreground/50 mt-1 block">2:31 PM</span>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground text-center mt-3">
              This preview reflects your current accessibility settings
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}
