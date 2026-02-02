import { useEffect, useRef, useState } from 'react';
import {
  Accessibility,
  Eye,
  Moon,
  SlidersHorizontal,
  Sun,
  Target,
  Type,
  Underline,
  Waves
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { applyA11ySettings, loadA11ySettings, saveA11ySettings } from '@/lib/a11y';

export function AccessibilityControls() {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState(loadA11ySettings);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    applyA11ySettings(settings);
    saveA11ySettings(settings);
  }, [settings]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!panelRef.current) return;
      if (panelRef.current.contains(event.target as Node)) return;
      setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClick);
    }
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleTheme = () => {
    setSettings((prev) => ({ ...prev, theme: prev.theme === 'dark' ? 'light' : 'dark' }));
  };

  return (
    <div className="relative" ref={panelRef}>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
          {settings.theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-label="Accessibility settings"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </Button>
      </div>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-72 rounded-2xl border border-border bg-background/95 p-4 shadow-card backdrop-blur">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Accessibility className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold">Accessibility</span>
            </div>
            <Badge variant="secondary">{settings.theme === 'dark' ? 'Dark' : 'Light'}</Badge>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-neutral-600">
                <Eye className="w-4 h-4" />
                High contrast
              </div>
              <Switch
                checked={settings.highContrast}
                onCheckedChange={() => toggleSetting('highContrast')}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-neutral-600">
                <Type className="w-4 h-4" />
                Large text
              </div>
              <Switch
                checked={settings.largeText}
                onCheckedChange={() => toggleSetting('largeText')}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-neutral-600">
                <Type className="w-4 h-4" />
                Dyslexic font
              </div>
              <Switch
                checked={settings.dyslexicFont}
                onCheckedChange={() => toggleSetting('dyslexicFont')}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-neutral-600">
                <Underline className="w-4 h-4" />
                Underline links
              </div>
              <Switch
                checked={settings.underlineLinks}
                onCheckedChange={() => toggleSetting('underlineLinks')}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-neutral-600">
                <Waves className="w-4 h-4" />
                Reduce motion
              </div>
              <Switch
                checked={settings.reduceMotion}
                onCheckedChange={() => toggleSetting('reduceMotion')}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-neutral-600">
                <Target className="w-4 h-4" />
                Strong focus ring
              </div>
              <Switch
                checked={settings.focusRing}
                onCheckedChange={() => toggleSetting('focusRing')}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
