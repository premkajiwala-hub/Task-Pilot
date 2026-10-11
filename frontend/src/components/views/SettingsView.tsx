import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Palette,
  BellRing,
  BellOff,
  Check,
  Download,
  Upload,
  CalendarRange,
  Database,
  Zap,
  ChevronRight,
  ShieldCheck,
  Wifi,
  WifiOff,
  TriangleAlert,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { THEMES, type ThemeId } from '../../lib/theme';
import type { PermissionState } from '../../lib/notifications';
import { cn } from '../../lib/utils';

/* ------------------------------------------------------------------ */
/* Compact row primitive — replaces the old full-width diagnostic cards */
/* ------------------------------------------------------------------ */

interface RowProps {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  description: string;
  action?: React.ReactNode;
  onClick?: () => void;
  tone?: 'default' | 'accent' | 'positive' | 'warning';
}

function SettingRow({
  icon: Icon,
  title,
  description,
  action,
  onClick,
  tone = 'default',
}: RowProps) {
  const interactive = typeof onClick === 'function';
  const Wrapper = (interactive ? 'button' : 'div') as 'button';

  return (
    <Wrapper
      {...(interactive ? { type: 'button', onClick } : {})}
      className={cn(
        'group flex w-full items-center gap-3.5 px-4 py-3 text-left',
        'transition-colors duration-200',
        interactive && 'cursor-pointer hover:bg-accent-soft/60',
      )}
    >
      <span
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border',
          tone === 'accent' ? 'border-accent-line bg-accent-soft' : 'border-line bg-surface-2',
        )}
      >
        <Icon
          className={cn(
            'h-4 w-4',
            tone === 'accent' && 'text-accent-text',
            tone === 'positive' && 'text-positive',
            tone === 'warning' && 'text-warning',
            tone === 'default' && 'text-muted',
          )}
          strokeWidth={1.75}
        />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13.5px] font-medium text-ink">{title}</span>
        <span className="mt-0.5 block text-[12px] leading-relaxed text-faint">
          {description}
        </span>
      </span>

      <span className="flex shrink-0 items-center gap-2">{action}</span>
    </Wrapper>
  );
}

function SettingGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="ds-eyebrow mb-2.5 px-1">{label}</h2>
      <Card padding="none" className="divide-y divide-line overflow-hidden">
        {children}
      </Card>
    </section>
  );
}

function Pill({
  children,
  tone = 'neutral',
}: {
  children: React.ReactNode;
  tone?: 'neutral' | 'positive' | 'warning';
}) {
  return (
    <span
      className={cn(
        'ds-numeric rounded-md border border-line bg-surface-2 px-2 py-1 text-[11px] font-medium',
        tone === 'positive' && 'text-positive',
        tone === 'warning' && 'text-warning',
        tone === 'neutral' && 'text-muted',
      )}
    >
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ */

export interface SettingsViewProps {
  theme: ThemeId;
  onThemeChange: (id: ThemeId) => void;
  taskCount: number;
  upcomingCount: number;
  notificationPermission: PermissionState;
  onRequestNotifications: () => void;
  onTestNotification: () => void;
  onNavigate: (tab: string) => void;
  onExport: () => void;
  onImport: (file: File) => void;
  isConnected: boolean;
}

export function SettingsView({
  theme,
  onThemeChange,
  taskCount,
  upcomingCount,
  notificationPermission,
  onRequestNotifications,
  onTestNotification,
  onNavigate,
  onExport,
  onImport,
  isConnected,
}: SettingsViewProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [importName, setImportName] = useState<string | null>(null);

  const notificationsOn = notificationPermission === 'granted';
  const notificationsBlocked = notificationPermission === 'denied';
  const notificationsUnsupported = notificationPermission === 'unsupported';

  const notificationCopy = notificationsUnsupported
    ? 'This browser does not support desktop notifications.'
    : notificationsBlocked
      ? 'Blocked for this site — the page cannot ask again.'
      : notificationsOn
        ? 'You get a desktop alert the moment a task is due to start.'
        : 'Allow desktop alerts when a task is due to start.';

  const chevron = (
    <ChevronRight
      className="h-4 w-4 text-faint transition-transform duration-200 group-hover:translate-x-0.5"
      strokeWidth={1.75}
    />
  );

  return (
    <div className="mx-auto w-full max-w-3xl space-y-7">
      {/* Appearance ------------------------------------------------- */}
      <section>
        <h2 className="ds-eyebrow mb-2.5 px-1">Appearance</h2>
        <Card padding="md">
          <div className="mb-4 flex items-center gap-2.5">
            <Palette className="h-4 w-4 text-accent-text" strokeWidth={1.75} />
            <p className="text-[13.5px] font-medium text-ink">Theme</p>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {THEMES.map((item) => {
              const isActive = theme === item.id;
              const [surface, accent] = item.swatch;

              return (
                <motion.button
                  key={item.id}
                  type="button"
                  onClick={() => onThemeChange(item.id)}
                  aria-pressed={isActive}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.985 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 32 }}
                  className={cn(
                    'group relative overflow-hidden rounded-xl border p-2.5 text-left',
                    'cursor-pointer transition-[border-color,box-shadow] duration-200',
                    isActive
                      ? 'border-accent-line shadow-lift'
                      : 'border-line hover:border-line-strong',
                  )}
                >
                  <div
                    className="relative flex h-14 w-full items-end gap-1.5 overflow-hidden rounded-lg p-2"
                    style={{ backgroundColor: surface }}
                  >
                    <span
                      className="h-2 flex-1 rounded-full"
                      style={{ backgroundColor: accent, opacity: 0.95 }}
                    />
                    <span
                      className="h-2 w-4 rounded-full"
                      style={{ backgroundColor: accent, opacity: 0.4 }}
                    />
                    {isActive && (
                      <span
                        className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full"
                        style={{ backgroundColor: accent }}
                      >
                        <Check
                          className="h-2.5 w-2.5"
                          strokeWidth={3.5}
                          style={{ color: surface }}
                        />
                      </span>
                    )}
                  </div>
                  <p
                    className={cn(
                      'mt-2 truncate text-[12.5px] font-medium',
                      isActive ? 'text-ink' : 'text-muted',
                    )}
                  >
                    {item.name}
                  </p>
                  <p className="truncate text-[11px] text-faint">{item.hint}</p>
                </motion.button>
              );
            })}
          </div>
        </Card>
      </section>

      {/* Productivity ----------------------------------------------- */}
      <SettingGroup label="Productivity">
        <SettingRow
          icon={CalendarRange}
          title="Upcoming schedule"
          description="Review everything planned after today."
          onClick={() => onNavigate('upcoming')}
          action={
            <>
              {upcomingCount > 0 && <Pill>{upcomingCount}</Pill>}
              {chevron}
            </>
          }
        />
        <SettingRow
          icon={Zap}
          title="Streak and trends"
          description="Scheduling consistency and productivity over time."
          onClick={() => onNavigate('analytics')}
          action={chevron}
        />
      </SettingGroup>

      {/* Notifications ---------------------------------------------- */}
      <SettingGroup label="Notifications">
        <SettingRow
          icon={notificationsOn ? BellRing : BellOff}
          tone={notificationsOn ? 'positive' : notificationsBlocked ? 'warning' : 'default'}
          title="Task reminders"
          description={notificationCopy}
          action={
            notificationsOn ? (
              <Pill tone="positive">On</Pill>
            ) : notificationsBlocked || notificationsUnsupported ? (
              <Pill tone="warning">
                {notificationsUnsupported ? 'Unavailable' : 'Blocked'}
              </Pill>
            ) : (
              <Button size="sm" variant="primary" onClick={onRequestNotifications}>
                Enable
              </Button>
            )
          }
        />

        {notificationsBlocked && (
          <div className="flex items-start gap-3 px-4 py-3">
            <TriangleAlert
              className="mt-0.5 h-4 w-4 shrink-0 text-warning"
              strokeWidth={1.75}
            />
            <p className="text-[12px] leading-relaxed text-muted">
              A blocked permission cannot be re-requested by the page — the browser
              ignores the call. Open the icon at the left of the address bar, set
              Notifications to <span className="font-medium text-ink">Allow</span>,
              then reload.
            </p>
          </div>
        )}

        {notificationsOn && (
          <SettingRow
            icon={Zap}
            title="Send a test notification"
            description="Confirm alerts actually reach your desktop."
            action={
              <Button size="sm" variant="secondary" onClick={onTestNotification}>
                Test
              </Button>
            }
          />
        )}
      </SettingGroup>

      {/* Data ------------------------------------------------------- */}
      <SettingGroup label="Data">
        <SettingRow
          icon={Download}
          title="Export backup"
          description="Download every task as a JSON file."
          action={
            <Button size="sm" variant="secondary" onClick={onExport}>
              Export
            </Button>
          }
        />
        <SettingRow
          icon={Upload}
          title="Restore from backup"
          description={
            importName
              ? `Last imported ${importName}`
              : 'Add tasks from a previously exported file.'
          }
          action={
            <>
              <input
                ref={fileRef}
                type="file"
                accept="application/json,.json"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setImportName(file.name);
                  onImport(file);
                  e.target.value = '';
                }}
              />
              <Button size="sm" variant="secondary" onClick={() => fileRef.current?.click()}>
                Choose file
              </Button>
            </>
          }
        />
        <SettingRow
          icon={Database}
          title="Local database"
          description="A SQLite file on this machine — nothing leaves it."
          action={<Pill>{taskCount} records</Pill>}
        />
      </SettingGroup>

      {/* System ----------------------------------------------------- */}
      <SettingGroup label="System">
        <SettingRow
          icon={isConnected ? Wifi : WifiOff}
          tone={isConnected ? 'positive' : 'warning'}
          title="Backend connection"
          description={
            isConnected
              ? 'The API on port 8000 is responding.'
              : 'Cannot reach the API on port 8000.'
          }
          action={
            <Pill tone={isConnected ? 'positive' : 'warning'}>
              {isConnected ? 'Connected' : 'Offline'}
            </Pill>
          }
        />
        <SettingRow
          icon={ShieldCheck}
          title="Offline-first"
          description="Runs entirely on localhost with no external services."
          action={<Pill tone="positive">Private</Pill>}
        />
      </SettingGroup>
    </div>
  );
}
