import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Sparkles, MapPin, Calendar, User, Camera, Heart, MessageCircle, Shield, ChevronRight, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { useAppConfig } from '@/lib/stores/config';
import { toast } from 'sonner';

const STEP_TITLES = ['The essentials', 'About you', 'Identity & goals', 'Communication style', 'Calm your space', 'Safety checklist'];

const PRONOUN_OPTIONS = ['he/him', 'she/her', 'they/them', 'he/they', 'she/they', 'any pronouns', 'ask me'];
const GENDER_OPTIONS = ['Man', 'Woman', 'Non-binary', 'Genderfluid', 'Agender', 'Prefer not to say'];

export function OnboardingPage() {
  const navigate = useNavigate();
  const { user, updateProfile } = useAuthStore();
  const appConfig = useAppConfig();
  const TRAIT_OPTIONS = appConfig.traitOptions;
  const INTEREST_OPTIONS = appConfig.interestOptions;
  const GOAL_OPTIONS = appConfig.goalOptions;
  const PACE_OPTIONS = appConfig.paceOptions as Array<'slow' | 'balanced' | 'fast'>;
  const DIRECTNESS_OPTIONS = appConfig.directnessOptions as Array<'gentle' | 'direct'>;
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  // Step 1 — Essentials (required)
  const [displayName, setDisplayName] = useState(user?.name || '');
  const [dateOfBirth, setDateOfBirth] = useState(user?.dateOfBirth || '');
  const [locationValue, setLocationValue] = useState(user?.location || '');

  // Step 2 — About you (skippable)
  const [bio, setBio] = useState(user?.bio || '');
  const [pronouns, setPronouns] = useState(user?.pronouns || '');
  const [gender, setGender] = useState(user?.gender || '');
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '');

  // Step 3 — Identity & goals (skippable)
  const [traits, setTraits] = useState<string[]>(user?.neurodivergentTraits ?? []);
  const [interests, setInterests] = useState<string[]>(user?.specialInterests ?? []);
  const [goals, setGoals] = useState<string[]>(user?.connectionGoals ?? []);
  const [customTrait, setCustomTrait] = useState('');
  const [customInterest, setCustomInterest] = useState('');
  const [customGoal, setCustomGoal] = useState('');

  // Step 4 — Communication (skippable)
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

  // Step 5 — Calm (skippable)
  const [experience, setExperience] = useState<ExperiencePreferences>(() => ({
    calmMode: user?.experiencePreferences?.calmMode ?? DEFAULT_EXPERIENCE_PREFERENCES.calmMode,
    density: user?.experiencePreferences?.density ?? DEFAULT_EXPERIENCE_PREFERENCES.density,
    reduceMotion: user?.experiencePreferences?.reduceMotion ?? DEFAULT_EXPERIENCE_PREFERENCES.reduceMotion,
    reduceSaturation:
      user?.experiencePreferences?.reduceSaturation ?? DEFAULT_EXPERIENCE_PREFERENCES.reduceSaturation
  }));

  // Step 6 — Safety (skippable)
  const [safetyChecklist, setSafetyChecklist] = useState({
    boundariesSet: user?.safetyChecklist?.boundariesSet ?? false,
    filtersSet: user?.safetyChecklist?.filtersSet ?? false,
    resourcesViewed: user?.safetyChecklist?.resourcesViewed ?? false,
    completed: user?.safetyChecklist?.completed ?? false
  });

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

  const computeAge = (dob: string): number => {
    const birth = new Date(dob);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
    return age;
  };

  const essentialsValid = displayName.trim().length >= 2 && dateOfBirth && locationValue.trim().length >= 2;

  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5 MB'); return; }
    setAvatarUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      setAvatarPreview(reader.result as string);
      setAvatarUploading(false);
    };
    reader.onerror = () => { toast.error('Failed to read file'); setAvatarUploading(false); };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleNext = () => {
    if (step === 0 && !essentialsValid) {
      toast.error('Please fill in your name, date of birth, and location to continue.');
      return;
    }
    if (step === 0) {
      const age = computeAge(dateOfBirth);
      if (age < 18) {
        toast.error('You must be at least 18 years old to use NeuroNest.');
        return;
      }
    }
    setStep((prev) => Math.min(prev + 1, STEP_TITLES.length - 1));
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      const age = dateOfBirth ? computeAge(dateOfBirth) : undefined;
      await updateProfile({
        name: displayName.trim(),
        bio: bio.trim() || undefined,
        age,
        dateOfBirth: dateOfBirth || undefined,
        location: locationValue.trim() || undefined,
        pronouns: pronouns || undefined,
        gender: gender || undefined,
        avatar: avatarPreview || undefined,
        experiencePreferences: experience,
        communicationPreferences: communication,
        neurodivergentTraits: traits,
        specialInterests: interests,
        connectionGoals: goals,
        safetyChecklist: {
          ...safetyChecklist,
          completed: safetyChecklist.boundariesSet && safetyChecklist.filtersSet && safetyChecklist.resourcesViewed
        },
        onboarding: { completed: true, completedAt: new Date().toISOString(), step: STEP_TITLES.length }
      } as any);
      toast.success('Welcome to NeuroNest! Your profile is set up.');
      navigate('/dashboard');
    } catch {
      toast.error('Unable to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const isLastStep = step === STEP_TITLES.length - 1;

  return (
    <div className="min-h-screen bg-gradient-mesh">
      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-dark">Welcome to NeuroNest</h1>
            <p className="text-neutral-600 mt-2">Let's set up your profile so you can start connecting.</p>
          </div>
          <Badge className="bg-primary/10 text-primary">Step {step + 1} of {STEP_TITLES.length}</Badge>
        </div>

        <Progress value={progressValue} className="h-2 mb-2" />
        <p className="text-xs text-neutral-500 mb-6">{STEP_TITLES[step]}{step > 0 ? ' (optional — skip anytime)' : ' (required)'}</p>

        <div className="space-y-6">
          {/* STEP 1: Essentials (required) */}
          {step === 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  The essentials
                </CardTitle>
                <CardDescription>
                  We need a few key details before you can start. These help us match you with the right people.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display name <span className="text-red-500">*</span></Label>
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="What should people call you?"
                    maxLength={30}
                  />
                  <p className="text-xs text-neutral-400">This is shown on your profile. You can change it later (twice per month).</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dob" className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    Date of birth <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="dob"
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                  />
                  <p className="text-xs text-neutral-400">Your exact birthday won't be shown — only your age will appear on your profile.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location" className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    Location <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="location"
                    value={locationValue}
                    onChange={(e) => setLocationValue(e.target.value)}
                    placeholder="e.g. London, Manchester, Edinburgh"
                  />
                  <p className="text-xs text-neutral-400">City or region. Helps us show nearby connections.</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* STEP 2: About You (skippable) */}
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="w-5 h-5 text-primary" />
                  About you
                </CardTitle>
                <CardDescription>Add a photo, bio, and pronouns so people get to know you. All optional.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex items-center gap-5">
                  <div className="relative">
                    <Avatar className="w-20 h-20">
                      <AvatarImage src={avatarPreview} />
                      <AvatarFallback className="text-2xl">{displayName?.[0] || 'U'}</AvatarFallback>
                    </Avatar>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={avatarUploading}
                      className="absolute bottom-0 right-0 w-7 h-7 bg-primary text-white rounded-full flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      {avatarUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    </button>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarFile} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Profile photo</p>
                    <p className="text-xs text-neutral-500">Profiles with photos get 5× more matches.</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell people a bit about yourself... your vibe, what you're into, what makes you tick."
                    maxLength={500}
                    rows={4}
                  />
                  <p className="text-xs text-neutral-400 text-right">{bio.length}/500</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Pronouns</Label>
                    <Select value={pronouns} onValueChange={setPronouns}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {PRONOUN_OPTIONS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Gender</Label>
                    <Select value={gender} onValueChange={setGender}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {GENDER_OPTIONS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* STEP 3: Identity & Goals (skippable) */}
          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-primary" />
                  Identity & goals
                </CardTitle>
                <CardDescription>Share what matters so we can match you better.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">Neurodivergent traits</p>
                    <Badge variant="secondary">{traits.length} selected</Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {TRAIT_OPTIONS.map((trait) => (
                      <Button key={trait} type="button" variant={traits.includes(trait) ? 'default' : 'outline'} size="sm" onClick={() => toggleItem(trait, traits, setTraits)}>{trait}</Button>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Input value={customTrait} onChange={(e) => setCustomTrait(e.target.value)} placeholder="Add your own" className="max-w-xs" />
                    <Button type="button" variant="secondary" onClick={() => { addCustomValue(customTrait, traits, setTraits); setCustomTrait(''); }}>Add</Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">Special interests</p>
                    <Badge variant="secondary">{interests.length} selected</Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {INTEREST_OPTIONS.map((interest) => (
                      <Button key={interest} type="button" variant={interests.includes(interest) ? 'default' : 'outline'} size="sm" onClick={() => toggleItem(interest, interests, setInterests)}>{interest}</Button>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Input value={customInterest} onChange={(e) => setCustomInterest(e.target.value)} placeholder="Add an interest" className="max-w-xs" />
                    <Button type="button" variant="secondary" onClick={() => { addCustomValue(customInterest, interests, setInterests); setCustomInterest(''); }}>Add</Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">Connection goals</p>
                    <Badge variant="secondary">{goals.length} selected</Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {GOAL_OPTIONS.map((goal) => (
                      <Button key={goal} type="button" variant={goals.includes(goal) ? 'default' : 'outline'} size="sm" onClick={() => toggleItem(goal, goals, setGoals)}>{goal}</Button>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Input value={customGoal} onChange={(e) => setCustomGoal(e.target.value)} placeholder="Add a goal" className="max-w-xs" />
                    <Button type="button" variant="secondary" onClick={() => { addCustomValue(customGoal, goals, setGoals); setCustomGoal(''); }}>Add</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* STEP 4: Communication Style (skippable) */}
          {step === 3 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-primary" />
                  Communication style
                </CardTitle>
                <CardDescription>Shape how others communicate with you.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3">
                    <div><p className="text-sm font-medium">Tone tags encouraged</p><p className="text-xs text-neutral-500">Adds clarity to messages.</p></div>
                    <Switch checked={communication.preferredToneTags} onCheckedChange={(v) => setCommunication((p) => ({ ...p, preferredToneTags: v }))} />
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3">
                    <div><p className="text-sm font-medium">AI explanations</p><p className="text-xs text-neutral-500">Optional clarifications.</p></div>
                    <Switch checked={communication.aiExplanations} onCheckedChange={(v) => setCommunication((p) => ({ ...p, aiExplanations: v }))} />
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3">
                    <div><p className="text-sm font-medium">Voice messages</p><p className="text-xs text-neutral-500">Allow voice clips.</p></div>
                    <Switch checked={communication.voiceMessages} onCheckedChange={(v) => setCommunication((p) => ({ ...p, voiceMessages: v }))} />
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-sm font-medium text-neutral-600">Response pace</p>
                  <div className="flex flex-wrap gap-2">
                    {PACE_OPTIONS.map((pace) => (
                      <Button key={pace} type="button" variant={communication.responsePace === pace ? 'default' : 'outline'} size="sm" onClick={() => setCommunication((p) => ({ ...p, responsePace: pace }))}>{pace.charAt(0).toUpperCase() + pace.slice(1)}</Button>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-sm font-medium text-neutral-600">Directness</p>
                  <div className="flex flex-wrap gap-2">
                    {DIRECTNESS_OPTIONS.map((tone) => (
                      <Button key={tone} type="button" variant={communication.directness === tone ? 'default' : 'outline'} size="sm" onClick={() => setCommunication((p) => ({ ...p, directness: tone }))}>{tone.charAt(0).toUpperCase() + tone.slice(1)}</Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* STEP 5: Calm your space (skippable) */}
          {step === 4 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Calm your space
                </CardTitle>
                <CardDescription>Adjust the sensory tone and layout. You can change this anytime in Settings.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Calm mode intensity</span>
                    <Badge variant="secondary">{experience.calmMode}%</Badge>
                  </div>
                  <Slider value={[experience.calmMode]} min={0} max={100} step={5} onValueChange={(v) => setExperience((p) => ({ ...p, calmMode: v[0] }))} />
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <span className="text-sm font-medium text-neutral-600">Layout density</span>
                    <Select value={experience.density} onValueChange={(v: ExperiencePreferences['density']) => setExperience((p) => ({ ...p, density: v }))}>
                      <SelectTrigger><SelectValue placeholder="Choose" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cozy">Cozy</SelectItem>
                        <SelectItem value="balanced">Balanced</SelectItem>
                        <SelectItem value="compact">Compact</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3">
                    <div><p className="text-sm font-medium">Reduce motion</p><p className="text-xs text-neutral-500">Minimize animations.</p></div>
                    <Switch checked={experience.reduceMotion} onCheckedChange={(v) => setExperience((p) => ({ ...p, reduceMotion: v }))} />
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3">
                    <div><p className="text-sm font-medium">Lower saturation</p><p className="text-xs text-neutral-500">Soften bold colors.</p></div>
                    <Switch checked={experience.reduceSaturation} onCheckedChange={(v) => setExperience((p) => ({ ...p, reduceSaturation: v }))} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* STEP 6: Safety Checklist (skippable) */}
          {step === 5 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  Safety checklist
                </CardTitle>
                <CardDescription>Small steps that make connection safer and calmer.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3">
                  <div><p className="text-sm font-medium">Set your boundaries</p><p className="text-xs text-neutral-500">Let others know your limits.</p></div>
                  <Switch checked={safetyChecklist.boundariesSet} onCheckedChange={(v) => setSafetyChecklist((p) => ({ ...p, boundariesSet: v }))} />
                </div>
                <div className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3">
                  <div><p className="text-sm font-medium">Enable content filters</p><p className="text-xs text-neutral-500">Hide sensitive topics.</p></div>
                  <Switch checked={safetyChecklist.filtersSet} onCheckedChange={(v) => setSafetyChecklist((p) => ({ ...p, filtersSet: v }))} />
                </div>
                <div className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3">
                  <div><p className="text-sm font-medium">View support resources</p><p className="text-xs text-neutral-500">Know where to go if you need help.</p></div>
                  <Switch checked={safetyChecklist.resourcesViewed} onCheckedChange={(v) => setSafetyChecklist((p) => ({ ...p, resourcesViewed: v }))} />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep((prev) => Math.max(prev - 1, 0))}
              disabled={step === 0}
            >
              Back
            </Button>
            <div className="flex items-center gap-2">
              {step > 0 && !isLastStep && (
                <Button type="button" variant="ghost" className="text-neutral-500" onClick={() => setStep((prev) => prev + 1)}>
                  Skip
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              )}
              {!isLastStep ? (
                <Button type="button" onClick={handleNext}>
                  Continue
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button type="button" onClick={handleFinish} disabled={saving}>
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Finish & enter NeuroNest
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
