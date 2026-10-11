import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon' | 'icon-sm';

/** Motion owns these handlers; drop the DOM versions to avoid a type clash. */
type NativeButtonProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'onAnimationStart' | 'onAnimationEnd' | 'onAnimationIteration' | 'onDrag' | 'onDragStart' | 'onDragEnd'
>;

export interface ButtonProps extends NativeButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-accent text-accent-ink shadow-soft hover:bg-accent-hover hover:shadow-lift',
  secondary:
    'bg-surface-2 text-ink border border-line hover:bg-surface-3 hover:border-line-strong',
  ghost: 'text-muted hover:text-ink hover:bg-accent-soft',
  danger: 'text-muted hover:text-danger hover:bg-danger/10',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 gap-1.5 text-[13px] rounded-md',
  md: 'h-10 px-4 gap-2 text-sm rounded-lg',
  lg: 'h-11 px-5 gap-2 text-sm rounded-xl',
  icon: 'h-10 w-10 rounded-lg',
  'icon-sm': 'h-8 w-8 rounded-md',
};

/**
 * The single button in the product. Every affordance — nav, toolbar, modal,
 * row action — resolves to one of these four variants so weight and motion
 * stay consistent everywhere.
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'secondary', size = 'md', className, children, ...props }, ref) => (
    <motion.button
      ref={ref}
      whileTap={props.disabled ? undefined : { scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 600, damping: 30 }}
      className={cn(
        'inline-flex items-center justify-center font-medium select-none',
        'transition-colors duration-200 cursor-pointer',
        'disabled:opacity-40 disabled:pointer-events-none',
        'focus-visible:outline-2 focus-visible:outline-offset-2',
        SIZES[size],
        VARIANTS[variant],
        className,
      )}
      {...props}
    >
      {children}
    </motion.button>
  ),
);

Button.displayName = 'Button';
