import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PublicNav } from '@/components/PublicNav';
import { PublicFooter } from '@/components/PublicFooter';
import { applySeo } from '@/lib/seo';
import { Shield, Eye, Trash2, Download, Globe, Lock, ArrowRight } from 'lucide-react';

const DATA_COLLECTED = [
  { category: 'Account data', examples: 'Name, email, password (hashed), profile bio, avatar', purpose: 'Provide and personalise your account' },
  { category: 'Communication preferences', examples: 'Tone tag settings, directness, pace, calm mode level', purpose: 'Tailor your communication experience' },
  { category: 'Messages', examples: 'Direct messages, community posts, blog comments', purpose: 'Deliver the messaging and community features' },
  { category: 'Safety data', examples: 'Reports, blocks, verification status, moderation flags', purpose: 'Keep the community safe' },
  { category: 'Usage data', examples: 'Pages visited, feature interactions, session duration', purpose: 'Improve the product and fix bugs' },
  { category: 'Payment data', examples: 'Subscription plan, Stripe customer ID (card details stored by Stripe, not us)', purpose: 'Process subscriptions and billing' },
  { category: 'Cookie consent', examples: 'Your analytics/marketing consent choices', purpose: 'Respect your privacy preferences' },
];

const RIGHTS = [
  { icon: Eye, title: 'Right to Access', description: 'Request a copy of all personal data we hold about you.' },
  { icon: Download, title: 'Right to Portability', description: 'Export your data in a machine-readable format at any time from your settings.' },
  { icon: Trash2, title: 'Right to Deletion', description: 'Delete your account and all associated data directly from your account settings.' },
  { icon: Lock, title: 'Right to Restrict Processing', description: 'Ask us to limit how we process your data while a concern is being resolved.' },
  { icon: Globe, title: 'Right to Object', description: 'Opt out of analytics and marketing cookies at any time via the cookie consent banner.' },
];

const SECTIONS = [
  {
    id: 'what-we-collect',
    title: '1. What We Collect',
    type: 'table' as const,
  },
  {
    id: 'how-we-use',
    title: '2. How We Use Your Data',
    content: `We use your data exclusively to:\n\n• Operate and maintain the NeuroNest platform\n• Personalise your experience (matching, communication preferences, sensory settings)\n• Ensure safety through moderation, verification, and reporting tools\n• Process payments via Stripe\n• Improve the product based on aggregated, anonymised usage patterns\n• Send you essential service communications (security alerts, account changes)\n\nWe do NOT sell your personal data to third parties. We do NOT use your messages or profile data to train AI models. AI features (message explanation, conversation summary, rephrase suggestions, and compatibility analysis) process data in real-time via Google Gemini and do not retain it after the request completes.`,
  },
  {
    id: 'third-parties',
    title: '3. Third-Party Services',
    content: `We use a limited number of trusted third-party services:\n\n• Stripe — payment processing (PCI-DSS compliant)\n• Google Gemini — AI-powered message explanation, conversation summaries, rephrase suggestions, and compatibility analysis (data processed in transit, not stored by Google)\n• Google AdSense — advertising for free-tier users (subject to your cookie consent)\n\nEach third-party processor is bound by data processing agreements and is prohibited from using your data for their own purposes beyond the service they provide to us.`,
  },
  {
    id: 'cookies',
    title: '4. Cookies',
    content: `We use cookies for:\n\n• Essential functionality — keeping you logged in, saving your preferences (always active)\n• Analytics — understanding how the site is used to improve it (requires your consent)\n• Advertising — serving relevant ads to free-tier users via Google AdSense (requires your consent)\n\nYou can change your cookie preferences at any time using the cookie consent banner or from your account settings. Essential cookies cannot be disabled as they are required for the site to function.`,
  },
  {
    id: 'retention',
    title: '5. Data Retention',
    content: `Active account data is retained for as long as your account exists. When you delete your account, your personal data is removed from active systems immediately.\n\nBackups containing your data may persist for up to 30 days before being purged. Anonymised, aggregated analytics data (which cannot identify you) may be retained indefinitely for product improvement.\n\nSafety-related data (reports of abuse, moderation actions) may be retained for up to 12 months after account deletion to protect the community.`,
  },
  {
    id: 'security',
    title: '6. Security',
    content: `We take the security of your data seriously:\n\n• Passwords are hashed using bcrypt — we never store plain-text passwords\n• All data is transmitted over HTTPS/TLS encryption\n• Payment data is handled entirely by Stripe (PCI-DSS Level 1 certified)\n• Access to user data is restricted to authorised team members on a need-to-know basis\n• We conduct regular security reviews of our codebase and infrastructure\n\nIf you discover a security vulnerability, please report it to security@neuronest.app.`,
  },
  {
    id: 'rights',
    title: '7. Your Rights',
    type: 'rights' as const,
  },
  {
    id: 'changes',
    title: '8. Changes to This Policy',
    content: `We may update this privacy policy from time to time. Material changes will be communicated via email or an in-app notice at least 14 days before they take effect.\n\nThe date of the most recent revision is displayed at the top of this page.`,
  },
];

export function PrivacyPage() {
  useEffect(() => {
    applySeo({
      title: 'Privacy Policy — NeuroNest',
      description: 'Learn how NeuroNest collects, uses, and protects your data. Understand your privacy rights including access, deletion, and data portability.',
      canonical: `${window.location.origin}/privacy`,
    });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <PublicNav />

      {/* Hero */}
      <section className="pt-28 pb-12 px-4 bg-gradient-to-br from-primary/5 via-peach/20 to-background">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <Badge className="bg-primary/10 text-primary">Legal</Badge>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">Privacy Policy</h1>
          <p className="text-neutral-500">Last updated: February 2026</p>
          <p className="text-neutral-600 max-w-2xl mx-auto text-sm leading-relaxed">
            We believe privacy is a fundamental right. This policy explains exactly what data we collect,
            why we collect it, and what control you have over it.
          </p>
        </div>
      </section>

      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto flex flex-col lg:flex-row gap-8">
          {/* Sidebar TOC */}
          <nav className="hidden lg:block w-56 flex-shrink-0 sticky top-20 self-start">
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">Sections</p>
            <ul className="space-y-1.5">
              {SECTIONS.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="text-sm text-neutral-500 hover:text-primary transition-colors">
                    {s.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Content */}
          <div className="flex-1 space-y-6">
            {SECTIONS.map((section) => (
              <Card key={section.id} id={section.id}>
                <CardContent className="p-6 sm:p-8 space-y-4">
                  <h2 className="text-lg font-bold">{section.title}</h2>

                  {'type' in section && section.type === 'table' ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-2 pr-4 font-semibold text-neutral-700">Category</th>
                            <th className="text-left py-2 pr-4 font-semibold text-neutral-700">Examples</th>
                            <th className="text-left py-2 font-semibold text-neutral-700">Purpose</th>
                          </tr>
                        </thead>
                        <tbody>
                          {DATA_COLLECTED.map((row) => (
                            <tr key={row.category} className="border-b border-border/50">
                              <td className="py-2.5 pr-4 font-medium text-neutral-700 whitespace-nowrap">{row.category}</td>
                              <td className="py-2.5 pr-4 text-neutral-500">{row.examples}</td>
                              <td className="py-2.5 text-neutral-500">{row.purpose}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : 'type' in section && section.type === 'rights' ? (
                    <div className="space-y-3">
                      <p className="text-sm text-neutral-600">Under GDPR and equivalent regulations, you have the following rights:</p>
                      <div className="grid gap-3">
                        {RIGHTS.map((right) => (
                          <div key={right.title} className="flex items-start gap-3 rounded-lg border border-border p-3">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <right.icon className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold">{right.title}</p>
                              <p className="text-xs text-neutral-500 mt-0.5">{right.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <p className="text-sm text-neutral-600 mt-3">
                        To exercise any of these rights, contact <a href="mailto:privacy@neuronest.app" className="text-primary hover:underline">privacy@neuronest.app</a> or
                        use the in-app tools in your account settings.
                      </p>
                    </div>
                  ) : (
                    'content' in section && section.content?.split('\n\n').map((para, i) => {
                      if (para.startsWith('•') || para.includes('\n•')) {
                        const items = para.split('\n').filter((l) => l.startsWith('•'));
                        return (
                          <ul key={i} className="space-y-1.5 text-sm text-neutral-600 pl-1">
                            {items.map((item, j) => (
                              <li key={j} className="flex items-start gap-2">
                                <span className="text-primary mt-0.5">•</span>
                                <span>{item.replace(/^•\s*/, '')}</span>
                              </li>
                            ))}
                          </ul>
                        );
                      }
                      return <p key={i} className="text-sm text-neutral-600 leading-relaxed">{para}</p>;
                    })
                  )}
                </CardContent>
              </Card>
            ))}

            {/* Contact CTA */}
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-6 flex items-center gap-4">
                <Shield className="w-8 h-8 text-primary flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold text-sm">Questions about your privacy?</p>
                  <p className="text-xs text-neutral-500 mt-0.5">Our privacy team typically responds within 48 hours.</p>
                </div>
                <Link to="/contact">
                  <Button variant="outline" size="sm" className="gap-1.5">
                    Contact Us <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
