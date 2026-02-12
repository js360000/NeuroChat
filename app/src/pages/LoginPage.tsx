import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Shield, Ban, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/lib/stores/auth';
import { ApiError } from '@/lib/api/client';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [banInfo, setBanInfo] = useState<{ reason: string; bannedAt: string | null; appealEmail: string; appealInstructions: string } | null>(null);
  const { login, error, clearError } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const sessionExpired = (location.state as any)?.reason === 'session_timeout';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setIsLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      if (err instanceof ApiError && err.data?.banned) {
        setBanInfo({
          reason: err.data.banReason || 'Your account has been suspended.',
          bannedAt: err.data.bannedAt || null,
          appealEmail: err.data.appealEmail || 'appeals@neuronest.app',
          appealInstructions: err.data.appealInstructions || 'Contact support to appeal.'
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (banInfo) {
    return (
      <Card className="max-w-md">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
            <Ban className="w-7 h-7 text-red-600" />
          </div>
          <CardTitle className="text-xl text-red-700">Account Banned</CardTitle>
          <CardDescription>
            Your access to NeuroNest has been suspended.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-red-50 border border-red-200 p-4 space-y-2">
            <p className="text-sm font-medium text-red-800">Reason:</p>
            <p className="text-sm text-red-700">{banInfo.reason}</p>
            {banInfo.bannedAt && (
              <p className="text-xs text-red-500 mt-2">Banned on: {new Date(banInfo.bannedAt).toLocaleDateString()}</p>
            )}
          </div>

          <div className="rounded-lg bg-neutral-50 border border-neutral-200 p-4 space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              How to Appeal
            </h3>
            <p className="text-sm text-neutral-600">{banInfo.appealInstructions}</p>
            <a
              href={`mailto:${banInfo.appealEmail}?subject=Ban Appeal - ${email}&body=I would like to appeal my account ban. My account email is ${email}.`}
              className="inline-flex items-center gap-2 text-sm text-primary hover:underline font-medium"
            >
              <Mail className="w-4 h-4" />
              {banInfo.appealEmail}
            </a>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => { setBanInfo(null); clearError(); }}
          >
            Back to Login
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">Welcome back</CardTitle>
        <CardDescription className="text-center">
          Sign in to your NeuroNest account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {sessionExpired && (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm flex items-center gap-2">
              <Shield className="w-4 h-4 flex-shrink-0" />
              Your session expired due to inactivity. Please sign in again.
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">
              {error}
            </div>
          )}

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
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary-600"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary hover:underline font-medium">
            Sign up
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
