import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { CalendarClock, Plus, CalendarRange, Layers, Clock3 } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { TaskCard } from '../TaskCard';
import { groupUpcoming } from '../../lib/stats';
import { daysBetween, durationMinutes, relativeDayLabel, parseLocalDate } from '../../lib/dates';
import type { Task } from '../../types';

const EASE = [0.22, 1, 0.36, 1] as const;

export interface UpcomingViewProps {
  tasks: Task[];
  todayStr: string;
  formatTime: (value: string) => string;
  onToggle: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: number) => void;
  onQuickAdd: (dateStr?: string) => void;
}

function SummaryTile({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof Layers;
  value: string | number;
  label: string;
}) {
  return (
    <Card padding="sm" className="flex items-center gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-line bg-surface-2">
        <Icon className="h-4 w-4 text-muted" strokeWidth={1.75} />
      </span>
      <div className="min-w-0">
        <p className="ds-numeric text-[19px] font-semibold leading-none text-ink">{value}</p>
        <p className="mt-1 text-[11.5px] text-faint">{label}</p>
      </div>
    </Card>
  );
}

export function UpcomingView({
  tasks,
  todayStr,
  formatTime,
  onToggle,
  onEdit,
  onDelete,
  onQuickAdd,
}: UpcomingViewProps) {
  const groups = useMemo(() => groupUpcoming(tasks, todayStr), [tasks, todayStr]);

  const totalUpcoming = groups.reduce((sum, g) => sum + g.tasks.length, 0);
  const plannedMinutes = groups.reduce(
    (sum, g) => sum + g.tasks.reduce((s, t) => s + durationMinutes(t.start_time, t.end_time), 0),
    0,
  );
  const nextUp = groups[0];

  if (groups.length === 0) {
    return (
      <Card padding="none">
        <EmptyState
          icon={CalendarRange}
          title="Nothing scheduled ahead"
          description="Tasks dated after today will collect here, grouped by day, so you can see what's coming."
          action={
            <Button variant="primary" onClick={() => onQuickAdd()}>
              <Plus className="h-4 w-4" strokeWidth={2.25} />
              <span>Schedule something</span>
            </Button>
          }
        />
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <section aria-label="Upcoming summary" className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryTile icon={Layers} value={totalUpcoming} label="Tasks ahead" />
        <SummaryTile icon={CalendarRange} value={groups.length} label="Days with plans" />
        <SummaryTile
          icon={Clock3}
          value={`${(plannedMinutes / 60).toFixed(1)}h`}
          label="Time blocked out"
        />
      </section>

      {nextUp && (
        <p className="text-[13px] text-muted">
          Next up{' '}
          <span className="font-medium text-ink">
            {relativeDayLabel(nextUp.date, todayStr).toLowerCase()}
          </span>{' '}
          — {nextUp.tasks.length} task{nextUp.tasks.length === 1 ? '' : 's'}.
        </p>
      )}

      {groups.map((group, groupIndex) => {
        const delta = daysBetween(todayStr, group.date);
        return (
          <motion.section
            key={group.date}
            aria-label={group.date}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: Math.min(groupIndex * 0.05, 0.3), ease: EASE }}
            className="space-y-3"
          >
            {/* Sticky day header keeps context while scrolling a long list. */}
            <div className="sticky top-0 z-10 -mx-1 flex items-center gap-3 bg-canvas/90 px-1 py-2 backdrop-blur-sm">
              <h3 className="text-[13px] font-semibold text-ink">
                {relativeDayLabel(group.date, todayStr)}
              </h3>
              <span className="ds-numeric text-[11.5px] text-faint">
                {parseLocalDate(group.date).toLocaleDateString(undefined, {
                  day: 'numeric',
                  month: 'short',
                })}
              </span>
              <span className="h-px flex-1 bg-line" />
              <span className="ds-numeric shrink-0 rounded-md border border-line bg-surface-2 px-2 py-1 text-[11px] font-medium text-muted">
                {group.tasks.length}
              </span>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Add a task on ${group.date}`}
                title={`Add a task in ${delta} day${delta === 1 ? '' : 's'}`}
                onClick={() => onQuickAdd(group.date)}
              >
                <Plus className="h-4 w-4" strokeWidth={2} />
              </Button>
            </div>

            <div className="space-y-3">
              {group.tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  formatTime={formatTime}
                  onToggle={onToggle}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </div>
          </motion.section>
        );
      })}

      <div className="flex justify-center pt-2">
        <Button variant="secondary" onClick={() => onQuickAdd()}>
          <CalendarClock className="h-4 w-4" strokeWidth={1.75} />
          <span>Schedule another task</span>
        </Button>
      </div>
    </div>
  );
}
