import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useSiteName } from '@/lib/stores/branding';

const PRODUCT_LINKS = [
  { path: '/games', label: 'Games' },
  { path: '/blog', label: 'Blog' },
  { path: '/community', label: 'Community' },
  { path: '/pricing', label: 'Pricing' },
  { path: '/compare/hiki', label: 'Hiki Alternative' },
];

const COMPANY_LINKS = [
  { path: '/about', label: 'About Us' },
  { path: '/contact', label: 'Contact' },
  { path: '/changelog', label: 'Changelog' },
  { path: '/help', label: 'Help Centre' },
];

const LEGAL_LINKS = [
  { path: '/terms', label: 'Terms of Service' },
  { path: '/privacy', label: 'Privacy Policy' },
  { path: '/accessibility', label: 'Accessibility' },
];

export function PublicFooter() {
  return (
    <footer className="bg-dark-300 text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent-violet flex items-center justify-center">
                <Heart className="w-4 h-4 text-white fill-white" />
              </div>
              <span className="text-lg font-bold">{useSiteName()}</span>
            </Link>
            <p className="text-sm text-neutral-400 leading-relaxed">
              A calmer, clearer space for friendship, dating, and community — built by neurodivergent people, for neurodivergent people.
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-sm font-semibold mb-4 text-white">Product</h3>
            <ul className="space-y-2.5">
              {PRODUCT_LINKS.map((link) => (
                <li key={link.path}>
                  <Link to={link.path} className="text-sm text-neutral-400 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm font-semibold mb-4 text-white">Company</h3>
            <ul className="space-y-2.5">
              {COMPANY_LINKS.map((link) => (
                <li key={link.path}>
                  <Link to={link.path} className="text-sm text-neutral-400 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold mb-4 text-white">Legal</h3>
            <ul className="space-y-2.5">
              {LEGAL_LINKS.map((link) => (
                <li key={link.path}>
                  <Link to={link.path} className="text-sm text-neutral-400 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-neutral-500 text-xs">
            &copy; {new Date().getFullYear()} {useSiteName()}. All rights reserved.
          </p>
          <p className="text-neutral-500 text-xs">
            Built with care for the neurodivergent community.
          </p>
        </div>
      </div>
    </footer>
  );
}
