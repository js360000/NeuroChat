import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { UserProfileView, type ProfileUser } from '@/components/UserProfileView';
import { usersApi } from '@/lib/api/users';
import { useAuthStore } from '@/lib/stores/auth';
import { aiApi } from '@/lib/api/ai';
import { toast } from 'sonner';
import { messagesApi } from '@/lib/api/messages';

export function UserProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const [profile, setProfile] = useState<ProfileUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const { user } = await usersApi.getUser(id);
        const sharedTraits = currentUser?.neurodivergentTraits?.filter((t) =>
          user.neurodivergentTraits.includes(t)
        ) || [];
        const sharedInterests = currentUser?.specialInterests?.filter((i) =>
          user.specialInterests.includes(i)
        ) || [];

        let compatibilityScore: number | undefined;
        try {
          const compat = await aiApi.getCompatibility(
            currentUser?.neurodivergentTraits || [],
            currentUser?.specialInterests || [],
            user.neurodivergentTraits,
            user.specialInterests
          );
          compatibilityScore = compat.compatibility.score;
        } catch {
          compatibilityScore = undefined;
        }

        setProfile({
          ...user,
          sharedTraits,
          sharedInterests,
          compatibilityScore,
        } as ProfileUser);
      } catch {
        setError('User not found');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [id]);

  const handleLike = async () => {
    if (!profile) return;
    try {
      const response = await usersApi.likeUser(profile.id);
      if (response.match && response.conversationId) {
        toast.success("It's a match!");
      } else {
        toast.success('Like sent!');
      }
    } catch {
      toast.error('Failed to like');
    }
  };

  const handleSuperLike = async () => {
    if (!profile) return;
    try {
      await usersApi.superLikeUser(profile.id);
      toast.success('Super Like sent!');
    } catch {
      toast.error('Failed to super like');
    }
  };

  const handleMessage = async () => {
    if (!profile) return;
    try {
      const { conversationId } = await messagesApi.createConversation(profile.id);
      navigate(`/messages/${conversationId}`);
    } catch {
      toast.error('Failed to start conversation');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-8">
          <h2 className="text-xl font-bold mb-2">Profile Not Found</h2>
          <p className="text-neutral-500 mb-4">{error || 'This user could not be found.'}</p>
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go back
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6">
      <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate(-1)}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      <Card>
        <CardContent className="p-6 sm:p-8">
          <UserProfileView
            user={profile}
            onLike={handleLike}
            onSuperLike={handleSuperLike}
            onMessage={handleMessage}
          />
        </CardContent>
      </Card>
    </div>
  );
}
