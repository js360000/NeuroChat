import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSiteName } from '@/lib/stores/branding';
import { 
  Heart, 
  MessageCircle, 
  User, 
  Settings, 
  Menu, 
  LogOut,
  Sparkles,
  Users,
  BookOpen,
  Gamepad2,
  Compass,
  LifeBuoy,
  MoreHorizontal,
  ChevronRight
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { EnergyMeter } from '@/components/EnergyMeter';
import { Sheet, SheetContent, SheetTitle, SheetDescription, SheetTrigger } from '@/components/ui/sheet';
import { useAuthStore } from '@/lib/stores/auth';
import { useMessagesStore } from '@/lib/stores/messages';
import { AccessibilityControls } from '@/components/AccessibilityControls';

export function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const unreadCount = useMessagesStore((s) => s.unreadCount);

  type NavItem = { path: string; label: string; icon: React.ComponentType<{ className?: string }>; badge?: number };

  const primaryNav: NavItem[] = [
    { path: '/compass', label: 'Compass', icon: Compass },
    { path: '/dashboard', label: 'Discover', icon: Sparkles },
    { path: '/matches', label: 'Matches', icon: Heart },
    { path: '/messages', label: 'Messages', icon: MessageCircle, badge: unreadCount },
    { path: '/community', label: 'Community', icon: Users },
  ];

  const secondaryNav: NavItem[] = [
    { path: '/blog', label: 'Blog', icon: BookOpen },
    { path: '/games', label: 'Games', icon: Gamepad2 },
    { path: '/help', label: 'Help', icon: LifeBuoy },
    { path: '/compare/hiki', label: 'Hiki Alternative', icon: Sparkles },
  ];

  const allNav = [...primaryNav, ...secondaryNav];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname.startsWith(path);
  const prefetchRoute = (path: string) => {
    if (path === '/games') {
      void import('../pages/GamesPage');
    }
    if (path.startsWith('/admin')) {
      void import('../pages/AdminPage');
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-xl border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent-violet flex items-center justify-center">
              <Heart className="w-5 h-5 text-white fill-white" />
            </div>
            <span className="text-xl font-bold text-dark hidden sm:block">{useSiteName()}</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {primaryNav.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`relative flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                  isActive(item.path)
                    ? 'bg-primary/10 text-primary'
                    : 'text-neutral-600 hover:bg-neutral-100'
                }`}
                onMouseEnter={() => prefetchRoute(item.path)}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
                {item.badge != null && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1 shadow-sm">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </Link>
            ))}
            {/* More dropdown */}
            <div className="relative group">
              <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-neutral-600 hover:bg-neutral-100 transition-colors">
                <MoreHorizontal className="w-4 h-4" />
                More
              </button>
              <div className="absolute right-0 top-full mt-2 w-48 bg-popover rounded-xl shadow-card border border-border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <div className="p-2">
                  {secondaryNav.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                        isActive(item.path)
                          ? 'text-primary bg-primary/5'
                          : 'text-neutral-600 hover:bg-neutral-50 dark:text-muted-foreground dark:hover:bg-muted'
                      }`}
                      onMouseEnter={() => prefetchRoute(item.path)}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-2">
            {/* Subscription Badge */}
            {user?.subscription?.plan !== 'free' && (
              <Badge className="hidden sm:flex bg-primary text-white">
                {user?.subscription?.plan === 'pro' ? 'Pro' : 'Premium'}
              </Badge>
            )}

            <AccessibilityControls />
            <EnergyMeter />

            {/* Profile Dropdown */}
            <div className="relative group">
              <button className="flex items-center gap-2 p-2 rounded-xl hover:bg-neutral-100 transition-colors">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={user?.avatar} />
                  <AvatarFallback>{user?.name?.[0] || 'U'}</AvatarFallback>
                </Avatar>
              </button>

              {/* Dropdown Menu */}
              <div className="absolute right-0 top-full mt-2 w-48 bg-popover rounded-xl shadow-card border border-border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                <div className="p-2">
                  <Link
                    to="/profile"
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-neutral-600 hover:bg-neutral-50 dark:text-muted-foreground dark:hover:bg-muted"
                  >
                    <User className="w-4 h-4" />
                    Profile
                  </Link>
                  <Link
                    to="/settings"
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-neutral-600 hover:bg-neutral-50 dark:text-muted-foreground dark:hover:bg-muted"
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </Link>
                  {user?.role === 'admin' && (
                    <Link
                      to="/admin"
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-primary hover:bg-primary/5"
                      onMouseEnter={() => prefetchRoute('/admin')}
                    >
                      <Sparkles className="w-4 h-4" />
                      Admin Panel
                    </Link>
                  )}
                  <hr className="my-2" />
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <button className="md:hidden p-2 rounded-lg hover:bg-neutral-100 transition-colors">
                  <Menu className="w-5 h-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] p-0">
                <SheetTitle className="sr-only">Navigation menu</SheetTitle>
                <SheetDescription className="sr-only">Main navigation links</SheetDescription>
                <div className="flex flex-col h-full">
                  {/* Sheet header */}
                  <div className="p-5 border-b border-border">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={user?.avatar} />
                        <AvatarFallback>{user?.name?.[0] || 'U'}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-sm">{user?.name || 'User'}</p>
                        <p className="text-xs text-muted-foreground">{user?.email}</p>
                      </div>
                    </div>
                  </div>

                  {/* Nav items */}
                  <div className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
                    {allNav.map((item) => (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                          isActive(item.path)
                            ? 'bg-primary/10 text-primary'
                            : 'text-foreground hover:bg-muted'
                        }`}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <item.icon className="w-5 h-5" />
                        {item.label}
                        {item.badge != null && item.badge > 0 && (
                          <span className="ml-auto min-w-[20px] h-5 flex items-center justify-center rounded-full bg-red-500 text-white text-[11px] font-bold px-1.5">
                            {item.badge > 99 ? '99+' : item.badge}
                          </span>
                        )}
                        {isActive(item.path) && !(item.badge != null && item.badge > 0) && <ChevronRight className="w-4 h-4 ml-auto" />}
                      </Link>
                    ))}
                  </div>

                  {/* Bottom actions */}
                  <div className="border-t border-border p-3 space-y-1">
                    <Link
                      to="/profile"
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-foreground hover:bg-muted transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <User className="w-5 h-5" />
                      Profile
                    </Link>
                    <Link
                      to="/settings"
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-foreground hover:bg-muted transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Settings className="w-5 h-5" />
                      Settings
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-5 h-5" />
                      Logout
                    </button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

    </nav>
  );
}
