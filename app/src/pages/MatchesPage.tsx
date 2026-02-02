import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { usersApi, type Match } from '@/lib/api/users';
import { messagesApi } from '@/lib/api/messages';
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
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
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
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Your Matches</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {matches.map((match) => (
          <Card key={match.id} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center gap-4 mb-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={match.user?.avatar} />
                  <AvatarFallback className="text-xl">
                    {match.user?.name?.[0] || '?'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-bold">{match.user?.name}</h3>
                  <Badge variant="secondary" className="text-xs">
                    {match.compatibilityScore}% Match
                  </Badge>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleUnmatch(match.id)}
                >
                  <X className="w-4 h-4 mr-1" />
                  Unmatch
                </Button>
                <Button
                  size="sm"
                  className="flex-1 bg-primary hover:bg-primary-600"
                  onClick={() => handleMessage(match.user?.id || '')}
                >
                  <MessageCircle className="w-4 h-4 mr-1" />
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
