import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Flag, Activity, ChartColumn, Target, Flame } from 'lucide-react';
import { Card, CardHeader } from '../ui/Card';
import { StatCard } from '../ui/StatCard';
import { TrendChart } from '../TrendChart';
import { StreakHeatmap } from '../StreakHeatmap';
import { CATEGORIES, type Task } from '../../types';
import {
  productivityTrend,
  schedulingStreak,
  statsForDate,
  velocityLabel,
  type TrendRange,
} from '../../lib/stats';
import { cn } from '../../lib/utils';

const EASE = [0.22, 1, 0.36, 1] as const;

export interface AnalyticsViewProps {
  tasks: Task[];
  /** Today's date string — the daily cards reset against this. */
  todayStr: string;
}

export function AnalyticsView({ tasks, todayStr }: AnalyticsViewProps) {
  const [range, setRange] = useState<TrendRange>('week');

  // Every headline metric is scoped to today, so the panel resets at midnight
  // on its own — `todayStr` comes from the clock, not from a filter.
  const today = useMemo(() => statsForDate(tasks, todayStr), [tasks, todayStr]);
  const trend = useMemo(() => productivityTrend(tasks, range), [tasks, range]);
  const streak = useMemo(() => schedulingStreak(tasks), [tasks]);

  const focusHours = (today.focusMinutes / 60).toFixed(1);

  const categoryStats = useMemo(
    () =>
      CATEGORIES.map((category) => {
        const scoped = tasks.filter((t) => t.category === category);
        const done = scoped.filter((t) => t.is_completed).length;
        return {
          category,
          total: scoped.length,
          done,
          percent: scoped.length > 0 ? Math.round((done / scoped.length) * 100) : 0,
        };
      }),
    [tasks],
  );

  return (
    <div className="space-y-6">
      {/* Today ------------------------------------------------------ */}
      <section aria-label="Today's metrics">
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h2 className="text-[13px] font-semibold text-ink">Today</h2>
          <p className="text-[11.5px] text-faint">Resets at midnight</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            index={0}
            label="Focus hours"
            value={focusHours}
            caption={
              today.completed === 0
                ? 'No completed tasks yet'
                : `From ${today.completed} completed task${today.completed === 1 ? '' : 's'}`
            }
            icon={Clock}
          />
          <StatCard
            index={1}
            label="High priority"
            value={`${today.highCompleted}/${today.highTotal}`}
            caption={today.highTotal === 0 ? 'None flagged today' : 'Closed out today'}
            icon={Flag}
            progress={
              today.highTotal > 0 ? (today.highCompleted / today.highTotal) * 100 : 0
            }
          />
          <StatCard
            index={2}
            label="Velocity"
            value={velocityLabel(today.rate, today.total)}
            caption={`${today.completed} of ${today.total} done today`}
            icon={Activity}
          />
          <StatCard
            index={3}
            label="Completion"
            value={`${today.rate}%`}
            progress={today.rate}
            icon={Target}
            emphasis
          />
        </div>
      </section>

      {/* Trend ------------------------------------------------------ */}
      <Card padding="lg" sheen>
        <TrendChart points={trend} range={range} onRangeChange={setRange} />
      </Card>

      {/* Streak ----------------------------------------------------- */}
      <Card padding="lg" sheen>
        <CardHeader
          title="Scheduling streak"
          icon={Flame}
          action={
            streak.busiestDay ? (
              <span className="ds-numeric shrink-0 rounded-md border border-line bg-surface-2 px-2 py-1 text-[11px] font-medium text-muted">
                Busiest day · {streak.busiestDay.count}
              </span>
            ) : undefined
          }
        />
        <StreakHeatmap summary={streak} />
      </Card>

      {/* Categories ------------------------------------------------- */}
      <Card padding="lg" sheen>
        <CardHeader title="By category" icon={ChartColumn} />

        <div className="space-y-5">
          {categoryStats.map((stat, index) => (
            <div key={stat.category} className="space-y-2">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-[13px] font-medium text-ink">{stat.category}</span>
                <span className="ds-numeric text-[12px] font-medium text-muted">
                  {stat.done}
                  <span className="text-faint">/{stat.total}</span>
                  <span
                    className={cn(
                      'ml-2',
                      stat.percent === 100 && stat.total > 0
                        ? 'text-accent-text'
                        : 'text-faint',
                    )}
                  >
                    {stat.percent}%
                  </span>
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-track">
                <motion.div
                  className="h-full rounded-full bg-accent"
                  initial={{ width: 0 }}
                  animate={{ width: `${stat.percent}%` }}
                  transition={{ duration: 0.7, delay: 0.1 + index * 0.07, ease: EASE }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
