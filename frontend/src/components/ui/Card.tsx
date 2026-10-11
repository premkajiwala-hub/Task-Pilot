import React from 'react';
import { cn } from '../../lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Adds the top-light gradient that reads as depth rather than a border. */
  sheen?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const PADDING = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6 sm:p-7',
} as const;

/** The one surface primitive: soft elevation, hairline edge, 20px radius. */
export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ sheen = false, padding = 'md', className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-2xl bg-surface border border-line shadow-soft',
        sheen && 'ds-sheen',
        PADDING[padding],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  ),
);

Card.displayName = 'Card';

/** Title row for a card, with an optional icon and trailing slot. */
export function CardHeader({
  title,
  icon: Icon,
  action,
  divider = true,
  className,
}: {
  title: string;
  icon?: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  action?: React.ReactNode;
  divider?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4',
        divider && 'border-b border-line pb-4 mb-5',
        className,
      )}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        {Icon && <Icon className="h-4 w-4 text-accent shrink-0" strokeWidth={1.75} />}
        <h3 className="text-[15px] font-semibold text-ink truncate">{title}</h3>
      </div>
      {action}
    </div>
  );
}
