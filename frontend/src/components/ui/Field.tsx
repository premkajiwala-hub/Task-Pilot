import React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

/* Shared shell for every text-entry control: hairline border, generous inset,
   soft focus ring driven by the theme's --ds-ring. */
const FIELD_BASE = cn(
  'w-full bg-surface-2 text-ink text-sm rounded-lg',
  'border border-line placeholder:text-faint',
  'transition-[border-color,box-shadow,background-color] duration-200',
  'hover:border-line-strong',
  'focus:outline-none focus:border-accent-line focus:bg-surface-3',
  'focus:ring-4 focus:ring-accent-soft',
  'disabled:opacity-50 disabled:cursor-not-allowed',
);

export function Label({
  children,
  htmlFor,
  className,
}: {
  children: React.ReactNode;
  htmlFor?: string;
  className?: string;
}) {
  return (
    <label htmlFor={htmlFor} className={cn('ds-eyebrow block mb-2', className)}>
      {children}
    </label>
  );
}

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  /** Optional leading icon rendered inside the field. */
  icon?: React.ComponentType<{ className?: string; strokeWidth?: number }>;
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, icon: Icon, ...props }, ref) => {
    const field = (
      <input
        ref={ref}
        className={cn(FIELD_BASE, 'h-10 px-3.5', Icon && 'pl-9', className)}
        {...props}
      />
    );

    if (!Icon) return field;

    return (
      <div className="relative">
        <Icon
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-faint"
          strokeWidth={1.75}
        />
        {field}
      </div>
    );
  },
);

Input.displayName = 'Input';

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

/** Native select for behaviour and accessibility, restyled with our chevron. */
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => (
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          FIELD_BASE,
          'h-10 pl-3.5 pr-9 cursor-pointer appearance-none',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-faint"
        strokeWidth={1.75}
      />
    </div>
  ),
);

Select.displayName = 'Select';

/** Field + label + optional hint, so form rows never drift out of alignment. */
export function FormRow({
  label,
  htmlFor,
  hint,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && <p className="mt-1.5 text-xs text-faint">{hint}</p>}
    </div>
  );
}
