import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isQuietHoursActive(quietHours?: { enabled: boolean; start: string; end: string }) {
  if (!quietHours?.enabled) return false;
  const now = new Date();
  const [startH, startM] = quietHours.start.split(':').map(Number);
  const [endH, endM] = quietHours.end.split(':').map(Number);
  if (Number.isNaN(startH) || Number.isNaN(endH)) return false;
  const start = new Date();
  start.setHours(startH, startM || 0, 0, 0);
  const end = new Date();
  end.setHours(endH, endM || 0, 0, 0);
  if (start <= end) {
    return now >= start && now <= end;
  }
  return now >= start || now <= end;
}

export function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
