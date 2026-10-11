import { motion, AnimatePresence } from 'framer-motion';
import { PanelLeftClose, PanelLeftOpen, X, User, Zap } from 'lucide-react';
import { NAV_ITEMS } from '../lib/nav';
import { cn } from '../lib/utils';

const EASE = [0.22, 1, 0.36, 1] as const;

interface NavListProps {
  activeTab: string;
  onSelect: (id: string) => void;
  collapsed?: boolean;
  /** Distinguishes the desktop and drawer instances of the shared indicator. */
  layoutGroup: string;
}

function NavList({ activeTab, onSelect, collapsed = false, layoutGroup }: NavListProps) {
  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            aria-current={isActive ? 'page' : undefined}
            title={collapsed ? item.name : undefined}
            className={cn(
              'group relative flex items-center h-11 rounded-lg cursor-pointer',
              'text-[13.5px] font-medium transition-colors duration-200',
              collapsed ? 'justify-center px-0' : 'px-3 gap-3',
              isActive ? 'text-accent-text' : 'text-muted hover:text-ink',
            )}
          >
            {/* Active pill slides between items instead of cross-fading. */}
            {isActive && (
              <motion.span
                layoutId={`${layoutGroup}-active`}
                transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                className="absolute inset-0 rounded-lg bg-accent-soft border border-accent-line"
              />
            )}
            {!isActive && (
              <span className="absolute inset-0 rounded-lg bg-transparent transition-colors duration-200 group-hover:bg-accent-soft/50" />
            )}

            <Icon
              className="relative h-[18px] w-[18px] shrink-0"
              strokeWidth={isActive ? 2 : 1.75}
            />

            {!collapsed && (
              <span className="relative truncate">{item.name}</span>
            )}

            {/* Tooltip for the collapsed rail. */}
            {collapsed && (
              <span
                className={cn(
                  'pointer-events-none absolute left-full ml-3 z-50 whitespace-nowrap',
                  'rounded-md border border-line bg-elevated px-2.5 py-1.5',
                  'text-xs font-medium text-ink shadow-float',
                  'opacity-0 translate-x-[-4px] transition-all duration-200',
                  'group-hover:opacity-100 group-hover:translate-x-0',
                )}
              >
                {item.name}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}

function Wordmark({ collapsed }: { collapsed: boolean }) {
  return (
    <div className={cn('flex items-center h-11', collapsed ? 'justify-center' : 'px-3 gap-2.5')}>
      <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-soft border border-accent-line">
        <img
          src="/logo.png"
          alt=""
          className="h-[18px] w-[18px] object-contain"
          onError={(e) => {
            // Fall back to the mark if the asset is missing.
            e.currentTarget.style.display = 'none';
            e.currentTarget.nextElementSibling?.classList.remove('hidden');
          }}
        />
        <Zap className="hidden absolute h-4 w-4 text-accent" strokeWidth={2} />
      </span>
      {!collapsed && (
        <span className="text-[15px] font-semibold tracking-[-0.02em] text-ink">
          TaskPilot
        </span>
      )}
    </div>
  );
}

/**
 * The old chip printed a hard-coded "Offline-first" line, which read as a
 * live status and worried people. It now reflects real API reachability: a
 * solid green dot when the backend answers, amber when it does not.
 */
function ProfileChip({
  collapsed,
  isConnected,
}: {
  collapsed: boolean;
  isConnected: boolean;
}) {
  return (
    <div
      className={cn(
        'flex items-center h-12 rounded-lg border border-line bg-surface-2',
        collapsed ? 'justify-center px-0' : 'px-2.5 gap-2.5',
      )}
    >
      <span className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-surface-3">
        <User className="h-3.5 w-3.5 text-muted" strokeWidth={1.75} />
        {/* Collapsed rail has no room for the label, so the dot rides the avatar. */}
        {collapsed && (
          <span
            className={cn(
              'absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full ring-2 ring-surface-2',
              isConnected ? 'bg-positive' : 'bg-warning',
            )}
          />
        )}
      </span>
      {!collapsed && (
        <div className="flex min-w-0 flex-1 items-center gap-2 leading-tight">
          <p className="min-w-0 flex-1 truncate text-[12.5px] font-medium text-ink">
            Local workspace
          </p>
          <span
            title={isConnected ? 'Backend connected' : 'Backend unreachable'}
            aria-label={isConnected ? 'Backend connected' : 'Backend unreachable'}
            className={cn(
              'h-2 w-2 shrink-0 rounded-full',
              isConnected ? 'bg-positive' : 'bg-warning',
            )}
          />
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Desktop: a floating rail that detaches from the viewport edge.      */
/* ------------------------------------------------------------------ */

export function Sidebar({
  activeTab,
  onSelect,
  collapsed,
  onToggleCollapsed,
  isConnected,
}: {
  activeTab: string;
  onSelect: (id: string) => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  isConnected: boolean;
}) {
  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 84 : 260 }}
      transition={{ duration: 0.36, ease: EASE }}
      className="hidden lg:flex shrink-0 p-3 pr-0"
    >
      <div
        className={cn(
          'flex w-full flex-col justify-between overflow-hidden',
          'rounded-2xl border border-line bg-elevated shadow-soft',
          collapsed ? 'px-3 py-4' : 'p-4',
        )}
      >
        <div className="flex flex-col gap-7">
          <Wordmark collapsed={collapsed} />
          <NavList
            activeTab={activeTab}
            onSelect={onSelect}
            collapsed={collapsed}
            layoutGroup="desktop-nav"
          />
        </div>

        <div className="flex flex-col gap-2">
          <ProfileChip collapsed={collapsed} isConnected={isConnected} />
          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={cn(
              'flex h-9 items-center rounded-lg cursor-pointer',
              'text-[12.5px] font-medium text-faint hover:text-ink',
              'hover:bg-accent-soft transition-colors duration-200',
              collapsed ? 'justify-center px-0' : 'px-3 gap-2.5',
            )}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-[18px] w-[18px]" strokeWidth={1.75} />
            ) : (
              <>
                <PanelLeftClose className="h-[18px] w-[18px]" strokeWidth={1.75} />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      </div>
    </motion.aside>
  );
}

/* ------------------------------------------------------------------ */
/* Mobile: the same nav in a slide-over drawer.                        */
/* ------------------------------------------------------------------ */

export function MobileNav({
  open,
  onClose,
  activeTab,
  onSelect,
  isConnected,
}: {
  open: boolean;
  onClose: () => void;
  activeTab: string;
  onSelect: (id: string) => void;
  isConnected: boolean;
}) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="absolute inset-0 bg-scrim backdrop-blur-md"
          />
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.32, ease: EASE }}
            className={cn(
              'absolute inset-y-3 left-3 w-[264px] max-w-[82vw]',
              'flex flex-col justify-between rounded-2xl',
              'border border-line bg-elevated p-4 shadow-modal',
            )}
          >
            <div className="flex flex-col gap-7">
              <div className="flex items-center justify-between">
                <Wordmark collapsed={false} />
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close navigation"
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:text-ink hover:bg-accent-soft transition-colors cursor-pointer"
                >
                  <X className="h-[18px] w-[18px]" strokeWidth={1.75} />
                </button>
              </div>
              <NavList
                activeTab={activeTab}
                onSelect={(id) => {
                  onSelect(id);
                  onClose();
                }}
                layoutGroup="mobile-nav"
              />
            </div>
            <ProfileChip collapsed={false} isConnected={isConnected} />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
