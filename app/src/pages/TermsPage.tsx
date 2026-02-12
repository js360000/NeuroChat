import { useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PublicNav } from '@/components/PublicNav';
import { PublicFooter } from '@/components/PublicFooter';
import { applySeo } from '@/lib/seo';

const SECTIONS = [
  {
    id: 'eligibility',
    title: '1. Eligibility',
    content: `You must be at least 18 years old to use NeuroNest. By creating an account, you represent and warrant that you meet this age requirement. NeuroNest is intended for adults seeking friendship, dating, and community — it is not designed for or marketed to minors.`,
  },
  {
    id: 'accounts',
    title: '2. Your Account',
    content: `You are responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account. You agree to provide accurate, current, and complete information during registration and to keep it up to date.\n\nYou may not create multiple accounts, impersonate another person, or transfer your account to anyone else. We reserve the right to suspend or terminate accounts that violate these terms.`,
  },
  {
    id: 'conduct',
    title: '3. Community Standards & Conduct',
    content: `NeuroNest is a safe-first community. You agree not to:\n\n• Harass, bully, threaten, or intimidate other users\n• Post hateful, discriminatory, or violent content\n• Share sexually explicit content without clear consent frameworks\n• Spam, scam, or engage in fraudulent activity\n• Impersonate another person or misrepresent your identity\n• Attempt to circumvent safety or moderation systems\n• Use the platform for any illegal purpose\n\nViolations may result in warnings, temporary suspensions, or permanent bans at our discretion. We maintain a zero-tolerance policy for abuse targeting neurodivergent traits or disabilities.`,
  },
  {
    id: 'content',
    title: '4. Content You Create',
    content: `You retain ownership of the content you post on NeuroNest (messages, profile text, community posts, etc.). By posting content, you grant us a non-exclusive, worldwide, royalty-free licence to display, distribute, and store that content as needed to operate the platform.\n\nWe do not claim ownership of your content. You may delete your content at any time, and we will remove it from our active systems. Some content may persist in backups for a limited period as required by law or operational necessity.`,
  },
  {
    id: 'safety',
    title: '5. Safety Features',
    content: `NeuroNest provides various safety tools including user verification, content moderation, blocking, reporting, and crisis resources. While we strive to maintain a safe environment, we cannot guarantee the identity, intentions, or behaviour of any user.\n\nYou should exercise your own judgement when communicating with others. Never share sensitive personal information (financial details, home address, etc.) with people you have not verified independently.`,
  },
  {
    id: 'subscriptions',
    title: '6. Subscriptions & Payments',
    content: `NeuroNest offers free and paid subscription tiers. Paid subscriptions are billed through Stripe and will auto-renew unless cancelled before the renewal date.\n\nYou can manage or cancel your subscription at any time through your account settings or the Stripe customer portal. Refunds are handled on a case-by-case basis — contact us if you believe you are owed a refund.\n\nFree-tier users may see non-intrusive advertisements. Safety-critical features are never paywalled.`,
  },
  {
    id: 'ai',
    title: '7. AI Features',
    content: `NeuroNest uses AI (Google Gemini) to power message explanation, tone analysis, and other assistive features. AI outputs are provided as suggestions and should not be relied upon as definitive interpretations of another person's intent.\n\nMessage content processed by AI is not stored by third-party AI providers beyond the duration of the request. We do not use your messages to train AI models.`,
  },
  {
    id: 'termination',
    title: '8. Termination',
    content: `You may delete your account at any time from your account settings. Upon deletion, your profile, messages, and personal data will be removed from our active systems.\n\nWe reserve the right to suspend or terminate accounts that violate these terms, with or without notice. In cases of severe violations (threats, illegal activity), termination may be immediate.`,
  },
  {
    id: 'liability',
    title: '9. Limitation of Liability',
    content: `NeuroNest is provided "as is" without warranties of any kind. To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the platform.\n\nThis includes, but is not limited to, damages arising from interactions with other users, reliance on AI features, or service interruptions.`,
  },
  {
    id: 'changes',
    title: '10. Changes to These Terms',
    content: `We may update these terms from time to time. Material changes will be communicated via email or an in-app notice at least 14 days before they take effect. Continued use of NeuroNest after changes take effect constitutes acceptance of the revised terms.\n\nThe date of the most recent revision is displayed at the top of this page.`,
  },
];

export function TermsPage() {
  useEffect(() => {
    applySeo({
      title: 'Terms of Service — NeuroNest',
      description: 'Read the NeuroNest terms of service covering eligibility, community standards, subscriptions, AI features, and your rights.',
      canonical: `${window.location.origin}/terms`,
    });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <PublicNav />

      {/* Hero */}
      <section className="pt-28 pb-12 px-4 bg-gradient-to-br from-primary/5 via-peach/20 to-background">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <Badge className="bg-primary/10 text-primary">Legal</Badge>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">Terms of Service</h1>
          <p className="text-neutral-500">Last updated: February 2026</p>
        </div>
      </section>

      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto flex flex-col lg:flex-row gap-8">
          {/* Sidebar TOC (desktop) */}
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
                <CardContent className="p-6 sm:p-8 space-y-3">
                  <h2 className="text-lg font-bold">{section.title}</h2>
                  {section.content.split('\n\n').map((para, i) => {
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
                    return (
                      <p key={i} className="text-sm text-neutral-600 leading-relaxed">{para}</p>
                    );
                  })}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
