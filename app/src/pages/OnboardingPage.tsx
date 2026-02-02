import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useAuthStore } from '@/lib/stores/auth';
import {
  applyExperiencePreferences,
  DEFAULT_EXPERIENCE_PREFERENCES,
  type ExperiencePreferences
} from '@/lib/experience';
import { toast } from 'sonner';

const TRAIT_OPTIONS = [
  'Autism',
  'ADHD',
  'Dyslexia',
  'Dyspraxia',
  'OCD',
  'Anxiety',
  'CPTSD',
  'Tourette',
  'Executive dysfunction',
  'Sensory sensitivity'
];

const INTEREST_OPTIONS = [
  'Gaming',
  'Art',
  'Music',
  'Science',
  'Books',
  'Nature',
  'Technology',
  'Anime',
  'Design',
  'Cooking'
];

const GOAL_OPTIONS = [
  'Friendship',
  'Dating',
  'Creative collaborators',
  'Study buddies',
  'Accountability partners',
  'Community events',
  'Co-working',
  'Local meetups'
];

const STEP_TITLES = ['Calm your space', 'Communication style', 'Identity & goals'];

export function OnboardingPage() {
  const navigate = useNavigate();
  const { user, updateProfile } = useAuthStore();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [experience, setExperience] = useState<ExperiencePreferences>(() => ({
    calmMode: user?.experiencePreferences?.calmMode ?? DEFAULT_EXPERIENCE_PREFERENCES.calmMode,
    density: user?.experiencePreferences?.density ?? DEFAULT_EXPERIENCE_PREFERENCES.density,
    reduceMotion: user?.experiencePreferences?.reduceMotion ?? DEFAULT_EXPERIENCE_PREFERENCES.reduceMotion,
    reduceSaturation:
      user?.experiencePreferences?.reduceSaturation ?? DEFAULT_EXPERIENCE_PREFERENCES.reduceSaturation
  }));

  const [communication, setCommunication] = useState<{
    preferredToneTags: boolean;
    aiExplanations: boolean;
    voiceMessages: boolean;
    responsePace: 'slow' | 'balanced' | 'fast';
    directness: 'direct' | 'gentle';
  }>({
    preferredToneTags: user?.communicationPreferences?.preferredToneTags ?? true,
    aiExplanations: user?.communicationPreferences?.aiExplanations ?? true,
    voiceMessages: user?.communicationPreferences?.voiceMessages ?? false,
    responsePace: user?.communicationPreferences?.responsePace ?? 'balanced',
    directness: user?.communicationPreferences?.directness ?? 'gentle'
  });

  const [traits, setTraits] = useState<string[]>(user?.neurodivergentTraits ?? []);
  const [interests, setInterests] = useState<string[]>(user?.specialInterests ?? []);
  const [goals, setGoals] = useState<string[]>(user?.connectionGoals ?? []);
  const [customTrait, setCustomTrait] = useState('');
  const [customInterest, setCustomInterest] = useState('');
  const [customGoal, setCustomGoal] = useState('');

  useEffect(() => {
    if (!user) return;
    setExperience({
      calmMode: user.experiencePreferences?.calmMode ?? DEFAULT_EXPERIENCE_PREFERENCES.calmMode,
      density: user.experiencePreferences?.density ?? DEFAULT_EXPERIENCE_PREFERENCES.density,
      reduceMotion:
        user.experiencePreferences?.reduceMotion ?? DEFAULT_EXPERIENCE_PREFERENCES.reduceMotion,
      reduceSaturation:
        user.experiencePreferences?.reduceSaturation ?? DEFAULT_EXPERIENCE_PREFERENCES.reduceSaturation
    });
    setCommunication({
      preferredToneTags: user.communicationPreferences?.preferredToneTags ?? true,
      aiExplanations: user.communicationPreferences?.aiExplanations ?? true,
      voiceMessages: user.communicationPreferences?.voiceMessages ?? false,
      responsePace: user.communicationPreferences?.responsePace ?? 'balanced',
      directness: user.communicationPreferences?.directness ?? 'gentle'
    });
    setTraits(user.neurodivergentTraits ?? []);
    setInterests(user.specialInterests ?? []);
    setGoals(user.connectionGoals ?? []);
  }, [user]);

  useEffect(() => {
    applyExperiencePreferences(experience);
  }, [experience]);

  const progressValue = useMemo(() => Math.round(((step + 1) / STEP_TITLES.length) * 100), [step]);

  const toggleItem = (value: string, list: string[], setList: (next: string[]) => void) => {
    if (list.includes(value)) {
      setList(list.filter((item) => item !== value));
    } else {
      setList([...list, value]);
    }
  };

  const addCustomValue = (value: string, list: string[], setList: (next: string[]) => void) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    if (!list.includes(trimmed)) {
      setList([...list, trimmed]);
    }
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      await updateProfile({
        experiencePreferences: experience,
        communicationPreferences: communication,
        neurodivergentTraits: traits,
        specialInterests: interests,
        connectionGoals: goals,
        onboarding: { completed: true, completedAt: new Date().toISOString() }
      });
      toast.success('Onboarding complete. Welcome to NeuroNest!');
      navigate('/dashboard');
    } catch {
      toast.error('Unable to save onboarding preferences');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-mesh">
      <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-dark">Personalize your NeuroNest</h1>
            <p className="text-neutral-600 mt-2">Tell us how you want the experience to feel first.</p>
          </div>
          <Badge className="bg-primary/10 text-primary">Step {step + 1} of {STEP_TITLES.length}</Badge>
        </div>

        <Progress value={progressValue} className="h-2" />

        <div className="mt-8 space-y-6">
          {step === 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Calm your space
                </CardTitle>
                <CardDescription>
                  Adjust the sensory tone and layout density. You can change this anytime.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Calm mode intensity</span>
                    <Badge variant="secondary">{experience.calmMode}%</Badge>
                  </div>
                  <Slider
                    value={[experience.calmMode]}
                    min={0}
                    max={100}
                    step={5}
                    onValueChange={(value) =>
                      setExperience((prev) => ({ ...prev, calmMode: value[0] }))
                    }
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <span className="text-sm font-medium text-neutral-600">Layout density</span>
                    <Select
                      value={experience.density}
                      onValueChange={(value: ExperiencePreferences['density']) =>
                        setExperience((prev) => ({ ...prev, density: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose density" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cozy">Cozy</SelectItem>
                        <SelectItem value="balanced">Balanced</SelectItem>
                        <SelectItem value="compact">Compact</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3">
                    <div>
                      <p className="text-sm font-medium">Reduce motion</p>
                      <p className="text-xs text-neutral-500">Minimize animated transitions.</p>
                    </div>
                    <Switch
                      checked={experience.reduceMotion}
                      onCheckedChange={(value) =>
                        setExperience((prev) => ({ ...prev, reduceMotion: value }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3">
                    <div>
                      <p className="text-sm font-medium">Lower saturation</p>
                      <p className="text-xs text-neutral-500">Soften bold colors.</p>
                    </div>
                    <Switch
                      checked={experience.reduceSaturation}
                      onCheckedChange={(value) =>
                        setExperience((prev) => ({ ...prev, reduceSaturation: value }))
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Communication style</CardTitle>
                <CardDescription>Shape how others communicate with you.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3">
                    <div>
                      <p className="text-sm font-medium">Tone tags encouraged</p>
                      <p className="text-xs text-neutral-500">Adds clarity to messages.</p>
                    </div>
                    <Switch
                      checked={communication.preferredToneTags}
                      onCheckedChange={(value) =>
                        setCommunication((prev) => ({ ...prev, preferredToneTags: value }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3">
                    <div>
                      <p className="text-sm font-medium">AI explanations</p>
                      <p className="text-xs text-neutral-500">Optional clarifications.</p>
                    </div>
                    <Switch
                      checked={communication.aiExplanations}
                      onCheckedChange={(value) =>
                        setCommunication((prev) => ({ ...prev, aiExplanations: value }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3">
                    <div>
                      <p className="text-sm font-medium">Voice messages</p>
                      <p className="text-xs text-neutral-500">Allow voice clips.</p>
                    </div>
                    <Switch
                      checked={communication.voiceMessages}
                      onCheckedChange={(value) =>
                        setCommunication((prev) => ({ ...prev, voiceMessages: value }))
                      }
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-medium text-neutral-600">Response pace</p>
                  <div className="flex flex-wrap gap-2">
                    {['slow', 'balanced', 'fast'].map((pace) => (
                      <Button
                        key={pace}
                        type="button"
                        variant={communication.responsePace === pace ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCommunication((prev) => ({ ...prev, responsePace: pace }))}
                      >
                        {pace.charAt(0).toUpperCase() + pace.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-medium text-neutral-600">Directness</p>
                  <div className="flex flex-wrap gap-2">
                    {['gentle', 'direct'].map((tone) => (
                      <Button
                        key={tone}
                        type="button"
                        variant={communication.directness === tone ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCommunication((prev) => ({ ...prev, directness: tone }))}
                      >
                        {tone.charAt(0).toUpperCase() + tone.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Identity & goals</CardTitle>
                <CardDescription>Share what matters so we can match you better.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">Traits</p>
                    <Badge variant="secondary">{traits.length} selected</Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {TRAIT_OPTIONS.map((trait) => (
                      <Button
                        key={trait}
                        type="button"
                        variant={traits.includes(trait) ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => toggleItem(trait, traits, setTraits)}
                      >
                        {trait}
                      </Button>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Input
                      value={customTrait}
                      onChange={(event) => setCustomTrait(event.target.value)}
                      placeholder="Add your own"
                      className="max-w-xs"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        addCustomValue(customTrait, traits, setTraits);
                        setCustomTrait('');
                      }}
                    >
                      Add trait
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">Special interests</p>
                    <Badge variant="secondary">{interests.length} selected</Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {INTEREST_OPTIONS.map((interest) => (
                      <Button
                        key={interest}
                        type="button"
                        variant={interests.includes(interest) ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => toggleItem(interest, interests, setInterests)}
                      >
                        {interest}
                      </Button>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Input
                      value={customInterest}
                      onChange={(event) => setCustomInterest(event.target.value)}
                      placeholder="Add an interest"
                      className="max-w-xs"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        addCustomValue(customInterest, interests, setInterests);
                        setCustomInterest('');
                      }}
                    >
                      Add interest
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">Connection goals</p>
                    <Badge variant="secondary">{goals.length} selected</Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {GOAL_OPTIONS.map((goal) => (
                      <Button
                        key={goal}
                        type="button"
                        variant={goals.includes(goal) ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => toggleItem(goal, goals, setGoals)}
                      >
                        {goal}
                      </Button>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Input
                      value={customGoal}
                      onChange={(event) => setCustomGoal(event.target.value)}
                      placeholder="Add a goal"
                      className="max-w-xs"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        addCustomValue(customGoal, goals, setGoals);
                        setCustomGoal('');
                      }}
                    >
                      Add goal
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep((prev) => Math.max(prev - 1, 0))}
              disabled={step === 0}
            >
              Back
            </Button>
            {step < STEP_TITLES.length - 1 ? (
              <Button
                type="button"
                onClick={() => setStep((prev) => Math.min(prev + 1, STEP_TITLES.length - 1))}
              >
                Continue
              </Button>
            ) : (
              <Button type="button" onClick={handleFinish} disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Finish onboarding
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
