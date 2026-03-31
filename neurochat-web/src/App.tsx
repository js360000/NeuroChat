import { Component, useEffect, type ReactNode } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'
import { MessagesPage } from './pages/MessagesPage'
import { SettingsPage } from './pages/SettingsPage'
import { AccessibilityPage } from './pages/AccessibilityPage'
import { PrivacyPage } from './pages/PrivacyPage'
import { NotificationsPage } from './pages/NotificationsPage'
import { ProfilePage } from './pages/ProfilePage'
import { DiscoverPage } from './pages/DiscoverPage'
import { CommunityPage } from './pages/CommunityPage'
import { LandingPage } from './pages/LandingPage'
import { AboutPage } from './pages/AboutPage'
import { SafetyPage } from './pages/SafetyPage'
import { GamesPage } from './pages/GamesPage'
import { EnergySettingsPage } from './pages/EnergySettingsPage'
import { ChatPrefsPage } from './pages/ChatPrefsPage'
import { AISettingsPage } from './pages/AISettingsPage'
import { AdminPage } from './pages/AdminPage'
import { OnboardingPage } from './pages/OnboardingPage'
import { LoginPage } from './pages/LoginPage'
import { AsyncSettingsPage } from './pages/AsyncSettingsPage'
import { AACSettingsPage } from './pages/AACSettingsPage'
import { TogetherRoomsPage } from './pages/TogetherRoomsPage'
import { EnergyDashboardPage } from './pages/EnergyDashboardPage'
import { VenueMapPage } from './pages/VenueMapPage'
import { GuardianAngelPage } from './pages/GuardianAngelPage'
import { SupporterDashboardPage } from './pages/SupporterDashboardPage'
import { BottomNav } from './components/BottomNav'
import { SensoryBreakReminder } from './components/SensoryBreakReminder'
import { StimWidget } from './components/StimWidget'
import { useA11yStore } from './stores/a11yStore'

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null }
  static getDerivedStateFromError(error: Error) { return { error } }
  render() {
    if (this.state.error) {
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

function App() {
  const applySettings = useA11yStore((state) => state.applySettings)

  useEffect(() => {
    applySettings()
  }, [applySettings])

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
            <Route path="/" element={<LandingPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/safety" element={<SafetyPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/onboarding" element={<OnboardingPage />} />
            {/* App pages */}
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/messages/:conversationId" element={<MessagesPage />} />
            <Route path="/community" element={<CommunityPage />} />
            <Route path="/discover" element={<DiscoverPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/settings/energy" element={<EnergySettingsPage />} />
            <Route path="/settings/chat" element={<ChatPrefsPage />} />
            <Route path="/settings/ai" element={<AISettingsPage />} />
            <Route path="/settings/async" element={<AsyncSettingsPage />} />
            <Route path="/settings/aac" element={<AACSettingsPage />} />
            <Route path="/accessibility" element={<AccessibilityPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/games" element={<GamesPage />} />
            <Route path="/venues" element={<VenueMapPage />} />
            <Route path="/together" element={<TogetherRoomsPage />} />
            <Route path="/energy" element={<EnergyDashboardPage />} />
            <Route path="/guardian-angel" element={<GuardianAngelPage />} />
            <Route path="/supporters" element={<SupporterDashboardPage />} />
            <Route path="/admin" element={<AdminPage />} />
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
