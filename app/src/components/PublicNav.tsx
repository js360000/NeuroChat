import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Heart, Menu, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AccessibilityControls } from '@/components/AccessibilityControls';
import { useSiteName } from '@/lib/stores/branding';
import { cn } from '@/lib/utils';

const NAV_LINKS = [
  { path: '/about', label: 'About' },
  { path: '/pricing', label: 'Pricing' },
  { path: '/games', label: 'Games' },
  { path: '/changelog', label: 'Changelog' },
];

const MORE_LINKS = [
  { path: '/blog', label: 'Blog' },
  { path: '/community', label: 'Community' },
  { path: '/compare/hiki', label: 'Hiki Alternative' },
  { path: '/contact', label: 'Contact' },
  { path: '/help', label: 'Help Centre' },
];

export function PublicNav() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-xl border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent-violet flex items-center justify-center">
              <Heart className="w-5 h-5 text-white fill-white" />
            </div>
            <span className="text-xl font-bold text-dark">{useSiteName()}</span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  'px-3 py-2 rounded-xl text-sm font-medium transition-colors',
                  isActive(link.path)
                    ? 'bg-primary/10 text-primary'
                    : 'text-neutral-600 hover:bg-neutral-100 hover:text-dark'
                )}
              >
                {link.label}
              </Link>
            ))}

            {/* More dropdown */}
            <div className="relative group">
              <button className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-medium text-neutral-600 hover:bg-neutral-100 transition-colors">
                More
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              <div className="absolute right-0 top-full mt-1 w-48 bg-popover rounded-xl shadow-card border border-border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <div className="p-1.5">
                  {MORE_LINKS.map((link) => (
                    <Link
                      key={link.path}
                      to={link.path}
                      className={cn(
                        'block px-3 py-2 rounded-lg text-sm transition-colors',
                        isActive(link.path)
                          ? 'text-primary bg-primary/5'
                          : 'text-neutral-600 hover:bg-neutral-50'
                      )}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <AccessibilityControls />
            <Link to="/login" className="hidden sm:block text-sm font-medium text-neutral-600 hover:text-dark transition-colors">
              Log in
            </Link>
            <Link to="/register">
              <Button size="sm" className="bg-primary hover:bg-primary-600">Get Started</Button>
            </Link>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-neutral-100 transition-colors"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background">
          <div className="px-4 py-3 space-y-1">
            {[...NAV_LINKS, ...MORE_LINKS].map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'block px-4 py-2.5 rounded-xl text-sm font-medium transition-colors',
                  isActive(link.path)
                    ? 'bg-primary/10 text-primary'
                    : 'text-neutral-600 hover:bg-neutral-50'
                )}
              >
                {link.label}
              </Link>
            ))}
            <hr className="my-2" />
            <Link
              to="/login"
              onClick={() => setMobileOpen(false)}
              className="block px-4 py-2.5 rounded-xl text-sm font-medium text-neutral-600 hover:bg-neutral-50"
            >
              Log in
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
