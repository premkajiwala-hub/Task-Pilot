import React from 'react';
import { cn } from '../../lib/utils';

export type BadgeTone = 'neutral' | 'accent' | 'outline';

const TONES: Record<BadgeTone, string> = {
  neutral: 'bg-surface-3 text-muted border-transparent',
  accent: 'bg-accent-soft text-accent-text border-accent-line',
  outline: 'bg-transparent text-muted border-line',
};

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  icon?: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}

/** Compact metadata pill — time, category, repeat interval, status. */
export function Badge({
  tone = 'neutral',
  icon: Icon,
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border',
        'px-2 py-[3px] text-[11px] font-medium leading-none whitespace-nowrap',
        TONES[tone],
        className,
      )}
      {...props}
    >
      {Icon && <Icon className="h-3 w-3 shrink-0" strokeWidth={2} />}
      {children}
    </span>
  );
}

/**
 * The dot carries the priority signal; the label stays at a readable weight.
 * Tinting the text to match the dot is what makes "Low" illegible — a colour
 * dim enough to read as low priority is by definition too dim for body text.
 */
const PRIORITY_STYLE = {
  high: { dot: 'bg-high', text: 'text-ink font-semibold', label: 'High' },
  medium: { dot: 'bg-medium', text: 'text-muted', label: 'Medium' },
  low: { dot: 'bg-low', text: 'text-muted', label: 'Low' },
} as const;

/**
 * Priority reads as a weighted dot plus a label rather than a colour block —
 * it keeps the hierarchy legible in the monochrome themes and lets the red
 * theme reserve its accent for genuinely high-priority work.
 */
export function PriorityBadge({
  priority,
  className,
}: {
  priority: 'low' | 'medium' | 'high';
  className?: string;
}) {
  const style = PRIORITY_STYLE[priority] ?? PRIORITY_STYLE.medium;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border border-line',
        'px-2 py-[3px] text-[11px] font-medium leading-none',
        style.text,
        className,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', style.dot)} />
      {style.label}
    </span>
  );
}
