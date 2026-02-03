import { useEffect, useMemo, useRef, useState } from 'react';
import { List, Orbit, Wand2, Send, Sparkles, SlidersHorizontal, ShieldCheck, Clock } from 'lucide-react';
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
import { pagesApi } from '@/lib/api/pages';
import { toast } from 'sonner';

interface PotentialMatch {
  id: string;
  name: string;
  avatar?: string;
  bio?: string;
  neurodivergentTraits: string[];
  specialInterests: string[];
  connectionGoals?: string[];
  isOnline: boolean;
  verification?: {
    email: boolean;
    photo: boolean;
    id: boolean;
    self?: boolean;
    peer?: boolean;
    admin?: boolean;
  };
  quietHours?: {
    enabled: boolean;
    start: string;
    end: string;
  };
  compatibilityScore?: number;
  sharedTraits?: string[];
  sharedInterests?: string[];
}

const INTENT_OPTIONS = [
  'Friendship',
  'Dating',
  'Creative collaborators',
  'Study buddies',
  'Accountability partners',
  'Community events',
  'Co-working',
  'Local meetups'
];

const INTENT_CARDS = [
  {
    id: 'Friendship',
    title: 'Friendship',
    description: 'Low-pressure connections and steady check-ins.'
  },
  {
    id: 'Dating',
    title: 'Dating',
    description: 'Intentional dating with clarity on tone and pace.'
  },
  {
    id: 'Community events',
    title: 'Community',
    description: 'Groups, events, and shared routines.'
  }
];

export function DashboardPage() {
  const { user, updateProfile } = useAuthStore();
  const [potentialMatches, setPotentialMatches] = useState<PotentialMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'constellation' | 'list'>('constellation');
  const [filters, setFilters] = useState({
    onlineOnly: false,
    highMatch: false,
    sharedInterests: false,
    intent: 'all'
  });
  const [sortBy, setSortBy] = useState<'match' | 'name' | 'recent'>('match');
  const [selectedMatch, setSelectedMatch] = useState<PotentialMatch | null>(null);
  const [queue, setQueue] = useState<PotentialMatch[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [hoveredMatch, setHoveredMatch] = useState<PotentialMatch | null>(null);
  const [hoveredRect, setHoveredRect] = useState<DOMRect | null>(null);
  const hoverTimeoutRef = useRef<number | null>(null);
  const hoverLockRef = useRef(false);
  const [similarityWeight, setSimilarityWeight] = useState(user?.matchPreferences?.similarityWeight ?? 0.7);
  const complementWeight = 1 - similarityWeight;
  const [intentVariant, setIntentVariant] = useState<'cards' | 'list'>('cards');

  const getSimilarityScore = (match: PotentialMatch) => {
    const traitOverlap = (match.sharedTraits?.length || 0) / Math.max(1, match.neurodivergentTraits.length);
    const interestOverlap = (match.sharedInterests?.length || 0) / Math.max(1, match.specialInterests.length);
    return Math.round(((traitOverlap * 0.5 + interestOverlap * 0.5) * 100));
  };

  const getWeightedScore = (match: PotentialMatch) => {
    const base = match.compatibilityScore || 0;
    const similarity = getSimilarityScore(match);
    const complement = Math.max(0, 100 - similarity);
    return Math.round(base * 0.6 + similarity * similarityWeight * 0.4 + complement * complementWeight * 0.2);
  };

  const isQuietHoursActive = (quietHours?: { enabled: boolean; start: string; end: string }) => {
    if (!quietHours?.enabled) return false;
    const now = new Date();
    const [startH, startM] = quietHours.start.split(':').map(Number);
    const [endH, endM] = quietHours.end.split(':').map(Number);
    if (Number.isNaN(startH) || Number.isNaN(endH)) return false;
    const start = new Date();
    start.setHours(startH, startM || 0, 0, 0);
    const end = new Date();
    end.setHours(endH, endM || 0, 0, 0);
    if (start <= end) {
      return now >= start && now <= end;
    }
    return now >= start || now <= end;
  };

  useEffect(() => {
    loadPotentialMatches();
  }, []);

  useEffect(() => {
    if (user?.matchPreferences?.similarityWeight !== undefined) {
      setSimilarityWeight(user.matchPreferences.similarityWeight);
    }
  }, [user?.matchPreferences?.similarityWeight]);

  useEffect(() => {
    const loadExperiments = async () => {
      try {
        const response = await pagesApi.getExperiments();
        if (response.experiments?.discoveryIntentVariant) {
          setIntentVariant(response.experiments.discoveryIntentVariant);
        }
      } catch {
        setIntentVariant('cards');
      }
    };
    loadExperiments();
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    const timer = window.setTimeout(() => {
      updateProfile({
        matchPreferences: {
          similarityWeight,
          complementWeight
        }
      });
    }, 500);
    return () => window.clearTimeout(timer);
  }, [similarityWeight, complementWeight, updateProfile, user?.id]);

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
    if (filters.intent !== 'all') {
      matches = matches.filter((match) => match.connectionGoals?.includes(filters.intent));
    }
    if (sortBy === 'match') {
      matches.sort((a, b) => {
        const scoreA = getWeightedScore(a);
        const scoreB = getWeightedScore(b);
        return scoreB - scoreA;
      });
    }
    if (sortBy === 'name') {
      matches.sort((a, b) => a.name.localeCompare(b.name));
    }
    return matches;
  }, [potentialMatches, filters, sortBy]);


  const currentMatch = filteredMatches[0];
  const selectedSimilarity = selectedMatch ? getSimilarityScore(selectedMatch) : null;
  const selectedComplement = selectedSimilarity !== null ? 100 - selectedSimilarity : null;

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
    if (hoverTimeoutRef.current) {
      window.clearTimeout(hoverTimeoutRef.current);
    }
    hoverLockRef.current = false;
    setHoveredMatch(match);
    setHoveredRect(event.currentTarget.getBoundingClientRect());
  };

  const clearHover = () => {
    if (hoverTimeoutRef.current) {
      window.clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = window.setTimeout(() => {
      if (!hoverLockRef.current) {
        setHoveredMatch(null);
        setHoveredRect(null);
      }
    }, 140);
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
    const hasFilters = filters.onlineOnly || filters.highMatch || filters.sharedInterests || filters.intent !== 'all';
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
                onClick={() =>
                  setFilters({ onlineOnly: false, highMatch: false, sharedInterests: false, intent: 'all' })
                }
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
    <div className="min-h-[calc(100vh-4rem)] p-4 sm:p-6">
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

        {intentVariant === 'cards' ? (
          <div className="grid gap-3 md:grid-cols-3">
            {INTENT_CARDS.map((card) => (
              <button
                key={card.id}
                onClick={() => setFilters((prev) => ({ ...prev, intent: card.id }))}
                className={`rounded-2xl border p-4 text-left transition ${
                  filters.intent === card.id ? 'border-primary bg-primary/5' : 'border-neutral-200 bg-white'
                }`}
              >
                <h3 className="font-semibold">{card.title}</h3>
                <p className="text-sm text-neutral-500">{card.description}</p>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {INTENT_CARDS.map((card) => (
              <Button
                key={card.id}
                variant={filters.intent === card.id ? 'default' : 'outline'}
                onClick={() => setFilters((prev) => ({ ...prev, intent: card.id }))}
              >
                {card.title}
              </Button>
            ))}
          </div>
        )}

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
          <div className="ml-auto flex items-center gap-2">
            <div className="min-w-[180px]">
              <Select
                value={filters.intent}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, intent: value }))}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Connection intent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All intents</SelectItem>
                  {INTENT_OPTIONS.map((intent) => (
                    <SelectItem key={intent} value={intent}>
                      {intent}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
              <div className="relative h-[420px] sm:h-[520px] rounded-3xl border border-neutral-200 bg-white overflow-hidden">
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
                        <div className="mt-1 flex flex-wrap gap-1">
                          {isQuietHoursActive(match.quietHours) && (
                            <Badge variant="outline" className="text-[10px]">
                              <Clock className="w-3 h-3 mr-1" />
                              Quiet hours
                            </Badge>
                          )}
                          {match.verification?.self && (
                            <Badge variant="secondary" className="text-[10px]">
                              <ShieldCheck className="w-3 h-3 mr-1" />
                              Self
                            </Badge>
                          )}
                          {match.verification?.peer && (
                            <Badge variant="secondary" className="text-[10px]">
                              <ShieldCheck className="w-3 h-3 mr-1" />
                              Peer
                            </Badge>
                          )}
                          {match.verification?.admin && (
                            <Badge variant="secondary" className="text-[10px]">
                              <ShieldCheck className="w-3 h-3 mr-1" />
                              Admin
                            </Badge>
                          )}
                        </div>
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
                <h3 className="font-semibold">Match balance</h3>
                <p className="text-sm text-neutral-500">
                  Decide whether you want more similarity or complementary traits.
                </p>
                <div className="space-y-2">
                  <label className="text-xs text-neutral-500">Similarity preference</label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={Math.round(similarityWeight * 100)}
                    onChange={(event) => setSimilarityWeight(Number(event.target.value) / 100)}
                    className="w-full accent-primary"
                  />
                  <div className="flex items-center justify-between text-xs text-neutral-500">
                    <span>Similarity {Math.round(similarityWeight * 100)}%</span>
                    <span>Complement {Math.round(complementWeight * 100)}%</span>
                  </div>
                </div>
                {selectedMatch && (
                  <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-xs text-neutral-600">
                    <div className="flex items-center justify-between">
                      <span>Similarity breakdown</span>
                      <span>{selectedSimilarity}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Complement breakdown</span>
                      <span>{selectedComplement}%</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
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
                      <div className="mt-2 flex flex-wrap gap-1">
                        {isQuietHoursActive(selectedMatch.quietHours) && (
                          <Badge variant="outline" className="text-[10px]">
                            <Clock className="w-3 h-3 mr-1" />
                            Quiet hours
                          </Badge>
                        )}
                        {selectedMatch.verification?.self && (
                          <Badge variant="secondary" className="text-[10px]">
                            <ShieldCheck className="w-3 h-3 mr-1" />
                            Self
                          </Badge>
                        )}
                        {selectedMatch.verification?.peer && (
                          <Badge variant="secondary" className="text-[10px]">
                            <ShieldCheck className="w-3 h-3 mr-1" />
                            Peer
                          </Badge>
                        )}
                        {selectedMatch.verification?.admin && (
                          <Badge variant="secondary" className="text-[10px]">
                            <ShieldCheck className="w-3 h-3 mr-1" />
                            Admin
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  {selectedMatch.bio && <p className="text-sm text-neutral-600">{selectedMatch.bio}</p>}
                  <div className="flex flex-wrap gap-2">
                    {selectedMatch.sharedInterests?.map((interest) => (
                      <Badge key={interest} variant="secondary">
                        {interest}
                      </Badge>
                    ))}
                    {selectedMatch.connectionGoals?.slice(0, 2).map((goal) => (
                      <Badge key={goal} variant="outline">
                        {goal}
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
            onMouseEnter={() => {
              hoverLockRef.current = true;
              if (hoverTimeoutRef.current) window.clearTimeout(hoverTimeoutRef.current);
            }}
            onMouseLeave={() => {
              hoverLockRef.current = false;
              clearHover();
            }}
          >
            <Card className="border border-neutral-200 shadow-card">
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
                  {hoveredMatch.connectionGoals?.slice(0, 2).map((goal) => (
                    <Badge key={goal} variant="outline">
                      {goal}
                    </Badge>
                  ))}
                  {isQuietHoursActive(hoveredMatch.quietHours) && (
                    <Badge variant="outline">
                      <Clock className="w-3 h-3 mr-1" />
                      Quiet hours
                    </Badge>
                  )}
                  {hoveredMatch.verification?.self && (
                    <Badge variant="secondary">
                      <ShieldCheck className="w-3 h-3 mr-1" />
                      Self
                    </Badge>
                  )}
                  {hoveredMatch.verification?.peer && (
                    <Badge variant="secondary">
                      <ShieldCheck className="w-3 h-3 mr-1" />
                      Peer
                    </Badge>
                  )}
                  {hoveredMatch.verification?.admin && (
                    <Badge variant="secondary">
                      <ShieldCheck className="w-3 h-3 mr-1" />
                      Admin
                    </Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => toggleQueue(hoveredMatch)}
                  >
                    {queue.find((item) => item.id === hoveredMatch.id) ? 'Queued' : 'Queue'}
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 bg-primary hover:bg-primary-600"
                    onClick={() => handlePin(hoveredMatch)}
                  >
                    Like
                  </Button>
                </div>
                <p className="text-xs text-neutral-500">Quick actions from hover preview.</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
