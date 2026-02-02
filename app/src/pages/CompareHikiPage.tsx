import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Shield, Sparkles, MessageCircle, BadgeCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { applySeo } from '@/lib/seo';

const HIGHLIGHTS = [
  {
    title: 'Transparent pricing',
    description: 'Core messaging and community access are available without a high monthly paywall.'
  },
  {
    title: 'Clarity-first communication',
    description: 'Tone tags, AI explain, and community safety nudges reduce miscommunication.'
  },
  {
    title: 'Community-first design',
    description: 'Interest clusters, moderated spaces, and ND-built guides for real connection.'
  }
];

const HIKI_SNAPSHOT = [
  'Friendship + dating app positioned for the autistic, ADHD, and neurodivergent community.',
  'Includes a community feed with posts, reactions, and comments.',
  'Safety page highlights profile verification and zero-tolerance policies.',
  'App-store listing mentions premium tiers, boosts/sparks, and video messaging.'
];

const COMPARISON = [
  {
    category: 'Messaging',
    neuronest: 'Core messaging with optional AI explain and tone tags.',
    hiki: 'Premium tiers unlock additional features and boosts (pricing varies by region).'
  },
  {
    category: 'Community',
    neuronest: 'Built-in community feed with content warnings and moderation.',
    hiki: 'Positioned as friendship + dating with a community focus.'
  },
  {
    category: 'Safety',
    neuronest: 'Active moderation queue, reporting, and auto-hide thresholds.',
    hiki: 'Safety page highlights profile verification and community protections.'
  }
];

export function CompareHikiPage() {
  useEffect(() => {
    applySeo({
      title: 'NeuroNest vs Hiki — A Neurodivergent Dating Alternative',
      description:
        'Compare NeuroNest and Hiki for neurodivergent dating. See how NeuroNest prioritizes affordability, clarity tools, and community.',
      canonical: 'https://arcane-waters-46868-5bf57db34e8e.herokuapp.com/compare/hiki',
      ogImage: '/landing_hero_neurodivergent_connection_1770055018741.png'
    });
  }, []);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-neutral-50">
      <div className="max-w-5xl mx-auto px-6 py-12 space-y-8">
        <div className="space-y-4">
          <Badge className="bg-primary/10 text-primary">
            <BadgeCheck className="w-4 h-4 mr-2" />
            Hiki alternative
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-bold text-dark">
            NeuroNest vs Hiki
          </h1>
          <p className="text-neutral-600 text-lg">
            NeuroNest is a neurodivergent-first dating and community platform designed for clarity,
            affordability, and safety. Hiki describes itself as a friendship and dating app for the
            neurodivergent community, with safety and verification features. This page compares the
            publicly described experience.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/register">
              <Button className="bg-primary hover:bg-primary-600">Join NeuroNest</Button>
            </Link>
            <Link to="/pricing">
              <Button variant="outline">See pricing</Button>
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {HIGHLIGHTS.map((item) => (
            <Card key={item.title} className="border border-neutral-200">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-2 text-primary">
                  <CheckCircle2 className="w-5 h-5" />
                  <h3 className="font-semibold">{item.title}</h3>
                </div>
                <p className="text-sm text-neutral-600">{item.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardContent className="p-6 space-y-3">
            <h2 className="text-xl font-semibold">What Hiki highlights publicly</h2>
            <ul className="space-y-2 text-sm text-neutral-600">
              {HIKI_SNAPSHOT.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-xl font-semibold">Feature comparison</h2>
            <p className="text-sm text-neutral-500">
              Comparison reflects publicly described features and app-store listings; availability and pricing may
              vary by region and device.
            </p>
            <div className="space-y-4">
              {COMPARISON.map((row) => (
                <div key={row.category} className="grid md:grid-cols-[150px,1fr,1fr] gap-4">
                  <div className="text-sm font-medium text-neutral-500">{row.category}</div>
                  <div className="rounded-lg border border-neutral-200 bg-white p-4">
                    <div className="flex items-center gap-2 text-primary font-semibold">
                      <Sparkles className="w-4 h-4" />
                      NeuroNest
                    </div>
                    <p className="text-sm text-neutral-600 mt-2">{row.neuronest}</p>
                  </div>
                  <div className="rounded-lg border border-neutral-200 bg-white p-4">
                    <div className="flex items-center gap-2 text-neutral-500 font-semibold">
                      <MessageCircle className="w-4 h-4" />
                      Hiki
                    </div>
                    <p className="text-sm text-neutral-600 mt-2">{row.hiki}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid sm:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-2 text-primary">
                <Shield className="w-5 h-5" />
                <h3 className="font-semibold">Safety-first moderation</h3>
              </div>
              <p className="text-sm text-neutral-600">
                NeuroNest includes a moderation queue, reporting tools, and auto-hide thresholds to keep
                the community safe.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-2 text-primary">
                <Sparkles className="w-5 h-5" />
                <h3 className="font-semibold">Designed for clarity</h3>
              </div>
              <p className="text-sm text-neutral-600">
                Tone tags, AI explanations, and community context help reduce ambiguity and social fatigue.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
