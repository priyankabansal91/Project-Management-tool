import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getInitials(name: string | null | undefined) {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function priorityColor(priority: string) {
  const map: Record<string, string> = {
    critical: 'bg-red-100 text-red-700 border-red-200',
    high: 'bg-orange-100 text-orange-700 border-orange-200',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    low: 'bg-green-100 text-green-700 border-green-200',
    none: 'bg-gray-100 text-gray-600 border-gray-200',
  };
  return map[priority] || map.none;
}

/** dd/mm/yyyy — used platform-wide */
export function formatDate(date: string | null | undefined) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/** dd/mm/yyyy HH:mm */
export function fmtDateTime(date: string | null | undefined) {
  if (!date) return '—';
  const d = new Date(date);
  return `${d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })} ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
}

/** Short label: "5 May" or "5 May 2025" */
export function fmtShortDate(date: string | Date, showYear = false) {
  const d = typeof date === 'string' ? new Date(date) : date;
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
  if (showYear) opts.year = 'numeric';
  return d.toLocaleDateString('en-GB', opts);
}

/** Business hours between two date strings (8h/day, Mon–Fri). Returns 0 if invalid or end < start. */
export function calcBusinessHours(startDate: string, dueDate: string): number {
  const start = new Date(startDate);
  const end = new Date(dueDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return 0;
  let days = 0;
  const cur = new Date(start);
  while (cur <= end) {
    const dow = cur.getDay();
    if (dow !== 0 && dow !== 6) days++;
    cur.setDate(cur.getDate() + 1);
  }
  return days * 8;
}

export function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
