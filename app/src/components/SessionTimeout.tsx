import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/lib/stores/auth';
import { Shield, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

const IDLE_LIMIT_MS = 15 * 60 * 1000; // 15 minutes
const WARNING_BEFORE_MS = 2 * 60 * 1000; // Show warning 2 min before lock

export function SessionTimeout() {
  const { isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(120);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleLock = useCallback(async () => {
    setShowWarning(false);
    await logout();
    navigate('/login', { state: { reason: 'session_timeout' } });
  }, [logout, navigate]);

  const resetTimers = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    setShowWarning(false);
    setCountdown(120);

    warningTimerRef.current = setTimeout(() => {
      setShowWarning(true);
      setCountdown(Math.floor(WARNING_BEFORE_MS / 1000));
      countdownRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            if (countdownRef.current) clearInterval(countdownRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, IDLE_LIMIT_MS - WARNING_BEFORE_MS);

    timerRef.current = setTimeout(handleLock, IDLE_LIMIT_MS);
  }, [handleLock]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'];
    const onActivity = () => resetTimers();

    events.forEach((evt) => window.addEventListener(evt, onActivity, { passive: true }));
    resetTimers();

    return () => {
      events.forEach((evt) => window.removeEventListener(evt, onActivity));
      if (timerRef.current) clearTimeout(timerRef.current);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [isAuthenticated, resetTimers]);

  if (!showWarning || !isAuthenticated) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="mx-4 max-w-sm w-full rounded-2xl bg-background border border-border p-6 shadow-card space-y-4 text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
          <Shield className="w-6 h-6 text-amber-600" />
        </div>
        <h2 className="text-lg font-bold">Session Expiring</h2>
        <p className="text-sm text-muted-foreground">
          For your security, your session will end in{' '}
          <strong className="text-foreground">{countdown}s</strong> due to inactivity.
          This protects your health data per HIPAA guidelines.
        </p>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={handleLock}>
            <LogOut className="w-4 h-4 mr-2" />
            Log out now
          </Button>
          <Button onClick={resetTimers}>
            Stay signed in
          </Button>
        </div>
      </div>
    </div>
  );
}
