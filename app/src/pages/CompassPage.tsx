import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Compass, Sparkles, Users, Heart, ArrowRight, Brain } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/stores/auth';
import { pagesApi } from '@/lib/api/pages';

const PATHS = [
  {
    id: 'friendship',
    title: 'Friendship path',
    icon: Users,
    description: 'Low-pressure connections, shared routines, and community rooms.'
  },
  {
    id: 'dating',
    title: 'Dating path',
    icon: Heart,
    description: 'Clear intent, slower pacing, and tone-first messaging.'
  },
  {
    id: 'community',
    title: 'Community path',
    icon: Sparkles,
    description: 'Topic rooms, gentle mode feed, and buddy threads.'
  }
];

function scorePath(goals: string[]) {
  const lower = goals.map((goal) => goal.toLowerCase());
  return PATHS.map((path) => {
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
  const ranked = scorePath(goals);
  const [ctaVariant, setCtaVariant] = useState<'standard' | 'mentor'>('standard');

  useEffect(() => {
    const loadExperiments = async () => {
      try {
        const response = await pagesApi.getExperiments();
        if (response.experiments?.compassCtaVariant) {
          setCtaVariant(response.experiments.compassCtaVariant);
        }
      } catch {
        setCtaVariant('standard');
      }
    };
    loadExperiments();
  }, []);

  const ctaLabel = ctaVariant === 'mentor' ? 'Pair with a guide' : 'Start this path';

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Compass className="w-6 h-6 text-primary" />
            Connection Compass
          </h1>
          <p className="text-neutral-500">A calm, guided path based on your goals.</p>
        </div>
        <Badge variant="secondary">Personalized</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {ranked.map((path, index) => (
          <Card key={path.id} className={index === 0 ? 'border-primary shadow-glow' : ''}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <path.icon className="w-5 h-5 text-primary" />
                {path.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-neutral-500">{path.description}</p>
              {index === 0 && <Badge className="bg-primary/10 text-primary">Top match</Badge>}
              <Button variant="outline" className="w-full">
                {ctaLabel}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-6 space-y-3">
          <div className="flex items-center gap-2 text-primary">
            <Brain className="w-4 h-4" />
            <span className="text-sm font-semibold">Recommended next steps</span>
          </div>
          <ul className="text-sm text-neutral-600 space-y-1">
            <li>Update your boundaries and quiet hours to reduce overwhelm.</li>
            <li>Try the community rooms that match your interests.</li>
            <li>Set a gentle response pace in messaging.</li>
          </ul>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link to="/settings">
              <Button variant="outline">Open Settings</Button>
            </Link>
            <Link to="/community">
              <Button className="bg-primary hover:bg-primary-600">
                Explore Community
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
