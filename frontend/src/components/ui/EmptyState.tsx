import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

/** Calm, centred empty state — no dashed boxes, no shouting. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  compact = false,
  className,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
  compact?: boolean;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'flex flex-col items-center justify-center text-center',
        compact ? 'py-10 px-4' : 'py-20 px-6',
        className,
      )}
    >
      <div
        className={cn(
          'flex items-center justify-center rounded-2xl bg-surface-2 border border-line',
          compact ? 'h-10 w-10' : 'h-14 w-14',
        )}
      >
        <Icon
          className={cn('text-faint', compact ? 'h-4 w-4' : 'h-6 w-6')}
          strokeWidth={1.5}
        />
      </div>
      <p
        className={cn(
          'font-medium text-ink',
          compact ? 'mt-3 text-[13px]' : 'mt-5 text-[15px]',
        )}
      >
        {title}
      </p>
      {description && (
        <p
          className={cn(
            'text-muted max-w-[34ch] leading-relaxed',
            compact ? 'mt-1 text-xs' : 'mt-1.5 text-sm',
          )}
        >
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </motion.div>
  );
}
