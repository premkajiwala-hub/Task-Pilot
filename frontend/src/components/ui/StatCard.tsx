import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

export interface StatCardProps {
  label: string;
  value: React.ReactNode;
  caption?: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  /** 0–100. Renders a hairline progress rail under the value when present. */
  progress?: number;
  /** Draws the value and icon in the theme accent. Use for the hero metric. */
  emphasis?: boolean;
  index?: number;
}

/**
 * Statistic tile. Deliberately typographic: the number carries the hierarchy,
 * the icon is a quiet anchor, and colour appears only on the emphasised tile.
 */
export function StatCard({
  label,
  value,
  caption,
  icon: Icon,
  progress,
  emphasis = false,
  index = 0,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -2 }}
      className={cn(
        'group relative overflow-hidden rounded-2xl ds-sheen',
        'bg-surface border border-line shadow-soft p-5',
        'transition-shadow duration-300 hover:shadow-lift',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="ds-eyebrow">{label}</p>
        <Icon
          className={cn(
            'h-4 w-4 shrink-0 transition-colors duration-300',
            emphasis ? 'text-accent' : 'text-faint group-hover:text-muted',
          )}
          strokeWidth={1.75}
        />
      </div>

      <p
        className={cn(
          'ds-numeric mt-4 text-[32px] leading-none font-semibold',
          emphasis ? 'text-accent' : 'text-ink',
        )}
      >
        {value}
      </p>

      {typeof progress === 'number' && (
        <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-track">
          <motion.div
            className="h-full rounded-full bg-accent"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      )}

      {caption && <p className="mt-3 text-xs text-faint">{caption}</p>}
    </motion.div>
  );
}
