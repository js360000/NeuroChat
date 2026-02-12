import { Link } from 'react-router-dom';
import { useCallback, useEffect, useState } from 'react';
import {
  Compass,
  Sparkles,
  Users,
  Heart,
  ArrowRight,
  Brain,
  CheckCircle2,
  Circle,
  Loader2,
  RefreshCw,
  Lightbulb,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuthStore } from '@/lib/stores/auth';
import { pagesApi } from '@/lib/api/pages';
import { compassApi, type PathDefinition, type CompassState, type Milestone } from '@/lib/api/compass';
import { toast } from 'sonner';

const PATH_ICONS: Record<string, typeof Users> = {
  friendship: Users,
  dating: Heart,
  community: Sparkles,
};

function scorePath(goals: string[], paths: PathDefinition[]) {
  const lower = goals.map((goal) => goal.toLowerCase());
  return paths.map((path) => {
    let score = 0;
    if (path.id === 'friendship' && lower.some((g) => g.includes('friend'))) score += 3;
    if (path.id === 'dating' && lower.some((g) => g.includes('dating'))) score += 3;
    if (path.id === 'community' && lower.some((g) => g.includes('community') || g.includes('event'))) score += 3;
    if (path.id === 'friendship' && lower.some((g) => g.includes('study') || g.includes('co-working'))) score += 2;
    if (path.id === 'community' && lower.some((g) => g.includes('meetup') || g.includes('group'))) score += 2;
    return { ...path, score };
  }).sort((a, b) => b.score - a.score);
}

export function CompassPage() {
  const { user } = useAuthStore();
  const goals = user?.connectionGoals || [];

  const [paths, setPaths] = useState<PathDefinition[]>([]);
  const [state, setState] = useState<CompassState | null>(null);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [ctaVariant, setCtaVariant] = useState<'standard' | 'mentor'>('standard');
  const [switchConfirm, setSwitchConfirm] = useState<string | null>(null);
  const [isSwitching, setIsSwitching] = useState(false);

  const loadCompass = useCallback(async () => {
    try {
      const res = await compassApi.getCompass();
      setPaths(res.paths);
      setState(res.state);
      setRecommendations(res.recommendations);
    } catch {
      toast.error('Failed to load compass');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCompass();
    const loadExperiments = async () => {
      try {
        const response = await pagesApi.getExperiments();
        if (response.experiments?.compassCtaVariant) {
          setCtaVariant(response.experiments.compassCtaVariant);
        }
      } catch {
        /* silent */
      }
    };
    loadExperiments();
  }, [loadCompass]);

  const handleSelectPath = async (pathId: string) => {
    if (state && state.pathId !== pathId && state.completedMilestones.length > 0) {
      setSwitchConfirm(pathId);
      return;
    }
    await doSelectPath(pathId);
  };

  const doSelectPath = async (pathId: string) => {
    setIsSwitching(true);
    try {
      const res = await compassApi.selectPath(pathId);
      setState(res.state);
      setRecommendations(res.recommendations);
      toast.success('Path selected!');
    } catch {
      toast.error('Failed to select path');
    } finally {
      setIsSwitching(false);
      setSwitchConfirm(null);
    }
  };

  const handleCompleteMilestone = async (milestoneId: string) => {
    try {
      const res = await compassApi.completeMilestone(milestoneId);
      setState(res.state);
      setRecommendations(res.recommendations);
      toast.success('Milestone completed!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to complete milestone');
    }
  };

  const ranked = scorePath(goals, paths);
  const activePath = paths.find((p) => p.id === state?.pathId);
  const completedSet = new Set(state?.completedMilestones || []);
  const progress = activePath
    ? Math.round((completedSet.size / activePath.milestones.length) * 100)
    : 0;
  const ctaLabel = ctaVariant === 'mentor' ? 'Pair with a guide' : 'Start this path';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Compass className="w-6 h-6 text-primary" />
            Connection Compass
          </h1>
          <p className="text-neutral-500">A calm, guided path based on your goals.</p>
        </div>
        <div className="flex items-center gap-2">
          {state && <Badge variant="secondary">On the {activePath?.title}</Badge>}
          <Badge variant="secondary">Personalized</Badge>
        </div>
      </div>

      {/* Path cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {ranked.map((path, index) => {
          const Icon = PATH_ICONS[path.id] || Sparkles;
          const isActive = state?.pathId === path.id;
          return (
            <Card
              key={path.id}
              className={
                isActive
                  ? 'border-primary shadow-glow ring-2 ring-primary/20'
                  : index === 0 && !state
                    ? 'border-primary shadow-glow'
                    : ''
              }
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon className="w-5 h-5 text-primary" />
                  {path.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-neutral-500">{path.description}</p>
                <div className="flex flex-wrap gap-1.5">
                  {isActive && <Badge className="bg-primary text-white">Active</Badge>}
                  {index === 0 && !state && <Badge className="bg-primary/10 text-primary">Top match</Badge>}
                </div>
                <Button
                  variant={isActive ? 'default' : 'outline'}
                  className="w-full"
                  disabled={isSwitching}
                  onClick={() => handleSelectPath(path.id)}
                >
                  {isSwitching ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isActive ? (
                    'Currently active'
                  ) : (
                    ctaLabel
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Active path milestones */}
      {activePath && state && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                {(() => { const Icon = PATH_ICONS[activePath.id] || Sparkles; return <Icon className="w-5 h-5 text-primary" />; })()}
                {activePath.title} — Milestones
              </CardTitle>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-primary">{progress}%</span>
                <Button variant="ghost" size="sm" onClick={loadCompass} title="Refresh progress">
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-neutral-100 rounded-full h-2 mt-2">
              <div
                className="bg-primary rounded-full h-2 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              {completedSet.size} of {activePath.milestones.length} milestones completed
              {state.startedAt && ` · Started ${new Date(state.startedAt).toLocaleDateString()}`}
            </p>
          </CardHeader>
          <CardContent className="space-y-2">
            {activePath.milestones.map((milestone: Milestone) => {
              const done = completedSet.has(milestone.id);
              return (
                <div
                  key={milestone.id}
                  className={`flex items-start gap-3 rounded-lg border p-3 transition-colors ${
                    done
                      ? 'border-emerald-200 bg-emerald-50/50'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <button
                    onClick={() => !done && handleCompleteMilestone(milestone.id)}
                    disabled={done}
                    className="mt-0.5 shrink-0"
                    title={done ? 'Completed' : 'Mark as completed'}
                  >
                    {done ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <Circle className="w-5 h-5 text-neutral-300 hover:text-primary transition-colors" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${done ? 'line-through text-neutral-400' : ''}`}>
                      {milestone.title}
                    </p>
                    <p className="text-xs text-neutral-500">{milestone.description}</p>
                  </div>
                  {milestone.link && !done && (
                    <Link to={milestone.link}>
                      <Button variant="ghost" size="sm" className="shrink-0 text-xs h-7">
                        Go <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </Link>
                  )}
                </div>
              );
            })}
            {progress === 100 && (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-center space-y-2">
                <p className="text-sm font-semibold text-primary">You completed this path!</p>
                <p className="text-xs text-neutral-500">Consider exploring another path or continuing to use the features you unlocked.</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Personalized recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardContent className="p-6 space-y-3">
            <div className="flex items-center gap-2 text-primary">
              <Lightbulb className="w-4 h-4" />
              <span className="text-sm font-semibold">Personalised tips</span>
            </div>
            <ul className="space-y-2">
              {recommendations.map((tip, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-neutral-600">
                  <Brain className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link to="/settings">
                <Button variant="outline" size="sm">Open Settings</Button>
              </Link>
              <Link to="/profile">
                <Button variant="outline" size="sm">Edit Profile</Button>
              </Link>
              <Link to="/community">
                <Button size="sm" className="bg-primary hover:bg-primary-600">
                  Explore Community
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Switch path confirmation dialog */}
      <Dialog open={!!switchConfirm} onOpenChange={() => setSwitchConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Switch path?</DialogTitle>
            <DialogDescription>
              You have progress on your current path. Switching will reset your milestones for the new path. Your previous completions won't be lost if you switch back.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSwitchConfirm(null)}>Cancel</Button>
            <Button onClick={() => switchConfirm && doSelectPath(switchConfirm)} disabled={isSwitching}>
              {isSwitching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Switch path'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
