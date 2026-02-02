import { useEffect, useState } from 'react';
import { Heart, MapPin, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuthStore } from '@/lib/stores/auth';
import { usersApi } from '@/lib/api/users';
import { aiApi } from '@/lib/api/ai';
import { toast } from 'sonner';

interface PotentialMatch {
  id: string;
  name: string;
  avatar?: string;
  bio?: string;
  neurodivergentTraits: string[];
  specialInterests: string[];
  isOnline: boolean;
  compatibilityScore?: number;
}

export function DashboardPage() {
  const { user } = useAuthStore();
  const [potentialMatches, setPotentialMatches] = useState<PotentialMatch[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPotentialMatches();
  }, []);

  const loadPotentialMatches = async () => {
    try {
      const response = await usersApi.getPotentialMatches();
      
      // Calculate compatibility for each match
      const matchesWithCompatibility = await Promise.all(
        response.users.map(async (match: PotentialMatch) => {
          try {
            const compatResponse = await aiApi.getCompatibility(
              user?.neurodivergentTraits || [],
              user?.specialInterests || [],
              match.neurodivergentTraits,
              match.specialInterests
            );
            return { ...match, compatibilityScore: compatResponse.compatibility.score };
          } catch (error) {
            return { ...match, compatibilityScore: Math.floor(Math.random() * 30) + 70 };
          }
        })
      );
      
      setPotentialMatches(matchesWithCompatibility);
    } catch (error) {
      toast.error('Failed to load potential matches');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLike = async () => {
    const currentMatch = potentialMatches[currentIndex];
    if (!currentMatch) return;

    try {
      await usersApi.likeUser(currentMatch.id);
      toast.success('Like sent!');
      nextProfile();
    } catch (error: any) {
      if (error.code === 'ALREADY_MATCHED') {
        toast.success("It's a match!");
      } else {
        toast.error('Failed to send like');
      }
    }
  };

  const handlePass = () => {
    nextProfile();
  };

  const nextProfile = () => {
    if (currentIndex < potentialMatches.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCurrentIndex(0);
      toast.info('You\'ve seen everyone! Starting over...');
    }
  };

  const currentMatch = potentialMatches[currentIndex];

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!currentMatch) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-8">
          <Sparkles className="w-16 h-16 mx-auto text-primary mb-4" />
          <h2 className="text-2xl font-bold mb-2">No more profiles</h2>
          <p className="text-neutral-500 mb-6">
            Check back later for more potential matches!
          </p>
          <Button onClick={loadPotentialMatches} variant="outline">
            Refresh
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Profile Card */}
        <Card className="overflow-hidden">
          {/* Image */}
          <div className="relative aspect-[4/5] bg-neutral-100">
            <Avatar className="w-full h-full rounded-none">
              <AvatarImage src={currentMatch.avatar} className="object-cover" />
              <AvatarFallback className="text-6xl">
                {currentMatch.name[0]}
              </AvatarFallback>
            </Avatar>
            
            {/* Online Indicator */}
            {currentMatch.isOnline && (
              <div className="absolute top-4 right-4 flex items-center gap-2 bg-white/90 backdrop-blur px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs font-medium">Online</span>
              </div>
            )}

            {/* Compatibility Score */}
            <div className="absolute bottom-4 left-4 bg-primary text-white px-3 py-1 rounded-full text-sm font-medium">
              {currentMatch.compatibilityScore}% Match
            </div>
          </div>

          {/* Info */}
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold">{currentMatch.name}</h2>
                <div className="flex items-center gap-1 text-neutral-500 text-sm mt-1">
                  <MapPin className="w-4 h-4" />
                  <span>Nearby</span>
                </div>
              </div>
            </div>

            {/* Bio */}
            {currentMatch.bio && (
              <p className="text-neutral-600 mb-4">{currentMatch.bio}</p>
            )}

            {/* Traits */}
            <div className="mb-4">
              <p className="text-sm text-neutral-500 mb-2">Neurodivergent Traits</p>
              <div className="flex flex-wrap gap-2">
                {currentMatch.neurodivergentTraits.map((trait) => (
                  <Badge key={trait} variant="secondary" className="bg-peach text-dark">
                    {trait}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Interests */}
            <div className="mb-6">
              <p className="text-sm text-neutral-500 mb-2">Special Interests</p>
              <div className="flex flex-wrap gap-2">
                {currentMatch.specialInterests.map((interest) => (
                  <Badge key={interest} variant="outline">
                    {interest}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <Button
                variant="outline"
                size="lg"
                className="flex-1 h-14 text-lg"
                onClick={handlePass}
              >
                Pass
              </Button>
              <Button
                size="lg"
                className="flex-1 h-14 text-lg bg-primary hover:bg-primary-600"
                onClick={handleLike}
              >
                <Heart className="w-5 h-5 mr-2" />
                Like
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Progress */}
        <p className="text-center text-sm text-neutral-500 mt-4">
          {currentIndex + 1} of {potentialMatches.length}
        </p>
      </div>
    </div>
  );
}
