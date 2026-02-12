import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, X, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { usersApi, type Match } from '@/lib/api/users';
import { messagesApi } from '@/lib/api/messages';
import { MatchesSkeleton } from '@/components/PageSkeleton';
import { PassportCard } from '@/components/PassportCard';
import { toast } from 'sonner';

export function MatchesPage() {
  const navigate = useNavigate();
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    try {
      const response = await usersApi.getMatches();
      setMatches(response.matches.filter(m => m.status === 'matched'));
    } catch (error) {
      toast.error('Failed to load matches');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMessage = async (userId: string) => {
    try {
      const response = await messagesApi.createConversation(userId);
      navigate(`/messages/${response.conversationId}`);
    } catch (error) {
      toast.error('Failed to start conversation');
    }
  };

  const handleUnmatch = async (matchId: string) => {
    try {
      await usersApi.unmatchUser(matchId);
      setMatches(matches.filter(m => m.id !== matchId));
      toast.success('Unmatched successfully');
    } catch (error) {
      toast.error('Failed to unmatch');
    }
  };

  if (isLoading) {
    return <MatchesSkeleton />;
  }

  if (matches.length === 0) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-8">
          <Heart className="w-16 h-16 mx-auto text-neutral-300 mb-4" />
          <h2 className="text-2xl font-bold mb-2">No matches yet</h2>
          <p className="text-neutral-500 mb-6">
            Keep swiping to find your perfect match!
          </p>
          <Button onClick={() => navigate('/dashboard')} className="bg-primary hover:bg-primary-600">
            Start Swiping
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Your Matches</h1>
          <p className="text-sm text-muted-foreground">{matches.length} connection{matches.length !== 1 ? 's' : ''}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {matches.map((match) => (
          <Card key={match.id} className="overflow-hidden hover:shadow-card-hover transition-all duration-300 group">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-start gap-4">
                <div className="relative">
                  <Avatar className="w-14 h-14 ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all">
                    <AvatarImage src={match.user?.avatar} />
                    <AvatarFallback className="text-lg">
                      {match.user?.name?.[0] || '?'}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-foreground truncate flex items-center gap-1.5">
                    {match.user?.name}
                    {match.user?.verification?.photo && (
                      <ShieldCheck className="w-4 h-4 text-green-500 shrink-0" />
                    )}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-accent-violet transition-all"
                        style={{ width: `${match.compatibilityScore || 0}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-primary">{match.compatibilityScore}%</span>
                  </div>
                </div>
              </div>

              {match.user?.bio && (
                <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{match.user.bio}</p>
              )}

              {match.user?.neurodivergentTraits && match.user.neurodivergentTraits.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {match.user.neurodivergentTraits.slice(0, 3).map((trait: string) => (
                    <Badge key={trait} variant="secondary" className="text-[10px] px-2 py-0.5">
                      {trait}
                    </Badge>
                  ))}
                  {match.user.neurodivergentTraits.length > 3 && (
                    <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
                      +{match.user.neurodivergentTraits.length - 3}
                    </Badge>
                  )}
                </div>
              )}

              {match.user?.id && <PassportCard userId={match.user.id} compact />}
              
              <div className="flex gap-2 pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={() => handleUnmatch(match.id)}
                >
                  <X className="w-3.5 h-3.5 mr-1" />
                  Unmatch
                </Button>
                <Button
                  size="sm"
                  className="flex-1 bg-primary hover:bg-primary-600 text-xs"
                  onClick={() => handleMessage(match.user?.id || '')}
                >
                  <MessageCircle className="w-3.5 h-3.5 mr-1" />
                  Message
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
