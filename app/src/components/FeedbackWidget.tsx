import { useState } from 'react';
import { MessageSquarePlus, Star, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { useAuthStore } from '@/lib/stores/auth';
import { feedbackApi } from '@/lib/api/feedback';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const AREAS = [
  { value: 'general', label: 'General' },
  { value: 'dashboard', label: 'Dashboard / Matching' },
  { value: 'messages', label: 'Messages' },
  { value: 'community', label: 'Community' },
  { value: 'blog', label: 'Blog' },
  { value: 'games', label: 'Games' },
  { value: 'profile', label: 'Profile / Settings' },
  { value: 'onboarding', label: 'Onboarding' },
  { value: 'pricing', label: 'Pricing / Billing' },
  { value: 'safety', label: 'Safety Features' },
  { value: 'accessibility', label: 'Accessibility' },
  { value: 'other', label: 'Other' },
];

export function FeedbackWidget() {
  const { isAuthenticated, user } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [area, setArea] = useState('general');
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const reset = () => {
    setArea('general');
    setRating(0);
    setMessage('');
    setAnonymous(false);
    setSent(false);
  };

  const handleSubmit = async () => {
    if (!message.trim()) {
      toast.error('Please enter your feedback');
      return;
    }
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }
    setSending(true);
    try {
      await feedbackApi.submit({
        area,
        rating,
        message: message.trim(),
        anonymous: isAuthenticated ? anonymous : true,
      });
      setSent(true);
      toast.success('Feedback submitted — thank you!');
    } catch {
      toast.error('Failed to submit feedback');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => { setOpen(true); setSent(false); }}
        className={cn(
          'fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full px-4 py-3',
          'bg-primary text-white shadow-lg hover:bg-primary-600 transition-all',
          'hover:scale-105 active:scale-95',
          open && 'hidden'
        )}
        aria-label="Send feedback"
      >
        <MessageSquarePlus className="w-5 h-5" />
        <span className="text-sm font-medium hidden sm:inline">Feedback</span>
      </button>

      {/* Modal overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => { setOpen(false); reset(); }} />
          <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md mx-auto shadow-2xl animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-5 pb-3">
              <div>
                <h3 className="font-semibold text-lg">Send Feedback</h3>
                <p className="text-xs text-neutral-500">Help us improve NeuroNest</p>
              </div>
              <button
                onClick={() => { setOpen(false); reset(); }}
                className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center hover:bg-neutral-200 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {sent ? (
              <div className="px-5 pb-6 pt-2 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                  <Send className="w-6 h-6 text-green-600" />
                </div>
                <h4 className="font-semibold">Thank you!</h4>
                <p className="text-sm text-neutral-500">
                  Your feedback helps us build a better experience for everyone.
                  Check our <a href="/changelog" className="text-primary underline">changelog</a> to see how feedback shapes NeuroNest.
                </p>
                <Button variant="outline" onClick={() => { setOpen(false); reset(); }}>
                  Close
                </Button>
              </div>
            ) : (
              <div className="px-5 pb-5 space-y-4">
                {/* Area selector */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-neutral-500">What area is this about?</Label>
                  <Select value={area} onValueChange={setArea}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AREAS.map((a) => (
                        <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Star rating */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-neutral-500">How would you rate this area?</Label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        onClick={() => setRating(n)}
                        className="p-1 transition-transform hover:scale-110"
                      >
                        <Star
                          className={cn(
                            'w-7 h-7 transition-colors',
                            n <= rating
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-neutral-200'
                          )}
                        />
                      </button>
                    ))}
                    {rating > 0 && (
                      <Badge variant="secondary" className="ml-2 text-xs self-center">
                        {rating}/5
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Message */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-neutral-500">Your feedback</Label>
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="What's working well? What could be better?"
                    rows={4}
                    className="resize-none"
                    maxLength={1000}
                  />
                  <p className="text-[10px] text-neutral-400 text-right">{message.length}/1000</p>
                </div>

                {/* Anonymous toggle (only for logged-in users) */}
                {isAuthenticated && (
                  <div className="flex items-center justify-between rounded-lg border border-neutral-200 p-3">
                    <div>
                      <p className="text-sm font-medium">Submit anonymously</p>
                      <p className="text-xs text-neutral-500">
                        {anonymous
                          ? 'Your identity will not be attached'
                          : `Submitting as ${user?.name || 'you'}`}
                      </p>
                    </div>
                    <Switch checked={anonymous} onCheckedChange={setAnonymous} />
                  </div>
                )}

                {!isAuthenticated && (
                  <p className="text-xs text-neutral-400 text-center">
                    Submitting anonymously. Log in to optionally attach your account.
                  </p>
                )}

                <Button
                  className="w-full bg-primary hover:bg-primary-600"
                  onClick={handleSubmit}
                  disabled={sending || !message.trim() || rating === 0}
                >
                  {sending ? 'Sending...' : 'Submit Feedback'}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
