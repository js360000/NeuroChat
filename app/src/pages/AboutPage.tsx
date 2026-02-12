import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Shield, Brain, Users, Sparkles, ArrowRight, Eye, MessageCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PublicNav } from '@/components/PublicNav';
import { PublicFooter } from '@/components/PublicFooter';
import { applySeo } from '@/lib/seo';

const VALUES = [
  { icon: Shield, title: 'Safety First', description: 'Every feature is reviewed through a safety lens. Verification, moderation, and crisis resources are built in — not bolted on.' },
  { icon: Eye, title: 'Transparency', description: 'We tell you exactly how your data is used, how matching works, and what our AI does. No hidden algorithms.' },
  { icon: Brain, title: 'Neurodivergent by Design', description: 'Calm mode, tone tags, sensory controls, and clear communication tools are core features — not afterthoughts.' },
  { icon: MessageCircle, title: 'Clear Communication', description: 'We reduce guesswork with tone indicators, AI-powered message explanation, and adjustable directness preferences.' },
  { icon: Users, title: 'Community Driven', description: 'Our roadmap is shaped by user feedback. Changes inspired by the community are highlighted in our public changelog.' },
  { icon: Sparkles, title: 'Respectful Monetisation', description: 'Free users get a full experience with non-intrusive ads. Premium removes ads and adds extras — never paywalling safety.' },
];

export function AboutPage() {
  useEffect(() => {
    applySeo({
      title: 'About NeuroNest — Our Mission & Values',
      description: 'NeuroNest is a neurodivergent-first platform for dating, friendship, and community. Learn about our mission, values, and the team behind the product.',
      canonical: `${window.location.origin}/about`,
    });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <PublicNav />

      {/* Hero */}
      <section className="pt-28 pb-16 px-4 bg-gradient-to-br from-primary/5 via-peach/20 to-background">
        <div className="max-w-4xl mx-auto text-center space-y-5">
          <Badge className="bg-primary/10 text-primary">About Us</Badge>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
            Connection should feel <span className="text-primary">safe</span>, not stressful.
          </h1>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto leading-relaxed">
            NeuroNest was founded on a simple idea: neurodivergent people deserve a social platform that
            actually works with their brains — not against them.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-8 sm:p-10 space-y-4">
              <h2 className="text-2xl font-bold">Our Mission</h2>
              <p className="text-neutral-600 leading-relaxed">
                Mainstream dating and social apps are designed around neurotypical communication norms —
                fast replies, subtext, and unwritten social rules that can be exhausting or inaccessible
                for autistic, ADHD, dyslexic, and other neurodivergent people.
              </p>
              <p className="text-neutral-600 leading-relaxed">
                NeuroNest removes the guesswork. We provide tools for clear communication (tone tags,
                AI message explanation, adjustable pace), sensory comfort (calm mode, reduced motion,
                density controls), and genuine safety (verification, moderation, crisis resources).
              </p>
              <p className="text-neutral-600 leading-relaxed">
                Our goal is a world where neurodivergent adults can find friendship, love, and community
                without masking or over-adapting.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Values grid */}
      <section className="py-16 px-4 bg-neutral-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold">What We Stand For</h2>
            <p className="text-neutral-500 mt-2">The principles that guide every feature and decision.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {VALUES.map((value) => (
              <Card key={value.title}>
                <CardContent className="p-6 space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <value.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold">{value.title}</h3>
                  <p className="text-sm text-neutral-600 leading-relaxed">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How we're different */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <h2 className="text-2xl font-bold text-center">How We're Different</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            <Card className="border-red-200 bg-red-50/50">
              <CardContent className="p-6 space-y-2">
                <h3 className="font-semibold text-red-700">Typical social apps</h3>
                <ul className="text-sm text-red-600/80 space-y-1.5">
                  <li>• Fast-paced, reward-driven design</li>
                  <li>• Communication relies on subtext and social cues</li>
                  <li>• Safety features added reactively</li>
                  <li>• One-size-fits-all sensory experience</li>
                  <li>• Aggressive monetisation and data harvesting</li>
                </ul>
              </CardContent>
            </Card>
            <Card className="border-green-200 bg-green-50/50">
              <CardContent className="p-6 space-y-2">
                <h3 className="font-semibold text-green-700">NeuroNest</h3>
                <ul className="text-sm text-green-600/80 space-y-1.5">
                  <li>• Calm mode, adjustable pace, reduced motion</li>
                  <li>• Tone tags, AI explain, directness preferences</li>
                  <li>• Safety-first: verification, moderation, crisis tools</li>
                  <li>• Fully customisable sensory and accessibility settings</li>
                  <li>• Transparent pricing, respectful ads, no data selling</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Feedback-driven */}
      <section className="py-16 px-4 bg-neutral-50">
        <div className="max-w-3xl mx-auto text-center space-y-5">
          <Heart className="w-8 h-8 text-primary mx-auto" />
          <h2 className="text-2xl font-bold">Built With You, Not Just For You</h2>
          <p className="text-neutral-600 leading-relaxed">
            Every member can submit feedback from anywhere on the site. Changes inspired by community
            feedback are tagged in our public changelog so you can see your voice making a real difference.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Link to="/changelog">
              <Button variant="outline" className="gap-2">
                View Changelog <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
