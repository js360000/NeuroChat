import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Loader2 } from 'lucide-react';

// Layouts
import { MainLayout } from './layouts/MainLayout';
import { AuthLayout } from './layouts/AuthLayout';

// Pages – eagerly loaded (small / critical path)
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';

// Pages – lazy loaded for code splitting
const LandingPage = lazy(() => import('./pages/LandingPage').then((mod) => ({ default: mod.LandingPage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then((mod) => ({ default: mod.DashboardPage })));
const MessagesPage = lazy(() => import('./pages/MessagesPage').then((mod) => ({ default: mod.MessagesPage })));
const CommunityPage = lazy(() => import('./pages/CommunityPage').then((mod) => ({ default: mod.CommunityPage })));
const BlogPage = lazy(() => import('./pages/BlogPage').then((mod) => ({ default: mod.BlogPage })));
const BlogPostPage = lazy(() => import('./pages/BlogPostPage').then((mod) => ({ default: mod.BlogPostPage })));
const CompareHikiPage = lazy(() => import('./pages/CompareHikiPage').then((mod) => ({ default: mod.CompareHikiPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then((mod) => ({ default: mod.ProfilePage })));
const MatchesPage = lazy(() => import('./pages/MatchesPage').then((mod) => ({ default: mod.MatchesPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then((mod) => ({ default: mod.SettingsPage })));
const PricingPage = lazy(() => import('./pages/PricingPage').then((mod) => ({ default: mod.PricingPage })));
const HelpPage = lazy(() => import('./pages/HelpPage').then((mod) => ({ default: mod.HelpPage })));
const GamesPage = lazy(() => import('./pages/GamesPage').then((mod) => ({ default: mod.GamesPage })));
const AdminPage = lazy(() => import('./pages/AdminPage').then((mod) => ({ default: mod.AdminPage })));
const PaymentSuccessPage = lazy(() => import('./pages/PaymentSuccessPage').then((mod) => ({ default: mod.PaymentSuccessPage })));
const PaymentCancelPage = lazy(() => import('./pages/PaymentCancelPage').then((mod) => ({ default: mod.PaymentCancelPage })));
const OnboardingPage = lazy(() => import('./pages/OnboardingPage').then((mod) => ({ default: mod.OnboardingPage })));
const SandboxPage = lazy(() => import('./pages/SandboxPage').then((mod) => ({ default: mod.SandboxPage })));
const CompassPage = lazy(() => import('./pages/CompassPage').then((mod) => ({ default: mod.CompassPage })));
const AboutPage = lazy(() => import('./pages/AboutPage').then((mod) => ({ default: mod.AboutPage })));
const ContactPage = lazy(() => import('./pages/ContactPage').then((mod) => ({ default: mod.ContactPage })));
const TermsPage = lazy(() => import('./pages/TermsPage').then((mod) => ({ default: mod.TermsPage })));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage').then((mod) => ({ default: mod.PrivacyPage })));
const ChangelogPage = lazy(() => import('./pages/ChangelogPage').then((mod) => ({ default: mod.ChangelogPage })));
const AccessibilityPage = lazy(() => import('./pages/AccessibilityPage').then((mod) => ({ default: mod.AccessibilityPage })));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then((mod) => ({ default: mod.NotFoundPage })));
const UserProfilePage = lazy(() => import('./pages/UserProfilePage').then((mod) => ({ default: mod.UserProfilePage })));

// Stores
import { useAuthStore } from './lib/stores/auth';
import { applyA11ySettings, loadA11ySettings, saveA11ySettings } from './lib/a11y';
import { applyExperiencePreferences, DEFAULT_EXPERIENCE_PREFERENCES } from './lib/experience';
import { useMessagesStore } from './lib/stores/messages';
import { CookieConsent } from './components/CookieConsent';
import { PwaInstallPrompt } from './components/PwaInstallPrompt';
import { OfflineNotice } from './components/OfflineNotice';
import { SessionTimeout } from './components/SessionTimeout';
import { SosButton } from './components/SosButton';
import { FeedbackWidget } from './components/FeedbackWidget';
import { useConfigStore } from './lib/stores/config';
import { AgeVerificationGate } from './components/AgeVerificationGate';

// Components
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuthStore();
  const location = useLocation();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.onboarding && !user.onboarding.completed && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  if (location.pathname === '/onboarding' && user?.onboarding?.completed) {
    return <Navigate to="/dashboard" replace />;
  }

  // Skip age gate for onboarding and admin routes
  const skipAgeGate = location.pathname === '/onboarding' || location.pathname.startsWith('/admin') || user?.role === 'admin';
  if (skipAgeGate) {
    return <>{children}</>;
  }
  
  return <AgeVerificationGate>{children}</AgeVerificationGate>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuthStore();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (isAuthenticated) {
    if (user?.onboarding && !user.onboarding.completed) {
      return <Navigate to="/onboarding" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
}

function AppInitializer({ children }: { children: React.ReactNode }) {
  const { fetchUser, user, isAuthenticated } = useAuthStore();
  const fetchUnreadCount = useMessagesStore((s) => s.fetchUnreadCount);
  const fetchConfig = useConfigStore((s) => s.fetchConfig);
  
  useEffect(() => {
    fetchUser();
    fetchConfig();
    applyA11ySettings(loadA11ySettings());
  }, [fetchUser, fetchConfig]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, fetchUnreadCount]);

  useEffect(() => {
    applyExperiencePreferences(user?.experiencePreferences ?? DEFAULT_EXPERIENCE_PREFERENCES);
  }, [user?.experiencePreferences]);

  useEffect(() => {
    if (user?.accessibilityPreset) {
      const local = loadA11ySettings();
      // Theme is client-only (controlled by AccessibilityControls toggle);
      // never let the server preset overwrite it.
      const { theme: _serverTheme, ...serverPreset } = user.accessibilityPreset;
      const merged = { ...local, ...serverPreset };
      applyA11ySettings(merged);
      saveA11ySettings(merged);
    }
  }, [user?.accessibilityPreset]);
  
  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <AppInitializer>
        {/* Fixed overlays — kept OUTSIDE #app-content so body filter doesn't break position:fixed */}
        <Toaster position="top-right" richColors />
        <CookieConsent />
        <OfflineNotice />
        <PwaInstallPrompt />
        <SessionTimeout />
        <SosButton />
        <FeedbackWidget />

        {/* Main content wrapper — CSS filter (saturation, calm-mode) targets this div
            instead of <body> to avoid breaking position:fixed on overlays above */}
        <div id="app-content">
        <Suspense
          fallback={(
            <div className="min-h-screen flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}
        >
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/compare/hiki" element={<CompareHikiPage />} />
            <Route path="/games" element={<GamesPage />} />
            <Route path="/sandbox" element={<SandboxPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/changelog" element={<ChangelogPage />} />
            <Route path="/accessibility" element={<AccessibilityPage />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/blog/:slug" element={<BlogPostPage />} />
            
            {/* Auth Routes */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              } />
              <Route path="/register" element={
                <PublicRoute>
                  <RegisterPage />
                </PublicRoute>
              } />
            </Route>
            
            {/* Protected Routes */}
            <Route element={<MainLayout />}>
              <Route path="/onboarding" element={
                <ProtectedRoute>
                  <OnboardingPage />
                </ProtectedRoute>
              } />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              } />
              <Route path="/compass" element={
                <ProtectedRoute>
                  <CompassPage />
                </ProtectedRoute>
              } />
              <Route path="/messages" element={
                <ProtectedRoute>
                  <MessagesPage />
                </ProtectedRoute>
              } />
              <Route path="/messages/:conversationId" element={
                <ProtectedRoute>
                  <MessagesPage />
                </ProtectedRoute>
              } />
              <Route path="/community" element={
                <ProtectedRoute>
                  <CommunityPage />
                </ProtectedRoute>
              } />
              <Route path="/matches" element={
                <ProtectedRoute>
                  <MatchesPage />
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              } />
              <Route path="/settings" element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              } />
              <Route path="/pricing" element={
                <ProtectedRoute>
                  <PricingPage />
                </ProtectedRoute>
              } />
              <Route path="/help" element={
                <ProtectedRoute>
                  <HelpPage />
                </ProtectedRoute>
              } />
              <Route path="/payment/success" element={
                <ProtectedRoute>
                  <PaymentSuccessPage />
                </ProtectedRoute>
              } />
              <Route path="/payment/cancel" element={
                <ProtectedRoute>
                  <PaymentCancelPage />
                </ProtectedRoute>
              } />
              <Route path="/user/:id" element={
                <ProtectedRoute>
                  <UserProfilePage />
                </ProtectedRoute>
              } />
            </Route>
            
            {/* Admin Routes */}
            <Route path="/admin/*" element={
              <ProtectedRoute>
                <AdminPage />
              </ProtectedRoute>
            } />
            
            {/* Catch all */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
        </div>
      </AppInitializer>
    </BrowserRouter>
  );
}

export default App;
