import { motion } from 'framer-motion';
import { THEMES, type ThemeId } from '../lib/theme';
import { cn } from '../lib/utils';

/**
 * Segmented three-way theme control. The selected state is a single sliding
 * pill (shared layoutId) rather than three independent highlights, so the
 * transition reads as one object moving.
 */
export function ThemeSwitcher({
  theme,
  onChange,
  className,
}: {
  theme: ThemeId;
  onChange: (id: ThemeId) => void;
  className?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Colour theme"
      className={cn(
        'relative flex items-center gap-0.5 rounded-lg',
        'border border-line bg-surface-2 p-0.5',
        className,
      )}
    >
      {THEMES.map((item) => {
        const Icon = item.icon;
        const isActive = theme === item.id;

        return (
          <button
            key={item.id}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={`${item.name} theme — ${item.hint}`}
            title={`${item.name} · ${item.hint}`}
            onClick={() => onChange(item.id)}
            className={cn(
              'relative flex h-8 w-8 items-center justify-center rounded-md',
              'cursor-pointer transition-colors duration-200',
              isActive ? 'text-accent' : 'text-faint hover:text-ink',
            )}
          >
            {isActive && (
              <motion.span
                layoutId="theme-pill"
                transition={{ type: 'spring', stiffness: 450, damping: 34 }}
                className="absolute inset-0 rounded-md bg-accent-soft border border-accent-line"
              />
            )}
            <Icon className="relative h-4 w-4" strokeWidth={1.75} />
          </button>
        );
      })}
    </div>
  );
}
