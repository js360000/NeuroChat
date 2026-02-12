import { Link } from 'react-router-dom';
import { Heart, ArrowLeft, Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PublicNav } from '@/components/PublicNav';

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-peach/20 to-primary/5">
      <PublicNav />
      <div className="min-h-screen flex items-center justify-center p-4 pt-20">
      <div className="max-w-lg w-full text-center space-y-8">
        <div className="relative mx-auto w-32 h-32">
          <div className="absolute inset-0 rounded-full bg-primary/10 animate-pulse" />
          <div className="absolute inset-4 rounded-full bg-primary/20 flex items-center justify-center">
            <Heart className="w-12 h-12 text-primary/40" />
          </div>
          <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-6xl font-bold text-primary/20 select-none">
            404
          </span>
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
            This page wandered off
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed max-w-md mx-auto">
            No worries — even the best explorers take a wrong turn sometimes.
            Let's get you back to somewhere safe.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/">
            <Button size="lg" className="bg-primary hover:bg-primary-600 gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
          </Link>
          <Link to="/dashboard">
            <Button size="lg" variant="outline" className="gap-2">
              <Compass className="w-4 h-4" />
              Go to Dashboard
            </Button>
          </Link>
        </div>

        <p className="text-sm text-muted-foreground">
          If you think this is a bug,{' '}
          <Link to="/contact" className="text-primary hover:underline font-medium">
            let us know
          </Link>
          .
        </p>
      </div>
      </div>
    </div>
  );
}
