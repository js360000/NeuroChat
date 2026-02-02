import { useState } from 'react';
import { Camera, Loader2, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useAuthStore } from '@/lib/stores/auth';
import { toast } from 'sonner';

const NEURODIVERGENT_TRAITS = [
  'Autism', 'ADHD', 'Dyslexia', 'Dyspraxia', 'Dyscalculia',
  'Tourette\'s', 'OCD', 'Bipolar', 'Anxiety', 'Sensory Processing'
];

const CONNECTION_GOALS = [
  'Friendship',
  'Dating',
  'Creative collaborators',
  'Study buddies',
  'Accountability partners',
  'Community events',
  'Co-working',
  'Local meetups'
];

export function ProfilePage() {
  const { user, updateProfile } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    neurodivergentTraits: user?.neurodivergentTraits || [],
    specialInterests: user?.specialInterests || [],
    connectionGoals: user?.connectionGoals || [],
    communicationPreferences: user?.communicationPreferences || {
      preferredToneTags: true,
      aiExplanations: true,
      voiceMessages: true
    }
  });
  
  const [newInterest, setNewInterest] = useState('');
  const [newGoal, setNewGoal] = useState('');

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateProfile(formData);
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
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
                {isEditing && (
                  <button className="absolute bottom-0 right-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center shadow-lg">
                    <Camera className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold">{user?.name}</h2>
                <p className="text-neutral-500">{user?.email}</p>
                <Badge className="mt-2">
                  {user?.subscription?.plan === 'free' ? 'Free' : 
                   user?.subscription?.plan === 'premium' ? 'Premium' : 'Pro'}
                </Badge>
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
              <Label>Name</Label>
              {isEditing ? (
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              ) : (
                <p className="text-neutral-600">{user?.name}</p>
              )}
            </div>

            <div>
              <Label>Bio</Label>
              {isEditing ? (
                <Textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Tell others about yourself..."
                  maxLength={500}
                />
              ) : (
                <p className="text-neutral-600">{user?.bio || 'No bio yet'}</p>
              )}
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
                  onClick={() => isEditing && toggleTrait(trait)}
                  disabled={!isEditing}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                    formData.neurodivergentTraits.includes(trait)
                      ? 'bg-primary text-white'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  } ${!isEditing && 'cursor-default'}`}
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
                  {isEditing && (
                    <button
                      onClick={() => removeInterest(interest)}
                      className="ml-1 hover:text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </Badge>
              ))}
            </div>
            {isEditing && (
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
            )}
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
                  onClick={() => isEditing && toggleGoal(goal)}
                  disabled={!isEditing}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                    formData.connectionGoals.includes(goal)
                      ? 'bg-primary text-white'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  } ${!isEditing && 'cursor-default'}`}
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
                    {isEditing && (
                      <button
                        onClick={() => removeGoal(goal)}
                        className="ml-1 hover:text-red-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </Badge>
                ))}
            </div>

            {isEditing && (
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
            )}
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
                disabled={!isEditing}
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
                disabled={!isEditing || user?.subscription?.plan === 'free'}
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
                disabled={!isEditing}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
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
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)} variant="outline">
              Edit Profile
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
