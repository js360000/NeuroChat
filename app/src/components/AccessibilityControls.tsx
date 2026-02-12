import { useEffect, useState } from 'react';
import {
  Accessibility,
  Eye,
  Moon,
  MousePointer2,
  Paintbrush,
  RotateCcw,
  Sun,
  Target,
  Type,
  Underline,
  Waves
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTitle, SheetDescription, SheetTrigger } from '@/components/ui/sheet';
import { applyA11ySettings, loadA11ySettings, saveA11ySettings, DEFAULT_SETTINGS, type A11ySettings } from '@/lib/a11y';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
      {children}
    </div>
  );
}

function ToggleRow({ icon: Icon, label, checked, onChange }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm text-foreground">
        <Icon className="w-4 h-4 text-muted-foreground" />
        {label}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function SliderRow({ icon: Icon, label, value, min, max, step, unit, onChange }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 text-foreground">
          <Icon className="w-4 h-4 text-muted-foreground" />
          {label}
        </div>
        <span className="text-xs font-mono text-muted-foreground">
          {value}{unit}
        </span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={([v]) => onChange(v)}
      />
    </div>
  );
}

export function AccessibilityControls() {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<A11ySettings>(loadA11ySettings);

  useEffect(() => {
    applyA11ySettings(settings);
    saveA11ySettings(settings);
  }, [settings]);

  const toggle = (key: keyof A11ySettings) =>
    setSettings((prev) => ({ ...prev, [key]: !prev[key as keyof typeof prev] }));

  const set = (key: keyof A11ySettings, value: number | boolean) =>
    setSettings((prev) => ({ ...prev, [key]: value }));

  const reset = () => {
    const theme = settings.theme;
    setSettings({ ...DEFAULT_SETTINGS, theme });
  };

  const toggleTheme = () =>
    setSettings((prev) => ({ ...prev, theme: prev.theme === 'dark' ? 'light' : 'dark' }));

  const activeCount = [
    settings.highContrast,
    settings.largeText,
    settings.dyslexicFont,
    settings.underlineLinks,
    settings.reduceMotion,
    settings.focusRing,
    settings.blueLightFilter,
    settings.fontSize !== 100,
    settings.lineHeight !== 1.6,
    settings.letterSpacing !== 0,
    settings.saturation !== 100,
    settings.cursorSize !== 1,
  ].filter(Boolean).length;

  return (
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
        {settings.theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Accessibility settings" className="relative">
            <Accessibility className="w-4 h-4" />
            {activeCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white px-1">
                {activeCount}
              </span>
            )}
          </Button>
        </SheetTrigger>

        <SheetContent side="right" className="w-[340px] sm:w-[380px] p-0 overflow-y-auto">
          <SheetTitle className="sr-only">Accessibility settings</SheetTitle>
          <SheetDescription className="sr-only">Adjust display and interaction preferences</SheetDescription>
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-background border-b border-border px-5 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Accessibility className="w-5 h-5 text-primary" />
                  <span className="text-base font-bold">Accessibility</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{settings.theme === 'dark' ? 'Dark' : 'Light'}</Badge>
                  <Button variant="ghost" size="icon" onClick={reset} aria-label="Reset all">
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 px-5 py-5 space-y-6">
              {/* Vision */}
              <Section title="Vision">
                <ToggleRow icon={Eye} label="High contrast" checked={settings.highContrast} onChange={() => toggle('highContrast')} />
                <ToggleRow icon={Paintbrush} label="Blue light filter" checked={settings.blueLightFilter} onChange={() => toggle('blueLightFilter')} />
                <SliderRow
                  icon={Paintbrush}
                  label="Colour saturation"
                  value={settings.saturation}
                  min={0} max={150} step={10} unit="%"
                  onChange={(v) => set('saturation', v)}
                />
              </Section>

              {/* Typography */}
              <Section title="Typography">
                <ToggleRow icon={Type} label="Dyslexia-friendly font" checked={settings.dyslexicFont} onChange={() => toggle('dyslexicFont')} />
                <ToggleRow icon={Type} label="Large text" checked={settings.largeText} onChange={() => toggle('largeText')} />
                <SliderRow
                  icon={Type}
                  label="Font size"
                  value={settings.fontSize}
                  min={80} max={150} step={5} unit="%"
                  onChange={(v) => set('fontSize', v)}
                />
                <SliderRow
                  icon={Type}
                  label="Line height"
                  value={settings.lineHeight}
                  min={1.2} max={2.4} step={0.1} unit=""
                  onChange={(v) => set('lineHeight', Math.round(v * 10) / 10)}
                />
                <SliderRow
                  icon={Type}
                  label="Letter spacing"
                  value={settings.letterSpacing}
                  min={0} max={0.2} step={0.01} unit="em"
                  onChange={(v) => set('letterSpacing', Math.round(v * 100) / 100)}
                />
              </Section>

              {/* Navigation */}
              <Section title="Navigation & Focus">
                <ToggleRow icon={Underline} label="Underline links" checked={settings.underlineLinks} onChange={() => toggle('underlineLinks')} />
                <ToggleRow icon={Target} label="Strong focus ring" checked={settings.focusRing} onChange={() => toggle('focusRing')} />
                <SliderRow
                  icon={MousePointer2}
                  label="Cursor size"
                  value={settings.cursorSize}
                  min={1} max={3} step={0.5} unit="×"
                  onChange={(v) => set('cursorSize', v)}
                />
              </Section>

              {/* Motion */}
              <Section title="Motion & Animation">
                <ToggleRow icon={Waves} label="Reduce motion" checked={settings.reduceMotion} onChange={() => toggle('reduceMotion')} />
              </Section>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-background border-t border-border px-5 py-3">
              <p className="text-[11px] text-muted-foreground text-center">
                Settings are saved locally and applied instantly.
              </p>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
