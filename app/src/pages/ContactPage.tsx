import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Mail, MessageSquarePlus, Shield, Clock, FileText, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PublicNav } from '@/components/PublicNav';
import { PublicFooter } from '@/components/PublicFooter';
import { applySeo } from '@/lib/seo';

const CONTACT_METHODS = [
  {
    icon: Mail,
    title: 'General Enquiries',
    description: 'Questions about NeuroNest, partnerships, or press.',
    detail: 'hello@neuronest.app',
    action: 'mailto:hello@neuronest.app',
  },
  {
    icon: Shield,
    title: 'Safety & Trust',
    description: 'Report a safety concern, abuse, or request urgent moderation.',
    detail: 'safety@neuronest.app',
    action: 'mailto:safety@neuronest.app',
  },
  {
    icon: FileText,
    title: 'Privacy & Data Requests',
    description: 'GDPR requests, data deletion, or privacy questions.',
    detail: 'privacy@neuronest.app',
    action: 'mailto:privacy@neuronest.app',
  },
];

export function ContactPage() {
  useEffect(() => {
    applySeo({
      title: 'Contact NeuroNest — Get In Touch',
      description: 'Reach out to the NeuroNest team for support, safety concerns, partnership enquiries, or privacy requests.',
      canonical: `${window.location.origin}/contact`,
    });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <PublicNav />

      {/* Hero */}
      <section className="pt-28 pb-16 px-4 bg-gradient-to-br from-primary/5 via-peach/20 to-background">
        <div className="max-w-4xl mx-auto text-center space-y-5">
          <Badge className="bg-primary/10 text-primary">Contact</Badge>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
            We'd love to hear from you.
          </h1>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto leading-relaxed">
            Whether you have a question, a concern, or just want to say hello — the NeuroNest team is here.
          </p>
        </div>
      </section>

      {/* Contact methods */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid sm:grid-cols-3 gap-5">
            {CONTACT_METHODS.map((method) => (
              <Card key={method.title} className="hover:shadow-card transition-shadow">
                <CardContent className="p-6 space-y-3 text-center">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
                    <method.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold">{method.title}</h3>
                  <p className="text-sm text-neutral-500">{method.description}</p>
                  <a
                    href={method.action}
                    className="inline-block text-sm text-primary font-medium hover:underline"
                  >
                    {method.detail}
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Response times */}
      <section className="py-12 px-4 bg-neutral-50">
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardContent className="p-6 sm:p-8 space-y-4">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold">Response Times</h2>
              </div>
              <div className="grid sm:grid-cols-3 gap-4 text-sm">
                <div className="rounded-lg border border-red-200 bg-red-50/50 p-4 text-center">
                  <p className="font-semibold text-red-700">Safety reports</p>
                  <p className="text-red-600/70 mt-1">Within 4 hours</p>
                </div>
                <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4 text-center">
                  <p className="font-semibold text-amber-700">Privacy requests</p>
                  <p className="text-amber-600/70 mt-1">Within 48 hours</p>
                </div>
                <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4 text-center">
                  <p className="font-semibold text-blue-700">General enquiries</p>
                  <p className="text-blue-600/70 mt-1">Within 3 business days</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Feedback callout */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-6 sm:p-8 flex flex-col sm:flex-row items-start gap-5">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <MessageSquarePlus className="w-6 h-6 text-primary" />
              </div>
              <div className="space-y-2 flex-1">
                <h3 className="font-semibold text-lg">Have product feedback?</h3>
                <p className="text-sm text-neutral-600">
                  Use the feedback button (bottom-right of every page) to share ideas, report bugs,
                  or suggest improvements. Logged-in users can choose to submit anonymously or attach their account.
                  Your feedback directly shapes the product — check our changelog to see the impact.
                </p>
                <div className="flex items-center gap-3 pt-1">
                  <Link to="/changelog">
                    <Button variant="outline" size="sm" className="gap-1.5">
                      View Changelog <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
