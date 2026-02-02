import { useEffect, useMemo, useState } from 'react';
import { List, Orbit, Wand2, Send, Sparkles } from 'lucide-react';
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
  sharedTraits?: string[];
  sharedInterests?: string[];
}

export function DashboardPage() {
  const { user } = useAuthStore();
  const [potentialMatches, setPotentialMatches] = useState<PotentialMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'constellation' | 'list'>('constellation');
  const [selectedMatch, setSelectedMatch] = useState<PotentialMatch | null>(null);
  const [queue, setQueue] = useState<PotentialMatch[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);

  useEffect(() => {
    loadPotentialMatches();
  }, []);

  const loadPotentialMatches = async () => {
    try {
      const response = await usersApi.getPotentialMatches();
      
      // Calculate compatibility for each match
      const matchesWithCompatibility = await Promise.all(
        response.users.map(async (match: PotentialMatch) => {
          const sharedTraits = user?.neurodivergentTraits?.filter((trait) =>
            match.neurodivergentTraits.includes(trait)
          ) || [];
          const sharedInterests = user?.specialInterests?.filter((interest) =>
            match.specialInterests.includes(interest)
          ) || [];
          try {
            const compatResponse = await aiApi.getCompatibility(
              user?.neurodivergentTraits || [],
              user?.specialInterests || [],
              match.neurodivergentTraits,
              match.specialInterests
            );
            return {
              ...match,
              compatibilityScore: compatResponse.compatibility.score,
              sharedTraits,
              sharedInterests
            };
          } catch (error) {
            return {
              ...match,
              compatibilityScore: Math.floor(Math.random() * 30) + 70,
              sharedTraits,
              sharedInterests
            };
          }
        })
      );
      
      setPotentialMatches(matchesWithCompatibility);
      if (matchesWithCompatibility.length > 0) {
        setSelectedMatch(matchesWithCompatibility[0]);
      }
    } catch (error) {
      toast.error('Failed to load potential matches');
    } finally {
      setIsLoading(false);
    }
  };

  const currentMatch = potentialMatches[0];

  const clusters = useMemo(() => {
    const buckets: Record<string, PotentialMatch[]> = {};
    potentialMatches.forEach((match) => {
      const key = match.sharedInterests?.[0] || match.sharedTraits?.[0] || 'Discover';
      if (!buckets[key]) buckets[key] = [];
      buckets[key].push(match);
    });
    return Object.entries(buckets).map(([label, members]) => ({
      label,
      members
    }));
  }, [potentialMatches]);

  const toggleQueue = (match: PotentialMatch) => {
    setQueue((prev) => {
      if (prev.find((item) => item.id === match.id)) {
        return prev.filter((item) => item.id !== match.id);
      }
      if (prev.length >= 5) {
        toast.error('Queue limit reached (5)');
        return prev;
      }
      return [...prev, match];
    });
  };

  const handlePin = async (match: PotentialMatch) => {
    try {
      const response = await usersApi.likeUser(match.id);
      if (response.match && response.conversationId) {
        toast.success("It's a match!");
      } else {
        toast.success('Like sent!');
      }
    } catch {
      toast.error('Failed to like');
    }
  };

  const handleSendPath = async () => {
    if (queue.length === 0) return;
    for (const match of queue) {
      await handlePin(match);
    }
    setQueue([]);
  };

  const handleSuggestions = async (match: PotentialMatch | null) => {
    if (!match) return;
    setIsSuggesting(true);
    try {
      const response = await aiApi.getSuggestions(
        match.specialInterests,
        user?.specialInterests || [],
        []
      );
      setSuggestions(response.suggestions);
    } catch {
      toast.error('Failed to generate suggestions');
    } finally {
      setIsSuggesting(false);
    }
  };

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
    <div className="min-h-[calc(100vh-4rem)] p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Orbit className="w-6 h-6 text-primary" />
              Connection Constellations
            </h1>
            <p className="text-sm text-neutral-500">
              Explore clusters of people who share your interests and traits.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'constellation' ? 'default' : 'outline'}
              onClick={() => setViewMode('constellation')}
            >
              <Orbit className="w-4 h-4 mr-2" />
              Constellation
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4 mr-2" />
              List
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-[2fr,1fr] gap-6">
          <div className="space-y-6">
            {viewMode === 'constellation' ? (
              <div className="relative h-[520px] rounded-3xl border border-neutral-200 bg-white overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(124,57,246,0.12),_transparent_60%)]" />
                {clusters.map((cluster, clusterIndex) => (
                  <div key={cluster.label} className="absolute inset-0">
                    {cluster.members.map((match, index) => {
                      const angle = ((index + 1) / (cluster.members.length + 1)) * Math.PI * 2;
                      const radius = 140 + clusterIndex * 30;
                      const x = 260 + Math.cos(angle) * radius;
                      const y = 240 + Math.sin(angle) * radius;
                      return (
                        <button
                          key={match.id}
                          onClick={() => setSelectedMatch(match)}
                          className="absolute flex flex-col items-center gap-1"
                          style={{ left: x, top: y }}
                        >
                          <div className="w-12 h-12 rounded-full border-2 border-white shadow-lg bg-primary/10 overflow-hidden">
                            <Avatar className="w-full h-full">
                              <AvatarImage src={match.avatar} />
                              <AvatarFallback>{match.name[0]}</AvatarFallback>
                            </Avatar>
                          </div>
                          <span className="text-xs text-neutral-600">{match.name}</span>
                        </button>
                      );
                    })}
                    <div
                      className="absolute left-8 top-8 rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-neutral-600 shadow"
                    >
                      {cluster.label}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {potentialMatches.map((match) => (
                  <Card key={match.id} className="hover:shadow-card transition-shadow">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={match.avatar} />
                          <AvatarFallback>{match.name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold">{match.name}</p>
                          <p className="text-xs text-neutral-500">{match.compatibilityScore}% match</p>
                        </div>
                      </div>
                      {match.bio && <p className="text-sm text-neutral-600">{match.bio}</p>}
                      <Button variant="outline" size="sm" onClick={() => setSelectedMatch(match)}>
                        View Profile
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <CardContent className="p-5 space-y-4">
                <h3 className="font-semibold">Connection Queue</h3>
                {queue.length === 0 ? (
                  <p className="text-sm text-neutral-500">Add up to 5 people to your path.</p>
                ) : (
                  <div className="space-y-3">
                    {queue.map((match) => (
                      <div key={match.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={match.avatar} />
                            <AvatarFallback>{match.name[0]}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{match.name}</span>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => toggleQueue(match)}>
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                <Button
                  className="w-full bg-primary hover:bg-primary-600"
                  onClick={handleSendPath}
                  disabled={queue.length === 0}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send Path Likes
                </Button>
              </CardContent>
            </Card>

            {selectedMatch && (
              <Card>
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-14 h-14">
                      <AvatarImage src={selectedMatch.avatar} />
                      <AvatarFallback>{selectedMatch.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-lg font-semibold">{selectedMatch.name}</p>
                      <p className="text-sm text-neutral-500">{selectedMatch.compatibilityScore}% match</p>
                    </div>
                  </div>
                  {selectedMatch.bio && <p className="text-sm text-neutral-600">{selectedMatch.bio}</p>}
                  <div className="flex flex-wrap gap-2">
                    {selectedMatch.sharedInterests?.map((interest) => (
                      <Badge key={interest} variant="secondary">
                        {interest}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => toggleQueue(selectedMatch)}>
                      {queue.find((item) => item.id === selectedMatch.id) ? 'Queued' : 'Add to Queue'}
                    </Button>
                    <Button className="flex-1 bg-primary hover:bg-primary-600" onClick={() => handlePin(selectedMatch)}>
                      Pin & Like
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleSuggestions(selectedMatch)}
                    disabled={isSuggesting}
                  >
                    <Wand2 className="w-4 h-4 mr-2" />
                    {isSuggesting ? 'Generating...' : 'Generate Starters'}
                  </Button>
                  {suggestions.length > 0 && (
                    <div className="space-y-2">
                      {suggestions.map((suggestion, index) => (
                        <div key={index} className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-sm">
                          {suggestion}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
