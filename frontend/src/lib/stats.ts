import type { Task } from '../types';
import {
  addDays,
  daysBetween,
  durationMinutes,
  getLocalDateString,
  parseLocalDate,
} from './dates';

/* ------------------------------------------------------------------ */
/* Daily snapshot — everything here is scoped to a single calendar day */
/* ------------------------------------------------------------------ */

export interface DayStats {
  total: number;
  completed: number;
  pending: number;
  rate: number;
  focusMinutes: number;
  highTotal: number;
  highCompleted: number;
}

export function statsForDate(tasks: Task[], dateStr: string): DayStats {
  const scoped = tasks.filter((t) => t.date === dateStr);
  const completed = scoped.filter((t) => t.is_completed);

  const focusMinutes = completed.reduce(
    (sum, t) => sum + durationMinutes(t.start_time, t.end_time),
    0,
  );

  const high = scoped.filter((t) => t.priority === 'high');

  return {
    total: scoped.length,
    completed: completed.length,
    pending: scoped.length - completed.length,
    rate: scoped.length > 0 ? Math.round((completed.length / scoped.length) * 100) : 0,
    focusMinutes,
    highTotal: high.length,
    highCompleted: high.filter((t) => t.is_completed).length,
  };
}

export function velocityLabel(rate: number, total: number): string {
  if (total === 0) return 'Idle';
  if (rate >= 75) return 'High';
  if (rate >= 40) return 'Steady';
  return 'Building';
}

/* ------------------------------------------------------------------ */
/* Productivity trend                                                  */
/* ------------------------------------------------------------------ */

export type TrendRange = 'week' | 'month' | 'year';

export interface TrendPoint {
  key: string;
  label: string;
  fullLabel: string;
  total: number;
  completed: number;
  rate: number;
}

export function productivityTrend(tasks: Task[], range: TrendRange): TrendPoint[] {
  const today = new Date();

  if (range === 'year') {
    // Twelve calendar months, oldest first.
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(today.getFullYear(), today.getMonth() - (11 - i), 1);
      const prefix = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const scoped = tasks.filter((t) => t.date.startsWith(prefix));
      const completed = scoped.filter((t) => t.is_completed).length;
      return {
        key: prefix,
        label: d.toLocaleDateString(undefined, { month: 'narrow' }),
        fullLabel: d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }),
        total: scoped.length,
        completed,
        rate: scoped.length > 0 ? Math.round((completed / scoped.length) * 100) : 0,
      };
    });
  }

  const days = range === 'week' ? 7 : 30;
  return Array.from({ length: days }, (_, i) => {
    const d = addDays(today, -(days - 1 - i));
    const key = getLocalDateString(d);
    const scoped = tasks.filter((t) => t.date === key);
    const completed = scoped.filter((t) => t.is_completed).length;
    return {
      key,
      label:
        range === 'week'
          ? d.toLocaleDateString(undefined, { weekday: 'narrow' })
          : String(d.getDate()),
      fullLabel: d.toLocaleDateString(undefined, {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      }),
      total: scoped.length,
      completed,
      rate: scoped.length > 0 ? Math.round((completed / scoped.length) * 100) : 0,
    };
  });
}

/* ------------------------------------------------------------------ */
/* Scheduling streak + contribution heatmap                            */
/* ------------------------------------------------------------------ */

export interface HeatmapCell {
  date: string;
  count: number;
  /** 0–4, matching the five-step colour ramp. */
  level: number;
  /** Days outside the tracked window render as spacers. */
  inRange: boolean;
}

export interface StreakSummary {
  current: number;
  longest: number;
  activeDays: number;
  totalScheduled: number;
  /** Column-major: each entry is one week, Sunday → Saturday. */
  weeks: HeatmapCell[][];
  monthLabels: { index: number; label: string }[];
  busiestDay: { date: string; count: number } | null;
}

function levelFor(count: number, busiest: number): number {
  if (count <= 0) return 0;
  if (busiest <= 1) return 1;
  const ratio = count / busiest;
  if (ratio > 0.75) return 4;
  if (ratio > 0.5) return 3;
  if (ratio > 0.25) return 2;
  return 1;
}

/**
 * A day counts as "active" when at least one task is scheduled on it —
 * this measures scheduling consistency, not completion.
 */
export function schedulingStreak(tasks: Task[], weeksBack = 53): StreakSummary {
  const counts = new Map<string, number>();
  tasks.forEach((t) => counts.set(t.date, (counts.get(t.date) ?? 0) + 1));

  const todayStr = getLocalDateString();
  const today = parseLocalDate(todayStr);

  // Current streak: walk backwards from today. A day with nothing scheduled
  // *yet* today shouldn't break a run, so we allow today to be empty.
  let current = 0;
  for (let i = 0; ; i += 1) {
    const key = getLocalDateString(addDays(today, -i));
    if ((counts.get(key) ?? 0) > 0) {
      current += 1;
    } else if (i > 0) {
      break;
    }
    if (i > 3650) break;
  }

  // Longest streak across every day that has ever been scheduled.
  const activeSorted = [...counts.entries()]
    .filter(([, n]) => n > 0)
    .map(([d]) => d)
    .sort();

  let longest = 0;
  let run = 0;
  let previous: string | null = null;
  activeSorted.forEach((day) => {
    run = previous !== null && daysBetween(previous, day) === 1 ? run + 1 : 1;
    if (run > longest) longest = run;
    previous = day;
  });

  // Grid ends on the Saturday of the current week so columns stay aligned.
  const gridEnd = addDays(today, 6 - today.getDay());
  const gridStart = addDays(gridEnd, -(weeksBack * 7 - 1));
  const busiest = Math.max(0, ...counts.values());

  const weeks: HeatmapCell[][] = [];
  const monthLabels: { index: number; label: string }[] = [];
  let lastMonth = -1;

  for (let w = 0; w < weeksBack; w += 1) {
    const week: HeatmapCell[] = [];
    for (let d = 0; d < 7; d += 1) {
      const cellDate = addDays(gridStart, w * 7 + d);
      const key = getLocalDateString(cellDate);
      const count = counts.get(key) ?? 0;
      const inRange = cellDate <= today;
      week.push({ date: key, count, level: inRange ? levelFor(count, busiest) : 0, inRange });

      if (d === 0 && cellDate.getMonth() !== lastMonth && cellDate <= today) {
        lastMonth = cellDate.getMonth();
        monthLabels.push({
          index: w,
          label: cellDate.toLocaleDateString(undefined, { month: 'short' }),
        });
      }
    }
    weeks.push(week);
  }

  const busiestEntry = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];

  return {
    current,
    longest,
    activeDays: activeSorted.length,
    totalScheduled: tasks.length,
    weeks,
    monthLabels,
    busiestDay: busiestEntry ? { date: busiestEntry[0], count: busiestEntry[1] } : null,
  };
}

/* ------------------------------------------------------------------ */
/* Upcoming                                                            */
/* ------------------------------------------------------------------ */

export interface DayGroup {
  date: string;
  tasks: Task[];
}

/** Future days only (strictly after today), grouped and chronologically sorted. */
export function groupUpcoming(tasks: Task[], todayStr: string, limitDays = 60): DayGroup[] {
  const map = new Map<string, Task[]>();

  tasks.forEach((task) => {
    const delta = daysBetween(todayStr, task.date);
    if (delta <= 0 || delta > limitDays) return;
    const bucket = map.get(task.date) ?? [];
    bucket.push(task);
    map.set(task.date, bucket);
  });

  return [...map.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, list]) => ({
      date,
      tasks: list.sort((a, b) => a.start_time.localeCompare(b.start_time)),
    }));
}
