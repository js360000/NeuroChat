import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

const PACE_OPTIONS: Array<'slow' | 'balanced' | 'fast'> = ['slow', 'balanced', 'fast'];
const DENSITY_OPTIONS: Array<'cozy' | 'balanced' | 'compact'> = ['cozy', 'balanced', 'compact'];

export function SandboxPage() {
  const [step, setStep] = useState(0);
  const [calmMode, setCalmMode] = useState(35);
  const [toneTags, setToneTags] = useState(true);
  const [pace, setPace] = useState<'slow' | 'balanced' | 'fast'>('balanced');
  const [directness, setDirectness] = useState<'gentle' | 'direct'>('gentle');
  const [density, setDensity] = useState<'cozy' | 'balanced' | 'compact'>('balanced');

  const calmFactor = useMemo(() => calmMode / 100, [calmMode]);
  const previewStyle = {
    filter: `saturate(${1 - calmFactor * 0.35}) contrast(${1 - calmFactor * 0.05})`,
    transform: `scale(${1 - calmFactor * 0.02})`
  } as const;

  return (
    <div className="min-h-screen bg-gradient-mesh px-4 py-10">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Badge className="mb-3 bg-primary/10 text-primary">Try the vibe</Badge>
            <h1 className="text-3xl sm:text-4xl font-bold text-dark">Preview the onboarding experience</h1>
            <p className="text-neutral-600 mt-2 max-w-2xl">
              Experiment with calm mode, density, and communication preferences—no account needed.
            </p>
          </div>
          <Link to="/register">
            <Button className="bg-primary hover:bg-primary-600">
              Join NeuroNest
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="border border-white/60 bg-white/80">
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-500">Step {step + 1} of 2</p>
                  <h2 className="text-xl font-semibold">
                    {step === 0 ? 'Set your calm mode' : 'Set your communication style'}
                  </h2>
                </div>
                <Sparkles className="w-5 h-5 text-primary" />
              </div>

              {step === 0 ? (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Calm intensity</span>
                      <Badge variant="secondary">{calmMode}%</Badge>
                    </div>
                    <Slider
                      value={[calmMode]}
                      min={0}
                      max={100}
                      step={5}
                      onValueChange={(value) => setCalmMode(value[0])}
                    />
                  </div>

                  <div className="space-y-2">
                    <span className="text-sm font-medium text-neutral-600">Layout density</span>
                    <Select
                      value={density}
                      onValueChange={(value: 'cozy' | 'balanced' | 'compact') => setDensity(value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose density" />
                      </SelectTrigger>
                      <SelectContent>
                        {DENSITY_OPTIONS.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option.charAt(0).toUpperCase() + option.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3">
                    <div>
                      <p className="text-sm font-medium">Tone tags enabled</p>
                      <p className="text-xs text-neutral-500">Add clarity to messages</p>
                    </div>
                    <Switch checked={toneTags} onCheckedChange={setToneTags} />
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-neutral-600">Response pace</p>
                    <Select
                      value={pace}
                      onValueChange={(value) => setPace(value as 'slow' | 'balanced' | 'fast')}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose pace" />
                      </SelectTrigger>
                      <SelectContent>
                        {PACE_OPTIONS.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option.charAt(0).toUpperCase() + option.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium text-neutral-600">Directness</p>
                    <Select
                      value={directness}
                      onValueChange={(value) => setDirectness(value as 'gentle' | 'direct')}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose tone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gentle">Gentle</SelectItem>
                        <SelectItem value="direct">Direct</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  disabled={step === 0}
                  onClick={() => setStep((prev) => Math.max(prev - 1, 0))}
                >
                  Back
                </Button>
                <Button
                  onClick={() => setStep((prev) => Math.min(prev + 1, 1))}
                  disabled={step === 1}
                >
                  Continue
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-white/60 bg-white/80">
            <CardContent className={`p-6 space-y-4 ${density === 'cozy' ? 'py-8' : density === 'compact' ? 'py-4' : ''}`}>
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-primary/10 text-primary">Calm {calmMode}%</Badge>
                <Badge variant="secondary">{pace} pace</Badge>
                <Badge variant="secondary">{directness} tone</Badge>
                <Badge variant="secondary">{density} density</Badge>
              </div>
              <div className="rounded-2xl border border-border bg-white/90 p-4 space-y-3" style={previewStyle}>
                <div className="rounded-2xl bg-primary/10 px-4 py-3">
                  <p className="text-sm font-medium text-dark">You</p>
                  <p className="text-sm text-neutral-600">
                    Hey! I usually need a slower pace.{toneTags ? ' /info' : ''}
                  </p>
                </div>
                <div className="rounded-2xl bg-neutral-100 px-4 py-3">
                  <p className="text-sm font-medium text-dark">Taylor</p>
                  <p className="text-sm text-neutral-600">
                    {directness === 'direct'
                      ? 'Thanks for saying that. I can do slower replies.'
                      : 'Thanks for sharing. I can go gently and slow.'}
                    {toneTags ? ' /gen' : ''}
                  </p>
                </div>
              </div>
              <p className="text-xs text-neutral-500">
                This sandbox is just a preview. Save everything to your profile after signup.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
