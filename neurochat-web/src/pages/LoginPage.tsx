import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Brain, Mail, Lock, User, Eye, EyeOff, ArrowRight, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { authApi } from '@/lib/api/auth'
import { toast } from 'sonner'

export function LoginPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) return
    if (mode === 'register' && !displayName) return

    setLoading(true)
    try {
      const data = mode === 'login'
        ? await authApi.login(email, password)
        : await authApi.register(email, password, displayName)

      localStorage.setItem('auth_token', data.token)
      localStorage.setItem('neurochat_user', JSON.stringify(data.user))
      toast.success(mode === 'login' ? 'Welcome back!' : 'Account created!')
      navigate(data.user.onboardingCompleted === false ? '/onboarding' : '/messages')
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-neural flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-secondary/5 rounded-full blur-3xl animate-float-slow" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/3 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10 animate-scale-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-4 glow-primary">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">NeuroChat</h1>
          <p className="text-sm text-muted-foreground mt-1">A calmer way to connect</p>
        </div>

        {/* Card */}
        <div className="glass-heavy rounded-2xl p-6 border border-border/50 glow-sm">
          {/* Mode toggle */}
          <div className="flex rounded-xl bg-muted/30 p-1 mb-6">
            <button
              onClick={() => setMode('login')}
              className={cn(
                'flex-1 py-2 rounded-lg text-sm font-medium transition-all',
                mode === 'login' ? 'bg-primary text-primary-foreground glow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Sign in
            </button>
            <button
              onClick={() => setMode('register')}
              className={cn(
                'flex-1 py-2 rounded-lg text-sm font-medium transition-all',
                mode === 'register' ? 'bg-primary text-primary-foreground glow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Create account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Display name (register only) */}
            {mode === 'register' && (
              <div className="space-y-1.5 animate-slide-up">
                <label className="text-xs font-medium text-muted-foreground">Display name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                  <input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="How should we call you?"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-muted/40 glass text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-muted/40 glass text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'register' ? 'At least 6 characters' : 'Your password'}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-muted/40 glass text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !email || !password || (mode === 'register' && !displayName)}
              className={cn(
                'w-full py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all',
                'bg-gradient-to-r from-primary to-primary/90 text-primary-foreground glow-primary',
                'hover:brightness-110 active:scale-[0.98]',
                'disabled:opacity-50 disabled:pointer-events-none'
              )}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <>
                  {mode === 'login' ? 'Sign in' : 'Create account'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Demo hint */}
          <div className="mt-4 pt-4 border-t border-border/30">
            <div className="flex items-start gap-2 p-2.5 rounded-xl bg-primary/5">
              <Sparkles className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                <span className="font-medium text-foreground">Demo account: </span>
                alex@neurochat.dev / password123
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-muted-foreground/50 mt-6">
          Built for neurodivergent minds, with care.
        </p>
      </div>
    </div>
  )
}
