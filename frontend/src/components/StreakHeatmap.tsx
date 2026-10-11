import { motion } from 'framer-motion';
import { Flame, Trophy, CalendarCheck } from 'lucide-react';
import type { StreakSummary } from '../lib/stats';
import { parseLocalDate } from '../lib/dates';
import { cn } from '../lib/utils';

const EASE = [0.22, 1, 0.36, 1] as const;
const WEEKDAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

/** Five-step ramp derived from the live accent, so it re-skins with the theme. */
const LEVEL_OPACITY = [0, 0.22, 0.45, 0.72, 1] as const;

function Cell({ level, inRange, count, date }: StreakSummary['weeks'][0][0]) {
  const title = inRange
    ? `${parseLocalDate(date).toLocaleDateString(undefined, {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })} — ${count === 0 ? 'nothing scheduled' : `${count} task${count === 1 ? '' : 's'}`}`
    : undefined;

  if (!inRange) {
    return <div className="h-[11px] w-[11px] rounded-[3px] bg-transparent" aria-hidden />;
  }

  return (
    <div
      title={title}
      className={cn(
        'h-[11px] w-[11px] rounded-[3px] transition-transform duration-150 hover:scale-125',
        level === 0 && 'bg-track',
      )}
      style={
        level > 0
          ? { backgroundColor: 'var(--ds-accent)', opacity: LEVEL_OPACITY[level] }
          : undefined
      }
    />
  );
}

function StreakStat({
  icon: Icon,
  value,
  label,
  emphasis = false,
}: {
  icon: typeof Flame;
  value: string | number;
  label: string;
  emphasis?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border',
          emphasis ? 'border-accent-line bg-accent-soft' : 'border-line bg-surface-2',
        )}
      >
        <Icon
          className={cn('h-4 w-4', emphasis ? 'text-accent-text' : 'text-muted')}
          strokeWidth={1.75}
        />
      </span>
      <div className="min-w-0">
        <p
          className={cn(
            'ds-numeric text-[19px] font-semibold leading-none',
            emphasis ? 'text-accent-text' : 'text-ink',
          )}
        >
          {value}
        </p>
        <p className="mt-1 text-[11.5px] text-faint">{label}</p>
      </div>
    </div>
  );
}

export function StreakHeatmap({ summary }: { summary: StreakSummary }) {
  const { weeks, monthLabels, current, longest, activeDays } = summary;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <StreakStat
          icon={Flame}
          value={`${current} ${current === 1 ? 'day' : 'days'}`}
          label="Current streak"
          emphasis
        />
        <StreakStat
          icon={Trophy}
          value={`${longest} ${longest === 1 ? 'day' : 'days'}`}
          label="Longest streak"
        />
        <StreakStat icon={CalendarCheck} value={activeDays} label="Total active days" />
      </div>

      {/* The grid is wider than a phone; it scrolls inside its own rail so the
          page body never gains a horizontal scrollbar. */}
      <div className="ds-scroll -mx-1 overflow-x-auto px-1 pb-2">
        <div className="inline-block min-w-full">
          {/* Month ruler */}
          <div className="relative mb-1.5 ml-[34px] h-4">
            {monthLabels.map(({ index, label }) => (
              <span
                key={`${label}-${index}`}
                className="absolute text-[10px] font-medium text-faint"
                style={{ left: `${index * 14}px` }}
              >
                {label}
              </span>
            ))}
          </div>

          <div className="flex gap-[3px]">
            {/* Weekday ruler */}
            <div className="mr-1 flex w-[30px] shrink-0 flex-col gap-[3px]">
              {WEEKDAY_LABELS.map((label, i) => (
                <span
                  key={i}
                  className="flex h-[11px] items-center text-[10px] font-medium leading-none text-faint"
                >
                  {label}
                </span>
              ))}
            </div>

            {weeks.map((week, wi) => (
              <motion.div
                key={wi}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: Math.min(wi * 0.004, 0.25), ease: EASE }}
                className="flex flex-col gap-[3px]"
              >
                {week.map((cell) => (
                  <Cell key={cell.date} {...cell} />
                ))}
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 border-t border-line pt-4">
        <p className="text-[11.5px] text-faint">
          A day counts as active when at least one task is scheduled on it.
        </p>
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="text-[10px] font-medium text-faint">Less</span>
          {LEVEL_OPACITY.map((opacity, i) => (
            <span
              key={i}
              className={cn('h-[11px] w-[11px] rounded-[3px]', i === 0 && 'bg-track')}
              style={i > 0 ? { backgroundColor: 'var(--ds-accent)', opacity } : undefined}
            />
          ))}
          <span className="text-[10px] font-medium text-faint">More</span>
        </div>
      </div>
    </div>
  );
}
