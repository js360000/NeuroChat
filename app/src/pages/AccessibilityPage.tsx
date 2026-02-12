import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Eye, Type, Monitor, MousePointerClick, Palette, SlidersHorizontal,
  Volume2, Keyboard, ArrowRight
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PublicNav } from '@/components/PublicNav';
import { PublicFooter } from '@/components/PublicFooter';
import { applySeo } from '@/lib/seo';

const FEATURES = [
  {
    icon: Eye,
    title: 'High Contrast Mode',
    description: 'Increase contrast between text and backgrounds for improved readability. Available in both light and dark themes.',
  },
  {
    icon: Type,
    title: 'Large Text & Dyslexic Font',
    description: 'Scale up text across the entire interface, or switch to OpenDyslexic — a typeface designed to reduce common reading errors for dyslexic users.',
  },
  {
    icon: Monitor,
    title: 'Reduced Motion',
    description: 'Disable animations, transitions, and parallax effects. Respects your OS-level prefers-reduced-motion setting by default.',
  },
  {
    icon: Palette,
    title: 'Reduced Saturation & Calm Mode',
    description: 'Lower colour intensity across the entire interface. Calm mode further softens the visual experience with adjustable intensity (0–100%).',
  },
  {
    icon: SlidersHorizontal,
    title: 'Density Controls',
    description: 'Choose between cozy, balanced, or compact layouts to control information density and whitespace.',
  },
  {
    icon: MousePointerClick,
    title: 'Underlined Links & Focus Rings',
    description: 'Make interactive elements clearly identifiable with persistent underlines and visible keyboard focus indicators.',
  },
  {
    icon: Keyboard,
    title: 'Keyboard Navigation',
    description: 'Full keyboard accessibility across all interactive elements. Skip-to-content links and logical tab order throughout.',
  },
  {
    icon: Volume2,
    title: 'Tone Tags & Communication Clarity',
    description: 'Tone indicators (/j, /srs, /lh, etc.) reduce ambiguity in text communication — an assistive feature for users who find subtext difficult to parse.',
  },
];

const STANDARDS = [
  'WCAG 2.1 Level AA compliance as our minimum target',
  'Semantic HTML with proper heading hierarchy and ARIA attributes',
  'Colour contrast ratios meeting or exceeding 4.5:1 for normal text',
  'All images and icons include appropriate alt text or aria-labels',
  'Form inputs are properly labelled and error messages are descriptive',
  'Interactive elements are reachable and operable via keyboard',
  'No content relies solely on colour to convey meaning',
  'Respects prefers-reduced-motion and prefers-color-scheme OS settings',
];

export function AccessibilityPage() {
  useEffect(() => {
    applySeo({
      title: 'Accessibility — NeuroNest',
      description: 'Learn about NeuroNest\'s accessibility features including calm mode, dyslexic font, reduced motion, high contrast, and our WCAG 2.1 compliance commitment.',
      canonical: `${window.location.origin}/accessibility`,
    });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <PublicNav />

      {/* Hero */}
      <section className="pt-28 pb-16 px-4 bg-gradient-to-br from-primary/5 via-peach/20 to-background">
        <div className="max-w-4xl mx-auto text-center space-y-5">
          <Badge className="bg-primary/10 text-primary">Accessibility</Badge>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
            Designed for <span className="text-primary">every</span> brain.
          </h1>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto leading-relaxed">
            Accessibility isn't an afterthought at NeuroNest — it's foundational.
            We build for neurodivergent users first, which means everyone benefits.
          </p>
        </div>
      </section>

      {/* Features grid */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold">Built-In Accessibility Features</h2>
            <p className="text-neutral-500 mt-2">Every feature is available to all users, free and paid.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map((feature) => (
              <Card key={feature.title}>
                <CardContent className="p-5 space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <feature.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-sm">{feature.title}</h3>
                  <p className="text-xs text-neutral-500 leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Standards */}
      <section className="py-16 px-4 bg-neutral-50">
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardContent className="p-8 space-y-5">
              <h2 className="text-xl font-bold">Our Accessibility Standards</h2>
              <p className="text-sm text-neutral-600 leading-relaxed">
                We are committed to making NeuroNest accessible to the widest possible audience.
                Our development process includes the following standards and practices:
              </p>
              <ul className="space-y-2.5">
                {STANDARDS.map((standard, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-neutral-600">
                    <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px] font-bold text-primary">
                      {i + 1}
                    </span>
                    {standard}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Neurodivergent-specific */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Beyond Standard Accessibility</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            <Card className="border-teal-200 bg-teal-50/50">
              <CardContent className="p-6 space-y-2">
                <h3 className="font-semibold text-teal-700">For Autistic Users</h3>
                <ul className="text-sm text-teal-600/80 space-y-1.5">
                  <li>• Tone tags eliminate ambiguity in text communication</li>
                  <li>• AI message explanation decodes subtext and intent</li>
                  <li>• Predictable, consistent UI patterns throughout</li>
                  <li>• Quiet hours to limit notifications during rest periods</li>
                  <li>• Boundary settings communicated transparently to matches</li>
                </ul>
              </CardContent>
            </Card>
            <Card className="border-amber-200 bg-amber-50/50">
              <CardContent className="p-6 space-y-2">
                <h3 className="font-semibold text-amber-700">For ADHD Users</h3>
                <ul className="text-sm text-amber-600/80 space-y-1.5">
                  <li>• Calm mode reduces visual stimulation and clutter</li>
                  <li>• Adjustable response pace (slow, balanced, fast)</li>
                  <li>• Energy meter helps track social battery</li>
                  <li>• Compact density mode for quick scanning</li>
                  <li>• Games and interactive features for regulation breaks</li>
                </ul>
              </CardContent>
            </Card>
            <Card className="border-purple-200 bg-purple-50/50">
              <CardContent className="p-6 space-y-2">
                <h3 className="font-semibold text-purple-700">For Dyslexic Users</h3>
                <ul className="text-sm text-purple-600/80 space-y-1.5">
                  <li>• OpenDyslexic font toggle available site-wide</li>
                  <li>• Large text mode scales all typography</li>
                  <li>• High contrast improves letter distinction</li>
                  <li>• Clean, uncluttered layouts with ample whitespace</li>
                </ul>
              </CardContent>
            </Card>
            <Card className="border-blue-200 bg-blue-50/50">
              <CardContent className="p-6 space-y-2">
                <h3 className="font-semibold text-blue-700">For Sensory Sensitivities</h3>
                <ul className="text-sm text-blue-600/80 space-y-1.5">
                  <li>• Reduced motion disables all animations</li>
                  <li>• Reduced saturation lowers colour intensity</li>
                  <li>• Light and dark theme options</li>
                  <li>• No auto-playing media or unexpected sounds</li>
                  <li>• SOS button provides instant calming resources</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Feedback */}
      <section className="py-16 px-4 bg-neutral-50">
        <div className="max-w-3xl mx-auto text-center space-y-5">
          <h2 className="text-2xl font-bold">Help Us Improve</h2>
          <p className="text-neutral-600 leading-relaxed">
            Accessibility is an ongoing effort. If you encounter a barrier, have a suggestion,
            or need something we haven't thought of — please let us know.
            Use the feedback button on any page, or contact us directly.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Link to="/contact">
              <Button variant="outline" className="gap-2">
                Contact Us <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
