import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  Brain,
  MessageCircle,
  Shield,
  Sparkles,
  Star,
  ArrowRight,
  Check,
  SlidersHorizontal,
  ShieldCheck,
  Download,
  Trash2,
  Cookie,
  Crown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { AdBanner } from '@/components/AdBanner';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { applySeo } from '@/lib/seo';
import { AnimateIn } from '@/components/AnimateIn';
import { PublicNav } from '@/components/PublicNav';
import { PublicFooter } from '@/components/PublicFooter';
import { testimonialsApi, type Testimonial } from '@/lib/api';
import { pagesApi, type ExperimentSettings } from '@/lib/api/pages';
import { useAppConfig } from '@/lib/stores/config';
import { useCurrency } from '@/lib/hooks/useCurrency';

const FEATURES = [
  {
    icon: Brain,
    image: '/ai_analysis_feature_illustration_1770055034329.png',
    title: 'AI Message Analysis',
    description: 'Click "Explain" on any message to get AI-powered insights on tone, hidden meanings, and suggested responses.',
    badge: 'Powered by Gemini'
  },
  {
    icon: MessageCircle,
    image: '/tone_tags_illustration_1770055069365.png',
    title: 'Tone Tags',
    description: 'Add tone indicators like /j (joking), /srs (serious), /lh (light hearted) to make your intent crystal clear.',
    badge: '8 Tone Options'
  },
  {
    icon: Shield,
    image: '/safe_verified_illustration_1770055050348.png',
    title: 'Safe & Verified',
    description: 'Multi-layer verification including ID checks, photo verification, and community moderation to keep you safe.',
    badge: 'Secure'
  }
];

const STORY_STEPS = [
  {
    title: 'The problem',
    headline: 'Social apps are loud, fast, and full of guesswork.',
    description:
      'Neurodivergent people are expected to decode hidden meaning, read social subtext, and keep up with rapid-fire chats.',
    icon: MessageCircle
  },
  {
    title: 'The calm solution',
    headline: 'NeuroNest makes connection feel clear and gentle.',
    description:
      'We add calm mode, tone tags, and transparent preferences so you can show up without masking or overthinking.',
    icon: SlidersHorizontal
  },
  {
    title: 'The proof',
    headline: 'Real people build real bonds here.',
    description:
      'Members report fewer misunderstandings, safer interactions, and more genuine connections.',
    icon: Star,
    image: '/landing_hero_neurodivergent_connection_1770055018741.png'
  }
];

const DEFAULT_TESTIMONIALS: Testimonial[] = [
  {
    id: 'default-alex',
    quote: "The AI Explain feature is a game-changer! I no longer worry about misreading messages.",
    author: "Alex M.",
    role: "Autistic & ADHD",
    avatar: "/user_headshot_1_alex_1770055210671.png",
    micro: 'Less guessing, more clarity.',
    featured: true,
    status: 'published'
  },
  {
    id: 'default-jordan',
    quote: "Tone tags have made communication so much easier. No more awkward misunderstandings!",
    author: "Jordan K.",
    role: "Autistic",
    avatar: "/user_headshot_2_jordan_1770055223957.png",
    micro: 'Tone tags = calm chats.',
    featured: true,
    status: 'published'
  },
  {
    id: 'default-sam',
    quote: "I've made more genuine friends on NeuroNest in 3 months than in my entire life.",
    author: "Sam T.",
    role: "ADHD",
    avatar: "/user_headshot_3_sam_1770055235874.png",
    micro: 'Real bonds, real fast.',
    featured: true,
    status: 'published'
  }
];

// PLANS derived from config inside component

const TRUST_PILLARS = [
  {
    icon: ShieldCheck,
    title: 'Privacy-first by design',
    description: 'We keep data collection minimal and transparent from day one.'
  },
  {
    icon: Download,
    title: 'Export your data anytime',
    description: 'Download a full copy of your profile, messages, and activity in seconds.'
  },
  {
    icon: Trash2,
    title: 'Delete your account in-app',
    description: 'GDPR-style controls let you erase your data without waiting on support.'
  },
  {
    icon: Cookie,
    title: 'Clear cookie consent',
    description: 'Adjust analytics/marketing consent whenever you want.'
  }
];

export function LandingPage() {
  const appConfig = useAppConfig();
  const { currency, setCurrency, formatPrice } = useCurrency();
  const PLANS = appConfig.pricingPlans.map((p) => ({
    name: p.name,
    price: p.monthlyPrice,
    features: p.features,
    featured: p.featured
  }));
  const PACE_OPTIONS = appConfig.paceOptions as Array<'slow' | 'balanced' | 'fast'>;
  const [demoCalm, setDemoCalm] = useState(35);
  const [demoToneTags, setDemoToneTags] = useState(true);
  const [demoPace, setDemoPace] = useState<'slow' | 'balanced' | 'fast'>('balanced');
  const [demoDirectness, setDemoDirectness] = useState<'gentle' | 'direct'>('gentle');
  const [testimonials, setTestimonials] = useState<Testimonial[]>(DEFAULT_TESTIMONIALS);
  const [microIndex, setMicroIndex] = useState(0);
  const [experiments, setExperiments] = useState<ExperimentSettings | null>(null);

  useEffect(() => {
    applySeo({
      title: 'NeuroNest - Neurodivergent Dating, Friendship & Community',
      description:
        'NeuroNest is a neurodivergent-first platform for dating, friendship, and community. Clear communication tools, safety-first design, and a welcoming community.',
      canonical: `${window.location.origin}/`,
      ogImage: '/landing_hero_neurodivergent_connection_1770055018741.png'
    });
  }, []);

  useEffect(() => {
    const loadTestimonials = async () => {
      try {
        const response = await testimonialsApi.listPublic();
        if (response.testimonials?.length) {
          setTestimonials(response.testimonials);
        }
      } catch {
        // fallback to defaults
      }
    };
    loadTestimonials();
  }, []);

  useEffect(() => {
    const loadExperiments = async () => {
      try {
        const response = await pagesApi.getExperiments();
        setExperiments(response.experiments);
      } catch {
        setExperiments(null);
      }
    };
    loadExperiments();
  }, []);

  useEffect(() => {
    const microStories = testimonials.filter((item) => item.micro);
    if (microStories.length <= 1) return;
    const interval = window.setInterval(() => {
      setMicroIndex((prev) => (prev + 1) % microStories.length);
    }, 4000);
    return () => window.clearInterval(interval);
  }, [testimonials]);

  const calmFactor = demoCalm / 100;
  const previewStyle = {
    filter: `saturate(${1 - calmFactor * 0.35}) contrast(${1 - calmFactor * 0.05})`,
    transform: `scale(${1 - calmFactor * 0.02})`
  } as const;
  const featuredTestimonials = testimonials.filter((item) => item.featured);
  const showcaseTestimonials = featuredTestimonials.length ? featuredTestimonials : testimonials;
  const microStories = showcaseTestimonials.filter((item) => item.micro);
  const activeMicro = microStories.length
    ? microStories[microIndex % microStories.length]
    : null;

  const heroVariants = {
    default: {
      headline: 'Connection without the guesswork.',
      subhead:
        'NeuroNest is a calmer, clearer space for friendship, dating, and community. Built by ND people, for ND people.',
      badge: 'Designed for the Neurodivergent Community'
    },
    calm: {
      headline: 'A calmer way to meet people.',
      subhead:
        'Slow the pace, clarify intent, and build connections that feel safe. NeuroNest is designed with sensory comfort in mind.',
      badge: 'Calm-first connection'
    },
    bold: {
      headline: 'Stop decoding. Start connecting.',
      subhead:
        'Tone tags, calm mode, and transparent preferences make every conversation clearer from day one.',
      badge: 'No guesswork dating'
    }
  } as const;
  const heroVariant = heroVariants[experiments?.landingHeroVariant || 'default'];

  return (
    <div className="min-h-screen">
      <PublicNav />

      {/* Story Hero */}
      <section className="pt-32 pb-20 px-4 bg-gradient-to-br from-primary/5 via-peach/30 to-primary/5 overflow-hidden relative">
        {/* Floating decorative blobs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          <div className="absolute -top-20 -left-20 w-96 h-96 rounded-full bg-primary/5 blur-3xl animate-float" />
          <div className="absolute top-40 -right-20 w-80 h-80 rounded-full bg-accent-violet/5 blur-3xl animate-float-slow" />
          <div className="absolute bottom-20 left-1/4 w-64 h-64 rounded-full bg-peach/20 blur-3xl animate-float" />
        </div>
        <div className="max-w-7xl mx-auto relative z-10">
          <AnimateIn className="text-center max-w-3xl mx-auto">
            <Badge className="mb-6 bg-peach text-dark">
              <Sparkles className="w-4 h-4 mr-1" />
              {heroVariant.badge}
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-dark mb-5 leading-tight">
              {heroVariant.headline}
            </h1>
            <p className="text-lg sm:text-xl text-neutral-500 mb-8 leading-relaxed">
              {heroVariant.subhead}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register">
                <Button size="lg" className="bg-primary hover:bg-primary-600 px-8 text-lg h-14">
                  Get Started Free
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="text-lg h-14">
                  Already a member?
                </Button>
              </Link>
            </div>
            <p className="text-sm text-neutral-500 mt-3">
              Want a preview?{' '}
              <Link to="/sandbox" className="text-primary font-semibold hover:underline">
                Try the vibe
              </Link>
              .
            </p>
          </AnimateIn>

          <div className="grid md:grid-cols-3 gap-6 mt-12">
            {STORY_STEPS.map((step, index) => (
              <AnimateIn key={step.title} delay={index * 150}>
              <Card className="border border-white/30 bg-white/80 backdrop-blur h-full">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between text-sm text-neutral-500">
                    <div className="flex items-center gap-2">
                      <step.icon className="w-4 h-4 text-primary" />
                      <span>{step.title}</span>
                    </div>
                    <Badge variant="secondary">Step {index + 1}</Badge>
                  </div>
                  <h3 className="text-xl font-bold text-dark">{step.headline}</h3>
                  <p className="text-neutral-500 leading-relaxed">{step.description}</p>
                  {step.image && (
                    <img
                      src={step.image}
                      alt="Community preview"
                      loading="lazy"
                      className="w-full h-40 object-cover rounded-2xl border border-white/50"
                    />
                  )}
                </CardContent>
              </Card>
              </AnimateIn>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 mt-10">
            <div className="flex -space-x-3">
              {showcaseTestimonials.map((t, i) => (
                <img
                  key={i}
                  src={t.avatar}
                  alt={t.author}
                  loading="lazy"
                  className="w-12 h-12 rounded-full border-4 border-white object-cover"
                />
              ))}
            </div>
            <div className="text-left">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-sm text-neutral-500">
                From <span className="font-semibold text-dark">10,000+</span> happy members
              </p>
            </div>
          </div>

          {activeMicro && (
            <div className="mt-6 flex items-center justify-center">
              <div className="flex flex-wrap items-center gap-2 rounded-full border border-white/50 bg-white/70 px-4 py-2 text-sm text-neutral-600 shadow-sm">
                <Badge variant="secondary">Micro story</Badge>
                <span>"{activeMicro.micro}"</span>
                <span className="text-neutral-400">- {activeMicro.author}</span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Live Demo */}
      <section className="py-16 px-4 bg-neutral-50">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2 text-primary mb-2">
                <SlidersHorizontal className="w-4 h-4" />
                <span className="text-sm font-semibold uppercase tracking-wide">Live Demo</span>
              </div>
              <h2 className="text-3xl font-bold text-dark">Try the calm mode vibe</h2>
              <p className="text-neutral-500 mt-2 max-w-2xl">
                Adjust your experience instantly and see how tone tags and response pace feel in practice.
              </p>
            </div>
            <Badge className="bg-primary/10 text-primary">Interactive</Badge>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="border border-white/60 bg-white/80">
              <CardContent className="p-6 space-y-5">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Calm mode intensity</span>
                    <Badge variant="secondary">{demoCalm}%</Badge>
                  </div>
                  <Slider
                    value={[demoCalm]}
                    min={0}
                    max={100}
                    step={5}
                    onValueChange={(value) => setDemoCalm(value[0])}
                  />
                </div>

                <div className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">Tone tags</p>
                    <p className="text-xs text-neutral-500">Show /srs, /j, /nm, etc.</p>
                  </div>
                  <Switch checked={demoToneTags} onCheckedChange={setDemoToneTags} />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Response pace</p>
                    <Select
                      value={demoPace}
                      onValueChange={(value) => setDemoPace(value as 'slow' | 'balanced' | 'fast')}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose pace" />
                      </SelectTrigger>
                      <SelectContent>
                        {PACE_OPTIONS.map((pace) => (
                          <SelectItem key={pace} value={pace}>
                            {pace.charAt(0).toUpperCase() + pace.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Directness</p>
                    <Select
                      value={demoDirectness}
                      onValueChange={(value) => setDemoDirectness(value as 'gentle' | 'direct')}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose tone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gentle">Gentle</SelectItem>
                        <SelectItem value="direct">Direct</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-white/60 bg-white/80">
              <CardContent className="p-6 space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-primary/10 text-primary">Calm {demoCalm}%</Badge>
                  <Badge variant="secondary">{demoPace} pace</Badge>
                  <Badge variant="secondary">{demoDirectness} tone</Badge>
                </div>
                <div
                  className="rounded-2xl border border-border bg-white/90 p-4 space-y-3 transition-transform"
                  style={previewStyle}
                >
                  <div className="rounded-2xl bg-primary/10 px-4 py-3">
                    <p className="text-sm font-medium text-dark">You</p>
                    <p className="text-sm text-neutral-600">
                      Hey, would you like to chat after work{demoToneTags ? ' /srs' : ''}?
                    </p>
                  </div>
                  <div className="rounded-2xl bg-neutral-100 px-4 py-3">
                    <p className="text-sm font-medium text-dark">Jamie</p>
                    <p className="text-sm text-neutral-600">
                      {demoDirectness === 'direct'
                        ? 'Yes, that works. I can reply later tonight.'
                        : 'That sounds lovely. I might need a little time, but yes.'}
                      {demoToneTags ? ' /g' : ''}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-neutral-500">
                  Preview only. Calm mode and preferences are fully customizable after signup.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <AnimateIn className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Built Different, For Different</h2>
            <p className="text-neutral-500 max-w-xl mx-auto">
              Our features are designed with neurodivergent needs in mind.
            </p>
          </AnimateIn>

          <div className="grid md:grid-cols-3 gap-8">
            {FEATURES.map((feature, index) => (
              <AnimateIn key={feature.title} delay={index * 120}>
              <Card className="hover:shadow-card-hover transition-all duration-300 group h-full">
                <CardContent className="p-6">
                  <Badge className="mb-4">{feature.badge}</Badge>
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-primary/10 blur-xl rounded-full transform scale-75 group-hover:scale-100 transition-transform duration-500" />
                    <img
                      src={feature.image}
                      alt={feature.title}
                      loading="lazy"
                      className="relative w-32 h-32 mx-auto object-contain transform group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-neutral-500 leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* Privacy Trust */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-2 text-primary mb-3">
              <ShieldCheck className="w-4 h-4" />
              <span className="text-sm font-semibold uppercase tracking-wide">Privacy-first</span>
            </div>
            <h2 className="text-3xl font-bold mb-4">Your data stays in your control</h2>
            <p className="text-neutral-500 max-w-2xl mx-auto">
              NeuroNest is built with GDPR-style controls from day one, so you always decide what happens to your data.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {TRUST_PILLARS.map((pillar) => (
              <Card key={pillar.title} className="border border-border bg-neutral-50">
                <CardContent className="p-6 space-y-3">
                  <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <pillar.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-dark">{pillar.title}</h3>
                  <p className="text-sm text-neutral-500">{pillar.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 bg-neutral-50">
        <div className="max-w-6xl mx-auto">
          <AnimateIn className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Real People, Real Connections</h2>
          </AnimateIn>

          <div className="grid md:grid-cols-3 gap-6">
            {showcaseTestimonials.map((testimonial) => (
              <Card key={testimonial.author} className="hover:shadow-card transition-shadow">
                <CardContent className="p-6">
                  <div className="flex mb-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-neutral-600 mb-6 italic leading-relaxed">"{testimonial.quote}"</p>
                  <div className="flex items-center gap-3">
                    <img
                      src={testimonial.avatar}
                      alt={testimonial.author}
                      loading="lazy"
                      className="w-12 h-12 rounded-full object-cover border-2 border-primary/20"
                    />
                    <div>
                      <p className="font-bold text-dark">{testimonial.author}</p>
                      <p className="text-xs text-neutral-500">{testimonial.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <AnimateIn className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Simple, Fair Pricing</h2>
            <p className="text-neutral-500">
              Up to 70% lower than competitors. Everyone deserves love.
            </p>
            <div className="inline-flex items-center rounded-full border border-neutral-200 bg-neutral-50 p-0.5 text-sm mt-4">
              <button
                onClick={() => setCurrency('USD')}
                className={`px-3 py-1 rounded-full transition-colors ${currency === 'USD' ? 'bg-primary text-white shadow-sm' : 'text-neutral-600 hover:text-neutral-900'}`}
              >
                $ USD
              </button>
              <button
                onClick={() => setCurrency('GBP')}
                className={`px-3 py-1 rounded-full transition-colors ${currency === 'GBP' ? 'bg-primary text-white shadow-sm' : 'text-neutral-600 hover:text-neutral-900'}`}
              >
                £ GBP
              </button>
            </div>
          </AnimateIn>

          <div className="grid md:grid-cols-3 gap-8">
            {PLANS.map((plan, index) => (
              <AnimateIn key={plan.name} delay={index * 120}>
              <Card
                className={plan.featured ? 'border-2 border-primary shadow-glow h-full' : 'h-full'}
              >
                <CardContent className="p-6">
                  {plan.featured && (
                    <Badge className="mb-4 bg-primary text-white">Most Popular</Badge>
                  )}
                  <h3 className="text-xl font-bold">{plan.name}</h3>
                  <div className="my-4">
                    <span className="text-4xl font-bold">{formatPrice(plan.price)}</span>
                    <span className="text-neutral-500">/month</span>
                  </div>
                  <ul className="space-y-2 mb-6">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-primary" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link to="/register" className="block">
                    <Button
                      className={`w-full ${plan.featured
                          ? 'bg-primary hover:bg-primary-600'
                          : 'bg-neutral-100 hover:bg-neutral-200 text-dark'
                        }`}
                    >
                      Get Started
                    </Button>
                  </Link>
                </CardContent>
              </Card>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* Respectful Advertising Promise */}
      <section className="py-16 px-4 bg-neutral-50">
        <AnimateIn className="max-w-4xl mx-auto">
          <div className="rounded-2xl border border-neutral-200 bg-white p-8 sm:p-10">
            <div className="flex flex-col sm:flex-row items-start gap-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Crown className="w-6 h-6 text-primary" />
              </div>
              <div className="space-y-3">
                <h3 className="text-xl font-bold">Our Promise: Respectful Advertising</h3>
                <p className="text-neutral-600">
                  NeuroNest is free to use, and we keep it that way with thoughtful, non-intrusive ads.
                  We believe advertising should never compromise your experience:
                </p>
                <ul className="text-sm text-neutral-600 space-y-1.5">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary flex-shrink-0" />
                    Ads are placed in dedicated, clearly-labelled spots — never over content
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary flex-shrink-0" />
                    No pop-ups, no auto-play video, no full-screen takeovers
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary flex-shrink-0" />
                    Ads are hidden in safety-sensitive areas (crisis tools, safety features)
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary flex-shrink-0" />
                    Upgrade to Premium or Pro for a completely ad-free experience
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div className="mt-6">
            <AdBanner area="landing" />
          </div>
        </AnimateIn>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-gradient-to-br from-primary to-accent-violet">
        <AnimateIn className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to Find Your People?
          </h2>
          <p className="text-lg text-white/80 mb-8">
            Join thousands of neurodivergent adults who've found friendship, love, and community.
          </p>
          <Link to="/register">
            <Button size="lg" className="bg-white text-primary hover:bg-white/90">
              Get Started Free
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </AnimateIn>
      </section>

      <PublicFooter />
    </div>
  );
}
