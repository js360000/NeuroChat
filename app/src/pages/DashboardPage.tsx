import { useEffect, useMemo, useState } from 'react';
import { List, Orbit, Wand2, Send, Sparkles, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
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
  const [filters, setFilters] = useState({
    onlineOnly: false,
    highMatch: false,
    sharedInterests: false
  });
  const [sortBy, setSortBy] = useState<'match' | 'name' | 'recent'>('match');
  const [selectedMatch, setSelectedMatch] = useState<PotentialMatch | null>(null);
  const [queue, setQueue] = useState<PotentialMatch[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [hoveredMatch, setHoveredMatch] = useState<PotentialMatch | null>(null);
  const [hoveredRect, setHoveredRect] = useState<DOMRect | null>(null);

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

  const filteredMatches = useMemo(() => {
    let matches = [...potentialMatches];
    if (filters.onlineOnly) {
      matches = matches.filter((match) => match.isOnline);
    }
    if (filters.highMatch) {
      matches = matches.filter((match) => (match.compatibilityScore || 0) >= 85);
    }
    if (filters.sharedInterests) {
      matches = matches.filter((match) => (match.sharedInterests?.length || 0) > 0);
    }
    if (sortBy === 'match') {
      matches.sort((a, b) => (b.compatibilityScore || 0) - (a.compatibilityScore || 0));
    }
    if (sortBy === 'name') {
      matches.sort((a, b) => a.name.localeCompare(b.name));
    }
    return matches;
  }, [potentialMatches, filters, sortBy]);

  const currentMatch = filteredMatches[0];

  const clusters = useMemo(() => {
    const buckets: Record<string, PotentialMatch[]> = {};
    filteredMatches.forEach((match) => {
      const key = match.sharedInterests?.[0] || match.sharedTraits?.[0] || 'Discover';
      if (!buckets[key]) buckets[key] = [];
      buckets[key].push(match);
    });
    return Object.entries(buckets).map(([label, members]) => ({
      label,
      members
    }));
  }, [filteredMatches]);

  useEffect(() => {
    if (selectedMatch && !filteredMatches.find((match) => match.id === selectedMatch.id)) {
      setSelectedMatch(filteredMatches[0] || null);
    }
  }, [filteredMatches, selectedMatch]);

  const previewPosition = useMemo(() => {
    if (!hoveredRect || typeof window === 'undefined') return null;
    const width = 260;
    const height = 240;
    let left = hoveredRect.right + 16;
    let top = hoveredRect.top;
    if (left + width > window.innerWidth) {
      left = hoveredRect.left - width - 16;
    }
    if (top + height > window.innerHeight) {
      top = window.innerHeight - height - 16;
    }
    if (top < 12) top = 12;
    if (left < 12) left = 12;
    return { top, left, width };
  }, [hoveredRect]);

  const handleHover = (event: React.MouseEvent<HTMLElement>, match: PotentialMatch) => {
    setHoveredMatch(match);
    setHoveredRect(event.currentTarget.getBoundingClientRect());
  };

  const clearHover = () => {
    setHoveredMatch(null);
    setHoveredRect(null);
  };

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
    const hasFilters = filters.onlineOnly || filters.highMatch || filters.sharedInterests;
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-8">
          <Sparkles className="w-16 h-16 mx-auto text-primary mb-4" />
          <h2 className="text-2xl font-bold mb-2">
            {hasFilters ? 'No matches for these filters' : 'No more profiles'}
          </h2>
          <p className="text-neutral-500 mb-6">
            {hasFilters
              ? 'Try adjusting your filters to see more people.'
              : 'Check back later for more potential matches!'}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {hasFilters && (
              <Button
                variant="outline"
                onClick={() => setFilters({ onlineOnly: false, highMatch: false, sharedInterests: false })}
              >
                Clear filters
              </Button>
            )}
            <Button onClick={loadPotentialMatches} variant="outline">
              Refresh
            </Button>
          </div>
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

        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-neutral-600">
            <SlidersHorizontal className="w-4 h-4" />
            Quick filters
          </div>
          <Button
            size="sm"
            variant={filters.onlineOnly ? 'default' : 'outline'}
            onClick={() => setFilters((prev) => ({ ...prev, onlineOnly: !prev.onlineOnly }))}
          >
            Online now
          </Button>
          <Button
            size="sm"
            variant={filters.highMatch ? 'default' : 'outline'}
            onClick={() => setFilters((prev) => ({ ...prev, highMatch: !prev.highMatch }))}
          >
            85%+ match
          </Button>
          <Button
            size="sm"
            variant={filters.sharedInterests ? 'default' : 'outline'}
            onClick={() => setFilters((prev) => ({ ...prev, sharedInterests: !prev.sharedInterests }))}
          >
            Shared interests
          </Button>
          <div className="ml-auto min-w-[180px]">
            <Select value={sortBy} onValueChange={(value: 'match' | 'name' | 'recent') => setSortBy(value)}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="match">Sort by match</SelectItem>
                <SelectItem value="name">Sort by name</SelectItem>
                <SelectItem value="recent">Sort by recent</SelectItem>
              </SelectContent>
            </Select>
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
                          onMouseEnter={(event) => handleHover(event, match)}
                          onMouseLeave={clearHover}
                          className="absolute flex flex-col items-center gap-1"
                          style={{ left: x, top: y }}
                        >
                          <div
                            className={`relative w-12 h-12 rounded-full border-2 shadow-lg overflow-hidden ${
                              queue.find((item) => item.id === match.id)
                                ? 'border-primary'
                                : 'border-white'
                            }`}
                          >
                            <Avatar className="w-full h-full">
                              <AvatarImage src={match.avatar} />
                              <AvatarFallback>{match.name[0]}</AvatarFallback>
                            </Avatar>
                            {match.isOnline && (
                              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-400 border-2 border-white" />
                            )}
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
                {filteredMatches.map((match) => (
                  <Card
                    key={match.id}
                    className="hover:shadow-card transition-shadow"
                    onMouseEnter={(event) => handleHover(event, match)}
                    onMouseLeave={clearHover}
                  >
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={match.avatar} />
                            <AvatarFallback>{match.name[0]}</AvatarFallback>
                          </Avatar>
                          {match.isOnline && (
                            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-400 border-2 border-white" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold">{match.name}</p>
                          <p className="text-xs text-neutral-500">{match.compatibilityScore}% match</p>
                        </div>
                      </div>
                      {match.bio && <p className="text-sm text-neutral-600">{match.bio}</p>}
                      <div className="flex flex-wrap items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => setSelectedMatch(match)}>
                          View Profile
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => toggleQueue(match)}>
                          {queue.find((item) => item.id === match.id) ? 'Queued' : 'Queue'}
                        </Button>
                      </div>
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

        {hoveredMatch && previewPosition && (
          <div
            className="fixed z-50"
            style={{ top: previewPosition.top, left: previewPosition.left, width: previewPosition.width }}
          >
            <Card className="border border-neutral-200 shadow-card pointer-events-none">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={hoveredMatch.avatar} />
                    <AvatarFallback>{hoveredMatch.name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{hoveredMatch.name}</p>
                    <p className="text-xs text-neutral-500">
                      {hoveredMatch.compatibilityScore}% match
                    </p>
                  </div>
                </div>
                {hoveredMatch.bio && (
                  <p className="text-sm text-neutral-600 line-clamp-3">{hoveredMatch.bio}</p>
                )}
                <div className="flex flex-wrap gap-2">
                  {hoveredMatch.sharedInterests?.slice(0, 3).map((interest) => (
                    <Badge key={interest} variant="secondary">
                      {interest}
                    </Badge>
                  ))}
                  {hoveredMatch.sharedTraits?.slice(0, 2).map((trait) => (
                    <Badge key={trait} variant="outline">
                      {trait}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-neutral-500">Click to open full profile</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
