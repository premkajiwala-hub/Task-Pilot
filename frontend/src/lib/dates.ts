/** Local-calendar date helpers. Everything here is timezone-safe: dates are
 *  treated as calendar days, never as UTC instants. */

/** YYYY-MM-DD for the given date in the *local* calendar. */
export function getLocalDateString(dateObj: Date = new Date()): string {
  const offset = dateObj.getTimezoneOffset();
  const localDate = new Date(dateObj.getTime() - offset * 60 * 1000);
  return localDate.toISOString().split('T')[0];
}

/** Parse a YYYY-MM-DD string as local midnight (not UTC). */
export function parseLocalDate(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00`);
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function startOfDay(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Whole days from `a` to `b`, both treated as calendar days. */
export function daysBetween(a: string, b: string): number {
  const ms = parseLocalDate(b).getTime() - parseLocalDate(a).getTime();
  return Math.round(ms / 86_400_000);
}

export function formatTimeTo12Hour(timeStr: string): string {
  if (!timeStr) return '';
  const [hoursStr, minutesStr] = timeStr.split(':');
  let hours = parseInt(hoursStr, 10);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const strHours = hours < 10 ? `0${hours}` : hours;
  return `${strHours}:${minutesStr} ${ampm}`;
}

/** "Today", "Tomorrow", "In 4 days", "Sat 9 Aug" — whichever reads best. */
export function relativeDayLabel(dateStr: string, todayStr: string): string {
  const delta = daysBetween(todayStr, dateStr);
  if (delta === 0) return 'Today';
  if (delta === 1) return 'Tomorrow';
  if (delta === -1) return 'Yesterday';
  if (delta > 1 && delta < 7) return `In ${delta} days`;
  return parseLocalDate(dateStr).toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

export function formatDayHeading(dateStr: string): string {
  return parseLocalDate(dateStr).toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

/** Minutes between two HH:MM strings; 0 when the range is invalid. */
export function durationMinutes(start: string, end: string): number {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  if ([sh, sm, eh, em].some(Number.isNaN)) return 0;
  const diff = eh * 60 + em - (sh * 60 + sm);
  return diff > 0 ? diff : 0;
}
