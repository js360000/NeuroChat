import { useRef, useMemo, useState } from 'react';
import { Camera, Loader2, Plus, X, Upload, AlertCircle, Trash2, MapPin, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { useAuthStore } from '@/lib/stores/auth';

const PRONOUN_OPTIONS = ['he/him', 'she/her', 'they/them', 'he/they', 'she/they', 'any pronouns', 'ask me'];
const GENDER_OPTIONS = ['Man', 'Woman', 'Non-binary', 'Genderfluid', 'Agender', 'Prefer not to say'];
import { useAppConfig } from '@/lib/stores/config';
import { toast } from 'sonner';

export function ProfilePage() {
  const appConfig = useAppConfig();
  const NEURODIVERGENT_TRAITS = appConfig.traitOptions;
  const RESPONSE_PACE_OPTIONS = appConfig.paceOptions as Array<'slow' | 'balanced' | 'fast'>;
  const DIRECTNESS_OPTIONS = appConfig.directnessOptions as Array<'gentle' | 'direct'>;
  const CONNECTION_GOALS = appConfig.goalOptions;
  const { user, updateProfile } = useAuthStore();
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    dateOfBirth: user?.dateOfBirth || '',
    location: user?.location || '',
    pronouns: user?.pronouns || '',
    gender: user?.gender || '',
    neurodivergentTraits: user?.neurodivergentTraits || [],
    specialInterests: user?.specialInterests || [],
    connectionGoals: user?.connectionGoals || [],
    communicationPreferences: {
      preferredToneTags: user?.communicationPreferences?.preferredToneTags ?? true,
      aiExplanations: user?.communicationPreferences?.aiExplanations ?? true,
      voiceMessages: user?.communicationPreferences?.voiceMessages ?? true,
      responsePace: user?.communicationPreferences?.responsePace ?? 'balanced',
      directness: user?.communicationPreferences?.directness ?? 'gentle'
    }
  });

  const [newInterest, setNewInterest] = useState('');
  const [newGoal, setNewGoal] = useState('');

  const nameChangesRemaining = useMemo(() => {
    const changes = user?.nameChanges || [];
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const recent = changes.filter((d) => new Date(d).getTime() > thirtyDaysAgo);
    return Math.max(0, 2 - recent.length);
  }, [user?.nameChanges]);

  const computeAge = (dob: string): number | undefined => {
    if (!dob) return undefined;
    const birth = new Date(dob);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
    return age;
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateProfile({
        ...formData,
        age: computeAge(formData.dateOfBirth),
      } as any);
      toast.success('Profile updated');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5 MB');
      return;
    }
    setAvatarUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        await updateProfile({ avatar: reader.result as string } as any);
        toast.success('Profile photo updated');
      } catch {
        toast.error('Failed to update photo');
      } finally {
        setAvatarUploading(false);
      }
    };
    reader.onerror = () => {
      toast.error('Failed to read file');
      setAvatarUploading(false);
    };
    reader.readAsDataURL(file);
    // Reset so the same file can be re-selected
    e.target.value = '';
  };

  const handleRemoveAvatar = async () => {
    try {
      await updateProfile({ avatar: '' } as any);
      toast.success('Profile photo removed');
    } catch {
      toast.error('Failed to remove photo');
    }
  };

  const toggleTrait = (trait: string) => {
    setFormData(prev => ({
      ...prev,
      neurodivergentTraits: prev.neurodivergentTraits.includes(trait)
        ? prev.neurodivergentTraits.filter(t => t !== trait)
        : [...prev.neurodivergentTraits, trait]
    }));
  };

  const addInterest = () => {
    if (newInterest.trim() && !formData.specialInterests.includes(newInterest.trim())) {
      setFormData(prev => ({
        ...prev,
        specialInterests: [...prev.specialInterests, newInterest.trim()]
      }));
      setNewInterest('');
    }
  };

  const removeInterest = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      specialInterests: prev.specialInterests.filter(i => i !== interest)
    }));
  };

  const toggleGoal = (goal: string) => {
    setFormData(prev => ({
      ...prev,
      connectionGoals: prev.connectionGoals.includes(goal)
        ? prev.connectionGoals.filter(g => g !== goal)
        : [...prev.connectionGoals, goal]
    }));
  };

  const addGoal = () => {
    const trimmed = newGoal.trim();
    if (trimmed && !formData.connectionGoals.includes(trimmed)) {
      setFormData(prev => ({
        ...prev,
        connectionGoals: [...prev.connectionGoals, trimmed]
      }));
      setNewGoal('');
    }
  };

  const removeGoal = (goal: string) => {
    setFormData(prev => ({
      ...prev,
      connectionGoals: prev.connectionGoals.filter(g => g !== goal)
    }));
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Your Profile</h1>

      <div className="space-y-6">
        {/* Avatar Section */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-6">
              <div className="relative">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={user?.avatar} />
                  <AvatarFallback className="text-3xl">
                    {user?.name?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={avatarUploading}
                  className="absolute bottom-0 right-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                  title="Change profile photo"
                >
                  {avatarUploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4" />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarFile}
                />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold">{user?.name}</h2>
                <p className="text-neutral-500 truncate">{user?.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge>
                    {user?.subscription?.plan === 'free' ? 'Free' :
                     user?.subscription?.plan === 'premium' ? 'Premium' : 'Pro'}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={avatarUploading}
                  >
                    <Upload className="w-3 h-3 mr-1" />
                    Upload photo
                  </Button>
                  {user?.avatar && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-red-500 hover:text-red-600"
                      onClick={handleRemoveAvatar}
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <Label>Name</Label>
                <span className={`text-[11px] ${nameChangesRemaining === 0 ? 'text-red-500' : 'text-neutral-400'}`}>
                  {nameChangesRemaining === 0 ? (
                    <span className="flex items-center gap-1"><AlertCircle className="w-3 h-3" /> No changes left this month</span>
                  ) : (
                    `${nameChangesRemaining} change${nameChangesRemaining === 1 ? '' : 's'} left this month`
                  )}
                </span>
              </div>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={nameChangesRemaining === 0 && formData.name !== user?.name}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  Date of Birth
                </Label>
                <Input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  max={new Date().toISOString().split('T')[0]}
                />
                {formData.dateOfBirth && (
                  <p className="text-xs text-neutral-400 mt-1">Age shown on profile: {computeAge(formData.dateOfBirth)}</p>
                )}
              </div>
              <div>
                <Label className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  Location
                </Label>
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g. London, UK"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Pronouns</Label>
                <Select value={formData.pronouns} onValueChange={(v) => setFormData({ ...formData, pronouns: v })}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    {PRONOUN_OPTIONS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Gender</Label>
                <Select value={formData.gender} onValueChange={(v) => setFormData({ ...formData, gender: v })}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    {GENDER_OPTIONS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Bio</Label>
              <Textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Tell others about yourself..."
                maxLength={500}
              />
              <p className="text-xs text-neutral-400 mt-1 text-right">{formData.bio.length}/500</p>
            </div>
          </CardContent>
        </Card>

        {/* Neurodivergent Traits */}
        <Card>
          <CardHeader>
            <CardTitle>Neurodivergent Traits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {NEURODIVERGENT_TRAITS.map((trait) => (
                <button
                  key={trait}
                  onClick={() => toggleTrait(trait)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                    formData.neurodivergentTraits.includes(trait)
                      ? 'bg-primary text-white'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  {trait}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Special Interests */}
        <Card>
          <CardHeader>
            <CardTitle>Special Interests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 mb-3">
              {formData.specialInterests.map((interest) => (
                <Badge
                  key={interest}
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  {interest}
                  <button
                    onClick={() => removeInterest(interest)}
                    className="ml-1 hover:text-red-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newInterest}
                onChange={(e) => setNewInterest(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addInterest()}
                placeholder="Add an interest..."
              />
              <Button type="button" onClick={addInterest} variant="outline">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Connection Goals */}
        <Card>
          <CardHeader>
            <CardTitle>Connection Goals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {CONNECTION_GOALS.map((goal) => (
                <button
                  key={goal}
                  onClick={() => toggleGoal(goal)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                    formData.connectionGoals.includes(goal)
                      ? 'bg-primary text-white'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  {goal}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              {formData.connectionGoals
                .filter((goal) => !CONNECTION_GOALS.includes(goal))
                .map((goal) => (
                  <Badge
                    key={goal}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {goal}
                    <button
                      onClick={() => removeGoal(goal)}
                      className="ml-1 hover:text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
            </div>

            <div className="flex gap-2">
              <Input
                value={newGoal}
                onChange={(e) => setNewGoal(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addGoal()}
                placeholder="Add a goal..."
              />
              <Button type="button" onClick={addGoal} variant="outline">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Communication Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>Communication Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Preferred Tone Tags</p>
                <p className="text-sm text-neutral-500">Show tone tags in messages</p>
              </div>
              <Switch
                checked={formData.communicationPreferences.preferredToneTags}
                onCheckedChange={(checked) =>
                  setFormData(prev => ({
                    ...prev,
                    communicationPreferences: {
                      ...prev.communicationPreferences,
                      preferredToneTags: checked
                    }
                  }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">AI Explanations</p>
                <p className="text-sm text-neutral-500">Enable AI message analysis</p>
              </div>
              <Switch
                checked={formData.communicationPreferences.aiExplanations}
                onCheckedChange={(checked) =>
                  setFormData(prev => ({
                    ...prev,
                    communicationPreferences: {
                      ...prev.communicationPreferences,
                      aiExplanations: checked
                    }
                  }))
                }
                disabled={user?.subscription?.plan === 'free'}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Voice Messages</p>
                <p className="text-sm text-neutral-500">Allow voice message sending</p>
              </div>
              <Switch
                checked={formData.communicationPreferences.voiceMessages}
                onCheckedChange={(checked) =>
                  setFormData(prev => ({
                    ...prev,
                    communicationPreferences: {
                      ...prev.communicationPreferences,
                      voiceMessages: checked
                    }
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Response pace</p>
              <div className="flex flex-wrap gap-2">
                {RESPONSE_PACE_OPTIONS.map((pace) => (
                  <Button
                    key={pace}
                    type="button"
                    size="sm"
                    variant={formData.communicationPreferences.responsePace === pace ? 'default' : 'outline'}
                    onClick={() =>
                      setFormData(prev => ({
                        ...prev,
                        communicationPreferences: {
                          ...prev.communicationPreferences,
                          responsePace: pace
                        }
                      }))
                    }
                  >
                    {pace.charAt(0).toUpperCase() + pace.slice(1)}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Directness</p>
              <div className="flex flex-wrap gap-2">
                {DIRECTNESS_OPTIONS.map((tone) => (
                  <Button
                    key={tone}
                    type="button"
                    size="sm"
                    variant={formData.communicationPreferences.directness === tone ? 'default' : 'outline'}
                    onClick={() =>
                      setFormData(prev => ({
                        ...prev,
                        communicationPreferences: {
                          ...prev.communicationPreferences,
                          directness: tone
                        }
                      }))
                    }
                  >
                    {tone.charAt(0).toUpperCase() + tone.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            className="bg-primary hover:bg-primary-600"
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
