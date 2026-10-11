import { motion, AnimatePresence } from 'framer-motion';
import { Menu, Plus, Search, Bell, BellRing, BellOff } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Field';
import { ThemeSwitcher } from './ThemeSwitcher';
import { getNavItem } from '../lib/nav';
import type { ThemeId } from '../lib/theme';
import type { PermissionState } from '../lib/notifications';
import { cn } from '../lib/utils';

interface TopBarProps {
  activeTab: string;
  onOpenMobileNav: () => void;
  onQuickAdd: () => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  theme: ThemeId;
  onThemeChange: (id: ThemeId) => void;
  notificationPermission: PermissionState;
  onRequestNotifications: () => void;
  /** Opens Settings, where a blocked permission is explained in full. */
  onOpenNotificationSettings: () => void;
}

export function TopBar({
  activeTab,
  onOpenMobileNav,
  onQuickAdd,
  searchQuery,
  onSearchChange,
  theme,
  onThemeChange,
  notificationPermission,
  onRequestNotifications,
  onOpenNotificationSettings,
}: TopBarProps) {
  const nav = getNavItem(activeTab);
  const notificationsOn = notificationPermission === 'granted';
  const notificationsBlocked =
    notificationPermission === 'denied' || notificationPermission === 'unsupported';
  // Search only filters the dashboard feed, so it appears only where it acts.
  const showSearch = activeTab === 'dashboard';

  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  return (
    <header className="sticky top-0 z-30 shrink-0 px-3 pt-3 md:px-4 md:pt-4">
      <div
        className={cn(
          'rounded-2xl border border-line bg-elevated/85 shadow-soft',
          'backdrop-blur-xl backdrop-saturate-150',
        )}
      >
        <div className="flex h-16 items-center gap-3 px-3 sm:px-4">
          {/* Identity ------------------------------------------------- */}
          <button
            type="button"
            onClick={onOpenMobileNav}
            aria-label="Open navigation"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted hover:text-ink hover:bg-accent-soft transition-colors cursor-pointer lg:hidden"
          >
            <Menu className="h-[18px] w-[18px]" strokeWidth={1.75} />
          </button>

          <div className="min-w-0 flex-1 lg:flex-none">
            <h1 className="truncate text-[15px] font-semibold leading-tight text-ink">
              {nav.name}
            </h1>
            <p className="hidden truncate text-xs text-faint sm:block">
              {nav.description}
            </p>
          </div>

          {/* Search --------------------------------------------------- */}
          <div className="hidden flex-1 justify-center px-2 lg:flex">
            <AnimatePresence mode="wait" initial={false}>
              {showSearch && (
                <motion.div
                  key="search"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="w-full max-w-md"
                >
                  <Input
                    type="search"
                    icon={Search}
                    aria-label="Search tasks"
                    placeholder="Search tasks…"
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="h-9 bg-surface-2/60"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Actions -------------------------------------------------- */}
          <div className="flex shrink-0 items-center gap-2">
            <span className="ds-numeric hidden items-center rounded-lg border border-line bg-surface-2 px-3 py-1.5 text-xs font-medium text-muted xl:inline-flex">
              {today}
            </span>

            <ThemeSwitcher theme={theme} onChange={onThemeChange} />

            {/* A blocked permission can't be re-requested from the page, so the
                button routes to Settings and explains itself instead of
                silently doing nothing. */}
            <button
              type="button"
              onClick={
                notificationsOn
                  ? undefined
                  : notificationsBlocked
                    ? onOpenNotificationSettings
                    : onRequestNotifications
              }
              disabled={notificationsOn}
              aria-label={
                notificationsOn
                  ? 'Task reminders are enabled'
                  : notificationsBlocked
                    ? 'Notifications are blocked — open settings'
                    : 'Enable task reminders'
              }
              title={
                notificationsOn
                  ? 'Reminders enabled'
                  : notificationsBlocked
                    ? 'Notifications blocked — see Settings'
                    : 'Enable desktop reminders'
              }
              className={cn(
                'relative flex h-9 w-9 items-center justify-center rounded-lg transition-colors duration-200',
                notificationsOn
                  ? 'text-faint cursor-default'
                  : 'text-muted hover:text-ink hover:bg-accent-soft cursor-pointer',
              )}
            >
              {notificationsOn ? (
                <Bell className="h-[18px] w-[18px]" strokeWidth={1.75} />
              ) : notificationsBlocked ? (
                <>
                  <BellOff className="h-[18px] w-[18px]" strokeWidth={1.75} />
                  <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-warning ring-2 ring-elevated" />
                </>
              ) : (
                <>
                  <BellRing className="h-[18px] w-[18px]" strokeWidth={1.75} />
                  <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-accent ring-2 ring-elevated" />
                </>
              )}
            </button>

            <Button
              variant="primary"
              size="md"
              onClick={onQuickAdd}
              className="hidden sm:inline-flex"
            >
              <Plus className="h-4 w-4" strokeWidth={2.25} />
              <span>New task</span>
            </Button>

            <Button
              variant="primary"
              size="icon"
              onClick={onQuickAdd}
              aria-label="New task"
              className="h-9 w-9 sm:hidden"
            >
              <Plus className="h-4 w-4" strokeWidth={2.25} />
            </Button>
          </div>
        </div>

        {/* Search drops to its own row on small screens. */}
        {showSearch && (
          <div className="border-t border-line px-3 py-2.5 lg:hidden">
            <Input
              type="search"
              icon={Search}
              aria-label="Search tasks"
              placeholder="Search tasks…"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="h-9"
            />
          </div>
        )}
      </div>
    </header>
  );
}
