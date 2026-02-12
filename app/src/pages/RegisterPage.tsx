import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Check, X, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/lib/stores/auth';
import { consentApi } from '@/lib/api/consent';

function getPasswordStrength(password: string) {
  const checks = [
    { label: '8+ characters', met: password.length >= 8 },
    { label: 'Uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'Lowercase letter', met: /[a-z]/.test(password) },
    { label: 'Number', met: /\d/.test(password) },
  ];
  const score = checks.filter((c) => c.met).length;
  const level = score <= 1 ? 'weak' : score <= 2 ? 'fair' : score <= 3 ? 'good' : 'strong';
  const colors = { weak: 'bg-red-500', fair: 'bg-orange-400', good: 'bg-yellow-400', strong: 'bg-emerald-500' };
  return { checks, score, level, color: colors[level] };
}

export function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [healthConsent, setHealthConsent] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const { register, error, clearError } = useAuthStore();
  const navigate = useNavigate();
  const strength = useMemo(() => getPasswordStrength(password), [password]);
  const allConsentsGiven = ageConfirmed && healthConsent && termsAccepted;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setIsLoading(true);

    try {
      await register({ email, password, name });
      consentApi.logConsent({
        analytics: false,
        marketing: false,
        version: '2.0',
        healthDataConsent: true
      }).catch(() => {});
      navigate('/dashboard');
    } catch (error) {
      // Error is handled by the store
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">Create an account</CardTitle>
        <CardDescription className="text-center">
          Join NeuroNest and find your people
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {password.length > 0 && (
              <div className="space-y-2 pt-1">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={cn(
                        'h-1.5 flex-1 rounded-full transition-colors',
                        i <= strength.score ? strength.color : 'bg-neutral-200'
                      )}
                    />
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                  {strength.checks.map((check) => (
                    <div key={check.label} className="flex items-center gap-1.5 text-xs">
                      {check.met ? (
                        <Check className="w-3 h-3 text-emerald-500" />
                      ) : (
                        <X className="w-3 h-3 text-neutral-300" />
                      )}
                      <span className={check.met ? 'text-emerald-600' : 'text-neutral-400'}>
                        {check.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold">Privacy & Consent</span>
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={ageConfirmed}
                onChange={(e) => setAgeConfirmed(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-border accent-primary"
              />
              <span className="text-xs text-muted-foreground leading-relaxed">
                I confirm I am at least <strong>16 years old</strong> (or 13 with parental consent where applicable).
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={healthConsent}
                onChange={(e) => setHealthConsent(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-border accent-primary"
              />
              <span className="text-xs text-muted-foreground leading-relaxed">
                I consent to the processing of my <strong>health-related data</strong> (e.g. neurodivergent traits)
                as special category data under GDPR Art. 9(2)(a) for the purpose of matchmaking.
                This data is encrypted and never sold to third parties.
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-border accent-primary"
              />
              <span className="text-xs text-muted-foreground leading-relaxed">
                I agree to the{' '}
                <Link to="/terms" className="text-primary hover:underline font-medium" target="_blank">Terms of Service</Link>
                {' '}and{' '}
                <Link to="/privacy" className="text-primary hover:underline font-medium" target="_blank">Privacy Policy</Link>.
                I understand I can withdraw consent and delete my data at any time from Settings.
              </span>
            </label>
          </div>

          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary-600"
            disabled={isLoading || !allConsentsGiven}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating account...
              </>
            ) : (
              'Create Account'
            )}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm">
          Already have an account?{' '}
          <Link to="/login" className="text-primary hover:underline font-medium">
            Sign in
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
