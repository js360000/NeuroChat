import { Component, Suspense, lazy, useEffect, type ReactNode } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'
import { BottomNav } from './components/BottomNav'
import { SensoryBreakReminder } from './components/SensoryBreakReminder'
import { StimWidget } from './components/StimWidget'
import { useA11yStore } from './stores/a11yStore'
import { registerServiceWorker } from './lib/notifications'

// ═══════════════════════════════════════════
// Lazy-loaded pages (code-split per route)
// ═══════════════════════════════════════════
const MessagesPage = lazy(() => import('./pages/MessagesPage').then(m => ({ default: m.MessagesPage })))
const SettingsPage = lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })))
const AccessibilityPage = lazy(() => import('./pages/AccessibilityPage').then(m => ({ default: m.AccessibilityPage })))
const PrivacyPage = lazy(() => import('./pages/PrivacyPage').then(m => ({ default: m.PrivacyPage })))
const NotificationsPage = lazy(() => import('./pages/NotificationsPage').then(m => ({ default: m.NotificationsPage })))
const ProfilePage = lazy(() => import('./pages/ProfilePage').then(m => ({ default: m.ProfilePage })))
const DiscoverPage = lazy(() => import('./pages/DiscoverPage').then(m => ({ default: m.DiscoverPage })))
const CommunityPage = lazy(() => import('./pages/CommunityPage').then(m => ({ default: m.CommunityPage })))
const LandingPage = lazy(() => import('./pages/LandingPage').then(m => ({ default: m.LandingPage })))
const AboutPage = lazy(() => import('./pages/AboutPage').then(m => ({ default: m.AboutPage })))
const SafetyPage = lazy(() => import('./pages/SafetyPage').then(m => ({ default: m.SafetyPage })))
const GamesPage = lazy(() => import('./pages/GamesPage').then(m => ({ default: m.GamesPage })))
const EnergySettingsPage = lazy(() => import('./pages/EnergySettingsPage').then(m => ({ default: m.EnergySettingsPage })))
const ChatPrefsPage = lazy(() => import('./pages/ChatPrefsPage').then(m => ({ default: m.ChatPrefsPage })))
const AISettingsPage = lazy(() => import('./pages/AISettingsPage').then(m => ({ default: m.AISettingsPage })))
const AdminPage = lazy(() => import('./pages/AdminPage').then(m => ({ default: m.AdminPage })))
const OnboardingPage = lazy(() => import('./pages/OnboardingPage').then(m => ({ default: m.OnboardingPage })))
const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })))
const AsyncSettingsPage = lazy(() => import('./pages/AsyncSettingsPage').then(m => ({ default: m.AsyncSettingsPage })))
const AACSettingsPage = lazy(() => import('./pages/AACSettingsPage').then(m => ({ default: m.AACSettingsPage })))
const TogetherRoomsPage = lazy(() => import('./pages/TogetherRoomsPage').then(m => ({ default: m.TogetherRoomsPage })))
const EnergyDashboardPage = lazy(() => import('./pages/EnergyDashboardPage').then(m => ({ default: m.EnergyDashboardPage })))
const VenueMapPage = lazy(() => import('./pages/VenueMapPage').then(m => ({ default: m.VenueMapPage })))
const GuardianAngelPage = lazy(() => import('./pages/GuardianAngelPage').then(m => ({ default: m.GuardianAngelPage })))
const SupporterDashboardPage = lazy(() => import('./pages/SupporterDashboardPage').then(m => ({ default: m.SupporterDashboardPage })))

// ═══════════════════════════════════════════
// Error Boundaries
// ═══════════════════════════════════════════

class ErrorBoundary extends Component<{ children: ReactNode; fallback?: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null }
  static getDerivedStateFromError(error: Error) { return { error } }
  render() {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-8">
          <div className="max-w-md text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-destructive/10 flex items-center justify-center">
              <span className="text-2xl">!</span>
            </div>
            <h2 className="text-lg font-semibold text-foreground">Something went wrong</h2>
            <p className="text-sm text-muted-foreground">{this.state.error.message}</p>
            <button
              onClick={() => { this.setState({ error: null }); window.location.href = '/' }}
              className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium"
            >
              Go home
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// Route-level error boundary with retry
class RouteErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null }
  static getDerivedStateFromError(error: Error) { return { error } }
  render() {
    if (this.state.error) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center p-8">
          <div className="max-w-sm text-center space-y-3 animate-fade-in">
            <div className="w-12 h-12 mx-auto rounded-xl bg-amber-500/10 flex items-center justify-center">
              <span className="text-xl">⚠</span>
            </div>
            <h3 className="text-base font-semibold">This page had an error</h3>
            <p className="text-xs text-muted-foreground">{this.state.error.message}</p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => this.setState({ error: null })}
                className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-medium"
              >
                Try again
              </button>
              <button
                onClick={() => window.history.back()}
                className="px-3 py-1.5 rounded-xl bg-muted text-muted-foreground text-xs font-medium"
              >
                Go back
              </button>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// ═══════════════════════════════════════════
// Loading fallback
// ═══════════════════════════════════════════

function PageLoader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center space-y-3 animate-fade-in">
        <div className="w-10 h-10 mx-auto rounded-xl bg-primary/10 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
        <p className="text-xs text-muted-foreground">Loading...</p>
      </div>
    </div>
  )
}

// Wrap a lazy page with Suspense + route error boundary
function LazyRoute({ element }: { element: React.ReactNode }) {
  return (
    <RouteErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        {element}
      </Suspense>
    </RouteErrorBoundary>
  )
}

// ═══════════════════════════════════════════
// App
// ═══════════════════════════════════════════

function App() {
  const applySettings = useA11yStore((state) => state.applySettings)

  useEffect(() => {
    applySettings()
  }, [applySettings])

  // Register service worker for push notifications
  useEffect(() => { registerServiceWorker() }, [])

  // Default to dark mode on first visit
  useEffect(() => {
    const stored = localStorage.getItem('neurochat-a11y')
    if (!stored) {
      document.documentElement.classList.add('dark')
    }
  }, [])

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <div className="min-h-screen bg-background text-foreground">
          <Routes>
            {/* Public pages */}
            <Route path="/" element={<LazyRoute element={<LandingPage />} />} />
            <Route path="/about" element={<LazyRoute element={<AboutPage />} />} />
            <Route path="/safety" element={<LazyRoute element={<SafetyPage />} />} />
            <Route path="/login" element={<LazyRoute element={<LoginPage />} />} />
            <Route path="/onboarding" element={<LazyRoute element={<OnboardingPage />} />} />
            {/* App pages */}
            <Route path="/messages" element={<LazyRoute element={<MessagesPage />} />} />
            <Route path="/messages/:conversationId" element={<LazyRoute element={<MessagesPage />} />} />
            <Route path="/community" element={<LazyRoute element={<CommunityPage />} />} />
            <Route path="/discover" element={<LazyRoute element={<DiscoverPage />} />} />
            <Route path="/profile" element={<LazyRoute element={<ProfilePage />} />} />
            <Route path="/settings" element={<LazyRoute element={<SettingsPage />} />} />
            <Route path="/settings/energy" element={<LazyRoute element={<EnergySettingsPage />} />} />
            <Route path="/settings/chat" element={<LazyRoute element={<ChatPrefsPage />} />} />
            <Route path="/settings/ai" element={<LazyRoute element={<AISettingsPage />} />} />
            <Route path="/settings/async" element={<LazyRoute element={<AsyncSettingsPage />} />} />
            <Route path="/settings/aac" element={<LazyRoute element={<AACSettingsPage />} />} />
            <Route path="/accessibility" element={<LazyRoute element={<AccessibilityPage />} />} />
            <Route path="/privacy" element={<LazyRoute element={<PrivacyPage />} />} />
            <Route path="/notifications" element={<LazyRoute element={<NotificationsPage />} />} />
            <Route path="/games" element={<LazyRoute element={<GamesPage />} />} />
            <Route path="/venues" element={<LazyRoute element={<VenueMapPage />} />} />
            <Route path="/together" element={<LazyRoute element={<TogetherRoomsPage />} />} />
            <Route path="/energy" element={<LazyRoute element={<EnergyDashboardPage />} />} />
            <Route path="/guardian-angel" element={<LazyRoute element={<GuardianAngelPage />} />} />
            <Route path="/supporters" element={<LazyRoute element={<SupporterDashboardPage />} />} />
            <Route path="/admin" element={<LazyRoute element={<AdminPage />} />} />
          </Routes>
          <BottomNav />
          <SensoryBreakReminder />
          <StimWidget />
          <Toaster
            position="top-center"
            toastOptions={{
              className: 'glass-heavy !rounded-xl !border-border/50 !text-sm',
            }}
          />
        </div>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App
