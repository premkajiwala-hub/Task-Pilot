import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TriangleAlert } from 'lucide-react';

import { Sidebar, MobileNav } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { TaskModal } from './components/TaskModal';
import { DashboardView } from './components/views/DashboardView';
import { UpcomingView } from './components/views/UpcomingView';
import { CalendarView } from './components/views/CalendarView';
import { AnalyticsView } from './components/views/AnalyticsView';
import { SettingsView } from './components/views/SettingsView';
import { useTheme } from './lib/theme';
import { getLocalDateString, formatTimeTo12Hour } from './lib/dates';
import { groupUpcoming } from './lib/stats';
import {
  getPermission,
  requestPermission,
  showNotification,
  useTaskReminders,
  type PermissionState,
} from './lib/notifications';
import type { Task, TaskFormData } from './types';

// Same-origin and relative on purpose. In production FastAPI serves this app
// itself, and in dev Vite proxies /api to the backend — so the URL is correct
// whether you open the app at localhost, 127.0.0.1, or the machine's LAN IP
// from a phone. Nothing to edit by hand any more.
const API_BASE_URL = '/api/tasks';

const EASE = [0.22, 1, 0.36, 1] as const;

/** A pristine form. Kept as a factory so every open starts from a clean copy
 *  rather than sharing (and mutating) one object. */
const blankForm = (date: string): TaskFormData => ({
  title: '',
  description: '',
  category: 'Work',
  priority: 'medium',
  date,
  start_time: '09:00',
  end_time: '10:00',
  repeat: 'none',
  color: '#3b82f6',
});

export default function App() {
  // --- 1. Core State Hooks ---
  const [activeTab, setActiveTab] = useState('dashboard');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notificationPermission, setNotificationPermission] =
    useState<PermissionState>(getPermission);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentDate, setCurrentDate] = useState(new Date());

  // --- Presentation-only state (no bearing on task data) ---
  const { theme, setTheme } = useTheme();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Recomputed on every render from the clock, so anything scoped to "today"
  // rolls over on its own at midnight without a manual reset.
  const todayStr = getLocalDateString();

  const [dashboardDateStr, setDashboardDateStr] = useState<string>(getLocalDateString());
  const [focusedDateStr, setFocusedDateStr] = useState<string>(getLocalDateString());

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [formData, setFormData] = useState<TaskFormData>(() =>
    blankForm(getLocalDateString()),
  );

  // --- 2. PWA Service Worker Engine ---
  // Production registration is injected by vite-plugin-pwa at build time, so
  // there is nothing to do here but clean up after the old manual call.
  //
  // That call did `register('/sw.js')` on every load, including dev. Vite was
  // serving a stale Workbox worker out of `dev-dist/`, which then took control
  // of http://localhost:3000 and answered from a precache whose hashed assets
  // no longer existed — a blank page. Because worker scope is per-origin, the
  // same app opened by LAN IP was untouched, which is exactly the symptom.
  // Dev now actively evicts any worker still holding that origin.
  useEffect(() => {
    if (!import.meta.env.DEV || !('serviceWorker' in navigator)) return;

    navigator.serviceWorker
      .getRegistrations()
      .then(async (registrations) => {
        if (registrations.length === 0) return;
        await Promise.all(registrations.map((r) => r.unregister()));
        if ('caches' in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map((k) => caches.delete(k)));
        }
        console.info(
          '[TaskPilot] Removed %d stale service worker(s) and their caches. Reloading…',
          registrations.length,
        );
        window.location.reload();
      })
      .catch(() => {
        /* nothing registered, or the browser blocked the query */
      });
  }, []);

  // --- 3. System Notification Engine ---
  const requestNotificationAccess = useCallback(async () => {
    const permission = await requestPermission();
    setNotificationPermission(permission);
    if (permission === 'granted') {
      showNotification(
        'Reminders enabled',
        'TaskPilot will alert you when a task is due to start.',
        'taskpilot-welcome',
      );
    }
  }, []);

  const sendTestNotification = useCallback(() => {
    const delivered = showNotification(
      'TaskPilot test',
      'If you can see this, desktop reminders are working.',
      'taskpilot-test',
    );
    if (!delivered) {
      setNotificationPermission(getPermission());
    }
  }, []);

  // Re-read the permission when the tab regains focus: the user may have
  // changed it in browser settings while we were in the background.
  useEffect(() => {
    const sync = () => setNotificationPermission(getPermission());
    document.addEventListener('visibilitychange', sync);
    window.addEventListener('focus', sync);
    return () => {
      document.removeEventListener('visibilitychange', sync);
      window.removeEventListener('focus', sync);
    };
  }, []);

  // Reminder scheduler lives in lib/notifications.
  useTaskReminders(tasks, notificationPermission === 'granted');

  // ==========================================
  // 💾 DATABASE & BACKEND REST INTERFACE
  // ==========================================

  const fetchTasksFromBackend = useCallback(async () => {
    try {
      const response = await fetch(API_BASE_URL);
      if (!response.ok) throw new Error();
      const data = await response.json();

      const formattedTasks = data.map((t: Record<string, string>) => ({
        ...t,
        date: t.date.split('T')[0],
        start_time: t.start_time.substring(0, 5),
        end_time: t.end_time.substring(0, 5),
        repeat: t.repeat || 'none'
      }));
      setTasks(formattedTasks);
      setError(null);
    } catch {
      setError("Backend connection offline.");
    }
  }, []);

  useEffect(() => {
    fetchTasksFromBackend();
  }, [fetchTasksFromBackend]);

  // Light connectivity poll so the sidebar dot reflects reality even when the
  // user is idle. Cheap: one GET a minute against localhost.
  useEffect(() => {
    const interval = window.setInterval(fetchTasksFromBackend, 60_000);
    return () => window.clearInterval(interval);
  }, [fetchTasksFromBackend]);

  // Derived, not stored. The original kept this in state and synced it from an
  // effect, which cost an extra render pass on every task change and could
  // briefly render the previous day's list. Same ordering, same output.
  const selectedDateTasks = useMemo(
    () =>
      tasks
        .filter(t => t.date === focusedDateStr)
        .sort((a, b) => a.start_time.localeCompare(b.start_time)),
    [tasks, focusedDateStr],
  );

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const isEditing = editingTaskId !== null;
      const url = isEditing ? `${API_BASE_URL}/${editingTaskId}` : API_BASE_URL;
      const method = isEditing ? 'PUT' : 'POST';

      // ⏱️ Auto-sanitize any input variations seamlessly back into a clean 24h standard format string (HH:MM)
      const cleanTo24h = (timeStr: string) => {
        if (!timeStr) return "00:00";
        if (!timeStr.includes('AM') && !timeStr.includes('PM')) {
          return timeStr.substring(0, 5);
        }

        const textCleaned = timeStr.replace(/\s+/g, '').toUpperCase();
        const isPM = textCleaned.includes('PM');
        const digitsOnly = textCleaned.replace('AM', '').replace('PM', '');
        const [hoursStr, minutesStr] = digitsOnly.split(':');

        let hours = parseInt(hoursStr, 10);
        if (isPM && hours < 12) hours += 12;
        if (!isPM && hours === 12) hours = 0;

        const formattedH = hours < 10 ? `0${hours}` : hours;
        const formattedM = minutesStr ? minutesStr.substring(0, 2) : "00";
        return `${formattedH}:${formattedM}`;
      };

      const currentStatus = isEditing
        ? tasks.find(t => t.id === editingTaskId)?.is_completed || false
        : false;

      // Complete structured target validation payload schema
      const payload = {
        title: formData.title,
        description: formData.description || '',
        category: formData.category,
        priority: formData.priority,
        date: formData.date,
        start_time: cleanTo24h(formData.start_time),
        end_time: cleanTo24h(formData.end_time),
        repeat: formData.repeat,
        color: formData.color,
        is_completed: currentStatus
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        // Surface the server's actual complaint instead of a generic message.
        let detail = `${response.status} ${response.statusText}`;
        try {
          const body = await response.json();
          if (body?.detail) {
            detail = Array.isArray(body.detail)
              ? body.detail
                  .map((d: { loc?: string[]; msg?: string }) =>
                    `${d.loc?.slice(1).join('.') ?? 'field'}: ${d.msg}`)
                  .join('\n')
              : String(body.detail);
          }
        } catch {
          /* response had no JSON body */
        }
        throw new Error(detail);
      }

      await fetchTasksFromBackend();
      closeModal();
    } catch (err) {
      alert(
        `Could not save this task.\n\n${
          err instanceof Error ? err.message : 'The backend did not respond.'
        }`,
      );
    }
  };

  /**
   * Opening the composer always starts from a blank form. Previously the reset
   * only ran *after* a successful submit, so cancelling an edit — or closing
   * the dialog — left the next "New task" pre-filled with stale values.
   */
  const openCreateModal = useCallback(
    (prefillDate?: string) => {
      setEditingTaskId(null);
      setFormData(blankForm(prefillDate ?? dashboardDateStr ?? getLocalDateString()));
      setIsModalOpen(true);
    },
    [dashboardDateStr],
  );

  /** Quick-add from the top bar: honour whichever date the view is showing. */
  const openCreateForActiveView = useCallback(() => {
    if (activeTab === 'calendar') return openCreateModal(focusedDateStr);
    if (activeTab === 'dashboard') return openCreateModal(dashboardDateStr);
    return openCreateModal(getLocalDateString());
  }, [activeTab, focusedDateStr, dashboardDateStr, openCreateModal]);

  const openEditModal = (task: Task) => {
    setEditingTaskId(task.id);
    setFormData({
      title: task.title,
      description: task.description || '',
      category: task.category,
      priority: task.priority,
      date: task.date,
      start_time: task.start_time,
      end_time: task.end_time,
      repeat: task.repeat,
      color: task.color
    });
    setIsModalOpen(true);
  };

  const toggleTaskCompletion = async (task: Task) => {
    try {
      const response = await fetch(`${API_BASE_URL}/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_completed: !task.is_completed }),
      });
      if (!response.ok) throw new Error();
      await fetchTasksFromBackend();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteTask = async (id: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error();
      await fetchTasksFromBackend();
    } catch (err) {
      console.error(err);
    }
  };

  // Memoised: as a plain declaration this was a new function on every render,
  // which invalidated the modal's open/focus effect on each keystroke.
  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingTaskId(null);
  }, []);

  // --- Backup / restore -------------------------------------------------
  const exportBackup = useCallback(() => {
    const blob = new Blob([JSON.stringify(tasks, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `taskpilot-backup-${getLocalDateString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [tasks]);

  const importBackup = useCallback(
    async (file: File) => {
      try {
        const parsed = JSON.parse(await file.text());
        if (!Array.isArray(parsed)) throw new Error('Expected a list of tasks.');

        let imported = 0;
        for (const raw of parsed) {
          if (!raw?.title || !raw?.date) continue;
          const response = await fetch(API_BASE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: raw.title,
              description: raw.description || '',
              category: raw.category || 'Work',
              priority: raw.priority || 'medium',
              date: String(raw.date).split('T')[0],
              start_time: String(raw.start_time || '09:00').substring(0, 5),
              end_time: String(raw.end_time || '10:00').substring(0, 5),
              repeat: raw.repeat || 'none',
              color: raw.color || '#3b82f6',
            }),
          });
          if (response.ok) imported += 1;
        }

        await fetchTasksFromBackend();
        alert(`Restored ${imported} of ${parsed.length} task(s) from the backup.`);
      } catch (err) {
        alert(
          `Could not read that backup.\n\n${
            err instanceof Error ? err.message : 'Unknown error.'
          }`,
        );
      }
    },
    [fetchTasksFromBackend],
  );

  const dateScopedTasks = tasks.filter(t => t.date === dashboardDateStr);
  const totalTasks = dateScopedTasks.length;
  const completedTasks = dateScopedTasks.filter(t => t.is_completed).length;
  const pendingTasks = totalTasks - completedTasks;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const filteredTasks = dateScopedTasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    const matchesStatus = statusFilter === 'all' ||
                         (statusFilter === 'completed' ? task.is_completed : !task.is_completed);
    return matchesSearch && matchesPriority && matchesStatus;
  });

  const upcomingCount = useMemo(
    () => groupUpcoming(tasks, todayStr).reduce((sum, g) => sum + g.tasks.length, 0),
    [tasks, todayStr],
  );

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: days }, (_, i) => new Date(year, month, i + 1));
  };

  const currentMonthDays = getDaysInMonth(currentDate);
  const startDayOffset = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const isConnected = error === null;

  return (
    <div className="flex h-dvh overflow-hidden bg-canvas text-ink antialiased">

      {/* NAVIGATION */}
      <Sidebar
        activeTab={activeTab}
        onSelect={setActiveTab}
        collapsed={isSidebarCollapsed}
        onToggleCollapsed={() => setIsSidebarCollapsed(v => !v)}
        isConnected={isConnected}
      />

      <MobileNav
        open={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        activeTab={activeTab}
        onSelect={setActiveTab}
        isConnected={isConnected}
      />

      {/* WORKSPACE */}
      <main className="flex min-w-0 flex-1 flex-col">
        <TopBar
          activeTab={activeTab}
          onOpenMobileNav={() => setIsMobileMenuOpen(true)}
          onQuickAdd={openCreateForActiveView}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          theme={theme}
          onThemeChange={setTheme}
          notificationPermission={notificationPermission}
          onRequestNotifications={requestNotificationAccess}
          onOpenNotificationSettings={() => setActiveTab('settings')}
        />

        <div className="ds-scroll flex-1 overflow-y-auto px-3 pb-10 pt-5 md:px-4 md:pt-6">
          <div className="mx-auto w-full max-w-[1440px] space-y-5">

            {/* Connection status — surfaces the fetch error state. */}
            <AnimatePresence initial={false}>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.28, ease: EASE }}
                  role="status"
                  className="overflow-hidden"
                >
                  <div className="flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3 shadow-soft">
                    <TriangleAlert className="h-4 w-4 shrink-0 text-danger" strokeWidth={1.75} />
                    <p className="text-[13px] text-muted">
                      <span className="font-medium text-ink">{error}</span>{' '}
                      Changes cannot be saved until the API on port 8000 is reachable.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* VIEW ROUTER
                Keyed remount with an enter-only animation. `AnimatePresence
                mode="wait"` would hold the outgoing view for its exit before
                mounting the next one, which makes every nav click feel a beat
                slow — and leaves the app on the old view if the exit is ever
                interrupted (a backgrounded tab pauses the frame loop). */}
            <div key={activeTab}>
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: EASE }}
              >
                {activeTab === 'dashboard' && (
                  <DashboardView
                    dashboardDateStr={dashboardDateStr}
                    onDashboardDateChange={setDashboardDateStr}
                    priorityFilter={priorityFilter}
                    onPriorityFilterChange={setPriorityFilter}
                    statusFilter={statusFilter}
                    onStatusFilterChange={setStatusFilter}
                    searchQuery={searchQuery}
                    totalTasks={totalTasks}
                    pendingTasks={pendingTasks}
                    completedTasks={completedTasks}
                    completionRate={completionRate}
                    filteredTasks={filteredTasks}
                    formatTime={formatTimeTo12Hour}
                    onToggle={toggleTaskCompletion}
                    onEdit={openEditModal}
                    onDelete={deleteTask}
                    onQuickAdd={() => openCreateModal(dashboardDateStr)}
                  />
                )}

                {activeTab === 'upcoming' && (
                  <UpcomingView
                    tasks={tasks}
                    todayStr={todayStr}
                    formatTime={formatTimeTo12Hour}
                    onToggle={toggleTaskCompletion}
                    onEdit={openEditModal}
                    onDelete={deleteTask}
                    onQuickAdd={openCreateModal}
                  />
                )}

                {activeTab === 'calendar' && (
                  <CalendarView
                    currentDate={currentDate}
                    currentMonthDays={currentMonthDays}
                    startDayOffset={startDayOffset}
                    tasks={tasks}
                    focusedDateStr={focusedDateStr}
                    onFocusDate={setFocusedDateStr}
                    selectedDateTasks={selectedDateTasks}
                    getLocalDateString={getLocalDateString}
                    formatTime={formatTimeTo12Hour}
                    onPrevMonth={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}
                    onNextMonth={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}
                    onEdit={openEditModal}
                    onDelete={deleteTask}
                    onAddForDate={openCreateModal}
                  />
                )}

                {activeTab === 'analytics' && (
                  <AnalyticsView tasks={tasks} todayStr={todayStr} />
                )}

                {activeTab === 'settings' && (
                  <SettingsView
                    theme={theme}
                    onThemeChange={setTheme}
                    taskCount={tasks.length}
                    upcomingCount={upcomingCount}
                    notificationPermission={notificationPermission}
                    onRequestNotifications={requestNotificationAccess}
                    onTestNotification={sendTestNotification}
                    onNavigate={setActiveTab}
                    onExport={exportBackup}
                    onImport={importBackup}
                    isConnected={isConnected}
                  />
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </main>

      {/* OPERATIONAL CRUD SCHEMA SCHEDULER MODAL ANCHOR */}
      <TaskModal
        open={isModalOpen}
        isEditing={editingTaskId !== null}
        formData={formData}
        onFieldChange={(patch) => setFormData(prev => ({ ...prev, ...patch }))}
        onSubmit={handleFormSubmit}
        onClose={closeModal}
      />
    </div>
  );
}
