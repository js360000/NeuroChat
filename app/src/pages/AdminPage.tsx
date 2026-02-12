import { useEffect, useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  BarChart3, 
  Users, 
  CreditCard, 
  Settings, 
  LogOut,
  Shield,
  FileText,
  Loader2,
  Workflow,
  Server,
  ScrollText,
  ShieldCheck,
  MessageSquareQuote,
  Activity,
  Calendar,
  FlaskConical,
  AlertTriangle,
  Inbox,
  Camera,
  DollarSign,
  MessageSquare,
  ScanLine
} from 'lucide-react';
import { adminApi, type DashboardStats } from '@/lib/api/admin';
import { useAuthStore } from '@/lib/stores/auth';
import { toast } from 'sonner';

// Admin sub-pages
import { AdminOverview } from './admin/Overview';
import { AdminUsers } from './admin/Users';
import { AdminPayments } from './admin/Payments';
import { AdminSettings } from './admin/Settings';
import { AdminModeration } from './admin/Moderation';
import { AdminContent } from './admin/Content';
import { AdminAutomation } from './admin/Automation';
import { AdminEnvironment } from './admin/Environment';
import { AdminPages } from './admin/Pages';
import { AdminCompliance } from './admin/Compliance';
import { AdminTestimonials } from './admin/Testimonials';
import { AdminExperience } from './admin/Experience';
import { AdminDigest } from './admin/Digest';
import { AdminContentCalendar } from './admin/ContentCalendar';
import { AdminExperiments } from './admin/Experiments';
import { AdminAnomalies } from './admin/Anomalies';
import { AdminVerifications } from './admin/Verifications';
import { AdminAdvertising } from './admin/Advertising';
import { AdminFeedback } from './admin/Feedback';
import { AdminChangelog } from './admin/Changelog';
import { AdminAgeVerification } from './admin/AgeVerification';

export function AdminPage() {
  const location = useLocation();
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await adminApi.getOverview();
      setStats(response);
    } catch (error) {
      toast.error('Failed to load admin data');
    } finally {
      setIsLoading(false);
    }
  };

  const navItems = [
    { path: '/admin', label: 'Overview', icon: BarChart3 },
    { path: '/admin/users', label: 'Users', icon: Users },
    { path: '/admin/payments', label: 'Payments', icon: CreditCard },
    { path: '/admin/moderation', label: 'Moderation', icon: Shield },
    { path: '/admin/content', label: 'Content', icon: FileText },
    { path: '/admin/testimonials', label: 'Testimonials', icon: MessageSquareQuote },
    { path: '/admin/pages', label: 'Pages', icon: ScrollText },
    { path: '/admin/compliance', label: 'Compliance', icon: ShieldCheck },
    { path: '/admin/experience', label: 'Experience', icon: Activity },
    { path: '/admin/digest', label: 'Digest Queue', icon: Inbox },
    { path: '/admin/calendar', label: 'Content Calendar', icon: Calendar },
    { path: '/admin/experiments', label: 'Experiments', icon: FlaskConical },
    { path: '/admin/anomalies', label: 'Anomalies', icon: AlertTriangle },
    { path: '/admin/verifications', label: 'Verifications', icon: Camera },
    { path: '/admin/feedback', label: 'Feedback', icon: MessageSquare },
    { path: '/admin/changelog', label: 'Changelog', icon: ScrollText },
    { path: '/admin/age-verification', label: 'Age Verification', icon: ScanLine },
    { path: '/admin/advertising', label: 'Advertising', icon: DollarSign },
    { path: '/admin/automation', label: 'Automation', icon: Workflow },
    { path: '/admin/environment', label: 'Environment', icon: Server },
    { path: '/admin/settings', label: 'Settings', icon: Settings },
  ];

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-lg font-semibold">Admin access required</p>
          <p className="text-sm text-neutral-500">You do not have permission to view this page.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-neutral-200 flex-shrink-0">
        <div className="p-4 border-b border-neutral-200">
          <Link to="/dashboard" className="flex items-center gap-2">
            <span className="text-xl font-bold">NeuroNest</span>
            <span className="text-xs bg-primary text-white px-2 py-0.5 rounded">Admin</span>
          </Link>
        </div>

        <nav className="p-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                location.pathname === item.path
                  ? 'bg-primary/10 text-primary'
                  : 'text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-neutral-200">
          <Link
            to="/dashboard"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-neutral-600 hover:bg-neutral-50"
          >
            <LogOut className="w-5 h-5" />
            Exit Admin
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Routes>
          <Route path="/" element={<AdminOverview stats={stats} />} />
          <Route path="/users" element={<AdminUsers />} />
          <Route path="/payments" element={<AdminPayments />} />
          <Route path="/moderation" element={<AdminModeration />} />
          <Route path="/content" element={<AdminContent />} />
          <Route path="/pages" element={<AdminPages />} />
          <Route path="/testimonials" element={<AdminTestimonials />} />
          <Route path="/experience" element={<AdminExperience />} />
          <Route path="/digest" element={<AdminDigest />} />
          <Route path="/calendar" element={<AdminContentCalendar />} />
          <Route path="/experiments" element={<AdminExperiments />} />
          <Route path="/anomalies" element={<AdminAnomalies />} />
          <Route path="/verifications" element={<AdminVerifications />} />
          <Route path="/compliance" element={<AdminCompliance />} />
          <Route path="/feedback" element={<AdminFeedback />} />
          <Route path="/changelog" element={<AdminChangelog />} />
          <Route path="/age-verification" element={<AdminAgeVerification />} />
          <Route path="/advertising" element={<AdminAdvertising />} />
          <Route path="/automation" element={<AdminAutomation />} />
          <Route path="/environment" element={<AdminEnvironment />} />
          <Route path="/settings" element={<AdminSettings />} />
        </Routes>
      </main>
    </div>
  );
}
