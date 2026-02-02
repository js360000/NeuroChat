import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import { Heart, Brain, MessageCircle, Shield, Sparkles, Star, ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { applySeo } from '@/lib/seo';
import { AccessibilityControls } from '@/components/AccessibilityControls';

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

const TESTIMONIALS = [
  {
    quote: "The AI Explain feature is a game-changer! I no longer worry about misreading messages.",
    author: "Alex M.",
    role: "Autistic & ADHD",
    avatar: "/user_headshot_1_alex_1770055210671.png"
  },
  {
    quote: "Tone tags have made communication so much easier. No more awkward misunderstandings!",
    author: "Jordan K.",
    role: "Autistic",
    avatar: "/user_headshot_2_jordan_1770055223957.png"
  },
  {
    quote: "I've made more genuine friends on NeuroNest in 3 months than in my entire life.",
    author: "Sam T.",
    role: "ADHD",
    avatar: "/user_headshot_3_sam_1770055235874.png"
  }
];

const PLANS = [
  {
    name: 'Basic',
    price: 0,
    features: ['Create a full profile', 'Browse and match', 'Basic messaging', 'Community access']
  },
  {
    name: 'Premium',
    price: 12,
    features: ['AI Message Explanations', 'Tone Tags', 'See who liked you', 'Unlimited likes', 'Priority support'],
    featured: true
  },
  {
    name: 'Pro',
    price: 24,
    features: ['Video messaging', 'Incognito mode', 'Travel mode', 'Profile consultation', 'Exclusive events']
  }
];

export function LandingPage() {
  useEffect(() => {
    applySeo({
      title: 'NeuroNest - Neurodivergent Dating, Friendship & Community',
      description:
        'NeuroNest is a neurodivergent-first platform for dating, friendship, and community. Clear communication tools, safety-first design, and a welcoming community.',
      canonical: 'https://arcane-waters-46868-5bf57db34e8e.herokuapp.com/',
      ogImage: '/landing_hero_neurodivergent_connection_1770055018741.png'
    });
  }, []);

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent-violet flex items-center justify-center">
                <Heart className="w-5 h-5 text-white fill-white" />
              </div>
              <span className="text-xl font-bold text-dark">NeuroNest</span>
            </Link>
            <div className="flex items-center gap-4">
              <AccessibilityControls />
              <Link to="/games" className="text-sm font-medium text-neutral-600 hover:text-dark">
                Games
              </Link>
              <Link to="/login" className="text-sm font-medium text-neutral-600 hover:text-dark">
                Log in
              </Link>
              <Link to="/register">
                <Button className="bg-primary hover:bg-primary-600">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 bg-gradient-to-br from-primary/5 via-peach/30 to-primary/5 overflow-hidden">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-left">
            <Badge className="mb-6 bg-peach text-dark">
              <Sparkles className="w-4 h-4 mr-1" />
              Designed for the Neurodivergent Community
            </Badge>
            <h1 className="text-5xl lg:text-7xl font-bold text-dark mb-6 leading-tight">
              Find Your Perfect{' '}
              <span className="text-gradient">Connection</span>
            </h1>
            <p className="text-xl text-neutral-500 max-w-2xl mb-8 leading-relaxed">
              A safe, understanding space where neurodivergent adults can find friendship, love, and community.
              Built by ND people, for ND people.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
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

            {/* Social Proof */}
            <div className="flex items-center gap-4 mt-12">
              <div className="flex -space-x-3">
                {TESTIMONIALS.map((t, i) => (
                  <img
                    key={i}
                    src={t.avatar}
                    alt={t.author}
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
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-accent-violet/20 rounded-3xl blur-3xl transform rotate-3 scale-95" />
            <img
              src="/landing_hero_neurodivergent_connection_1770055018741.png"
              alt="Neurodivergent people connecting"
              className="relative rounded-3xl shadow-glow border border-white/20 object-cover w-full h-[500px] lg:h-[600px] animate-in fade-in zoom-in duration-1000"
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Built Different, For Different</h2>
            <p className="text-neutral-500 max-w-xl mx-auto">
              Our features are designed with neurodivergent needs in mind.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {FEATURES.map((feature) => (
              <Card key={feature.title} className="hover:shadow-card-hover transition-all duration-300 group">
                <CardContent className="p-6">
                  <Badge className="mb-4">{feature.badge}</Badge>
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-primary/10 blur-xl rounded-full transform scale-75 group-hover:scale-100 transition-transform duration-500" />
                    <img
                      src={feature.image}
                      alt={feature.title}
                      className="relative w-32 h-32 mx-auto object-contain transform group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-neutral-500 leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 bg-neutral-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Real People, Real Connections</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((testimonial) => (
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
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Simple, Fair Pricing</h2>
            <p className="text-neutral-500">
              Up to 70% lower than competitors. Everyone deserves love.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {PLANS.map((plan) => (
              <Card
                key={plan.name}
                className={plan.featured ? 'border-2 border-primary shadow-glow' : ''}
              >
                <CardContent className="p-6">
                  {plan.featured && (
                    <Badge className="mb-4 bg-primary text-white">Most Popular</Badge>
                  )}
                  <h3 className="text-xl font-bold">{plan.name}</h3>
                  <div className="my-4">
                    <span className="text-4xl font-bold">${plan.price}</span>
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
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-gradient-to-br from-primary to-accent-violet">
        <div className="max-w-4xl mx-auto text-center text-white">
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
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-dark-300 text-white">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent-violet flex items-center justify-center">
              <Heart className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold">NeuroNest</span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-300 mb-3">
            <Link to="/compare/hiki" className="hover:text-white">Hiki Alternative</Link>
            <Link to="/blog" className="hover:text-white">Blog</Link>
            <Link to="/community" className="hover:text-white">Community</Link>
            <Link to="/games" className="hover:text-white">Games</Link>
          </div>
          <p className="text-neutral-400 text-sm">
            (c) 2025 NeuroNest. All rights reserved. Built with care for the ND community.
          </p>
        </div>
      </footer>
    </div>
  );
}
