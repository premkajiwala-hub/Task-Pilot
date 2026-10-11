import { useEffect, useRef } from 'react';
import type { Task } from '../types';

/**
 * Desktop reminder plumbing.
 *
 * Four things were wrong with the original implementation:
 *
 *  1. Once a user (or Chrome's auto-block) sets permission to "denied",
 *     `requestPermission()` resolves immediately as "denied" without ever
 *     showing a prompt. The button looked dead because nothing surfaced that
 *     state — callers now get the result back and can explain it.
 *  2. The due-check compared `start_time === HH:MM` on a 60s interval. The
 *     interval's phase is arbitrary and background tabs throttle timers, so a
 *     given minute could simply never be sampled and the reminder was lost.
 *     We now poll faster and match a *window*, with catch-up for throttling.
 *  3. Every notification reused one tag, so simultaneous tasks collapsed into
 *     a single banner. Tags are now per-task.
 *  4. `Notification` was touched unguarded, which throws where it is absent.
 */

export type PermissionState = NotificationPermission | 'unsupported';

export function isSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getPermission(): PermissionState {
  if (!isSupported()) return 'unsupported';
  return Notification.permission;
}

/**
 * Request permission, normalising the legacy callback form. Resolves with the
 * resulting state — importantly, "denied" comes back immediately when the
 * browser has already blocked notifications for this origin, which is the
 * case the UI needs to explain rather than silently swallow.
 */
export async function requestPermission(): Promise<PermissionState> {
  if (!isSupported()) return 'unsupported';
  try {
    // Safari < 16 only supports the callback signature.
    const result = await new Promise<NotificationPermission>((resolve) => {
      const maybePromise = Notification.requestPermission(resolve);
      if (maybePromise && typeof maybePromise.then === 'function') {
        maybePromise.then(resolve).catch(() => resolve(Notification.permission));
      }
    });
    return result ?? Notification.permission;
  } catch {
    return Notification.permission;
  }
}

export function showNotification(
  title: string,
  body: string,
  tag = `taskpilot-${Date.now()}`,
): boolean {
  if (!isSupported() || Notification.permission !== 'granted') return false;
  try {
    new Notification(title, { body, icon: '/pwa-192x192.png', tag });
    return true;
  } catch {
    // Some browsers require notifications to come from a service worker.
    return false;
  }
}

const CHECK_INTERVAL_MS = 15_000;
/** How far back a reminder may still fire, covering throttled timers. */
const CATCH_UP_MS = 3 * 60_000;

function localDateString(d: Date) {
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60_000).toISOString().split('T')[0];
}

function taskStartMs(task: Task): number | null {
  const [h, m] = task.start_time.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  const d = new Date(`${task.date}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  d.setHours(h, m, 0, 0);
  return d.getTime();
}

/**
 * Fires a reminder as each incomplete task reaches its start time.
 * Deduped per task+date+time so a reschedule re-arms but a re-render does not.
 */
export function useTaskReminders(tasks: Task[], enabled: boolean) {
  const firedRef = useRef<Set<string>>(new Set());
  const tasksRef = useRef(tasks);

  // Mirrored in an effect rather than during render: a render that React
  // discards must not mutate the ref, and the scheduler below only reads it
  // from a timer callback anyway.
  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  useEffect(() => {
    if (!enabled) return;

    const check = () => {
      const now = Date.now();
      const today = localDateString(new Date());

      tasksRef.current.forEach((task) => {
        if (task.is_completed || task.date !== today) return;

        const startsAt = taskStartMs(task);
        if (startsAt === null) return;

        const age = now - startsAt;
        if (age < 0 || age > CATCH_UP_MS) return;

        const key = `${task.id}:${task.date}:${task.start_time}`;
        if (firedRef.current.has(key)) return;
        firedRef.current.add(key);

        showNotification(
          `Starting now — ${task.title}`,
          task.description?.trim()
            ? task.description
            : `Scheduled ${task.start_time}–${task.end_time}`,
          `taskpilot-task-${task.id}`,
        );
      });
    };

    check();
    const interval = window.setInterval(check, CHECK_INTERVAL_MS);

    // A tab returning to the foreground may have missed several ticks.
    const onVisible = () => {
      if (document.visibilityState === 'visible') check();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [enabled]);
}
