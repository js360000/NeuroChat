import { Outlet } from 'react-router-dom';
import { Heart, Shield, MessageCircle, Sparkles } from 'lucide-react';

const TRUST_POINTS = [
  { icon: Shield, text: 'Safe, moderated community' },
  { icon: MessageCircle, text: 'Tone tags & calm messaging' },
  { icon: Sparkles, text: 'AI-powered communication help' },
];

export function AuthLayout() {
  return (
    <div className="min-h-screen flex">
      {/* Left panel — brand showcase (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-[45%] relative bg-gradient-to-br from-primary via-accent-indigo to-accent-violet overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-white/20 blur-3xl animate-float" />
          <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-white/10 blur-3xl animate-float-slow" />
        </div>

        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          <a href="/" className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Heart className="w-6 h-6 text-white fill-white" />
            </div>
            <span className="text-2xl font-bold">NeuroNest</span>
          </a>

          <div className="space-y-8 max-w-sm">
            <h2 className="text-3xl font-bold leading-tight">
              Connection without the guesswork.
            </h2>
            <p className="text-white/70 text-lg leading-relaxed">
              A calmer, clearer space for friendship, dating, and community — built by ND people, for ND people.
            </p>

            <div className="space-y-4">
              {TRUST_POINTS.map((point) => (
                <div key={point.text} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                    <point.icon className="w-4 h-4" />
                  </div>
                  <span className="text-sm text-white/80">{point.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center text-xs font-bold"
                >
                  {String.fromCharCode(64 + i)}
                </div>
              ))}
            </div>
            <p className="text-sm text-white/60">
              Join <span className="text-white font-semibold">10,000+</span> members
            </p>
          </div>
        </div>
      </div>

      {/* Right panel — auth form */}
      <div className="flex-1 bg-gradient-to-br from-primary/5 via-peach/20 to-background flex items-center justify-center p-6 sm:p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex justify-center mb-8 lg:hidden">
            <a href="/" className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent-violet flex items-center justify-center shadow-glow">
                <Heart className="w-6 h-6 text-white fill-white" />
              </div>
              <span className="text-2xl font-bold text-dark">NeuroNest</span>
            </a>
          </div>

          <Outlet />
        </div>
      </div>
    </div>
  );
}
