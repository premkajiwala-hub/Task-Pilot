import { motion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Inbox,
  Pencil,
  Trash2,
  CalendarDays,
  Plus,
} from 'lucide-react';
import { Card, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import type { Task } from '../../types';
import { cn } from '../../lib/utils';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const EASE = [0.22, 1, 0.36, 1] as const;

export interface CalendarViewProps {
  currentDate: Date;
  currentMonthDays: Date[];
  startDayOffset: number;
  tasks: Task[];
  focusedDateStr: string;
  onFocusDate: (dateStr: string) => void;
  selectedDateTasks: Task[];
  getLocalDateString: (date?: Date) => string;
  formatTime: (value: string) => string;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onEdit: (task: Task) => void;
  onDelete: (id: number) => void;
  /** Opens the composer with the date pre-filled to the selected day. */
  onAddForDate: (dateStr: string) => void;
}

export function CalendarView({
  currentDate,
  currentMonthDays,
  startDayOffset,
  tasks,
  focusedDateStr,
  onFocusDate,
  selectedDateTasks,
  getLocalDateString,
  formatTime,
  onPrevMonth,
  onNextMonth,
  onEdit,
  onDelete,
  onAddForDate,
}: CalendarViewProps) {
  const todayStr = getLocalDateString(new Date());

  const focusedLabel = (() => {
    const parsed = new Date(`${focusedDateStr}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return focusedDateStr;
    if (focusedDateStr === todayStr) return 'Today';
    return parsed.toLocaleDateString(undefined, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  })();

  const completedCount = selectedDateTasks.filter((t) => t.is_completed).length;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.9fr)_minmax(0,1fr)]">
      {/* Month grid ------------------------------------------------- */}
      <Card padding="lg" sheen className="min-w-0">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h3 className="truncate text-lg font-semibold text-ink">
              {currentDate.toLocaleString(undefined, { month: 'long' })}{' '}
              <span className="ds-numeric font-normal text-muted">
                {currentDate.getFullYear()}
              </span>
            </h3>
            <p className="mt-0.5 text-xs text-faint">
              {tasks.length} task{tasks.length === 1 ? '' : 's'} tracked overall
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onPrevMonth}
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" strokeWidth={1.75} />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onNextMonth}
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" strokeWidth={1.75} />
            </Button>
          </div>
        </div>

        <div className="mb-2 grid grid-cols-7 gap-1.5 sm:gap-2">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="pb-1 text-center text-[11px] font-semibold uppercase tracking-[0.06em] text-faint"
            >
              <span className="hidden sm:inline">{day}</span>
              <span className="sm:hidden">{day[0]}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {Array.from({ length: startDayOffset }).map((_, idx) => (
            <div key={`empty-${idx}`} aria-hidden className="aspect-square" />
          ))}

          {currentMonthDays.map((day, index) => {
            const dateStr = getLocalDateString(day);
            const dailyTasks = tasks.filter((t) => t.date === dateStr);
            const isToday = dateStr === todayStr;
            const isSelected = focusedDateStr === dateStr;

            return (
              <motion.button
                key={dateStr}
                type="button"
                onClick={() => onFocusDate(dateStr)}
                aria-label={`${day.toDateString()}, ${dailyTasks.length} task${
                  dailyTasks.length === 1 ? '' : 's'
                }`}
                aria-pressed={isSelected}
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  duration: 0.28,
                  delay: Math.min(index * 0.006, 0.18),
                  ease: EASE,
                }}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.96 }}
                className={cn(
                  'relative flex aspect-square cursor-pointer flex-col items-center justify-center',
                  'rounded-xl border transition-[background-color,border-color,box-shadow] duration-200',
                  isSelected
                    ? 'border-accent-line bg-accent-soft shadow-lift'
                    : 'border-transparent bg-surface-2 hover:border-line-strong hover:bg-surface-3',
                )}
              >
                <span
                  className={cn(
                    'ds-numeric flex h-7 w-7 items-center justify-center rounded-lg text-[13px] font-medium transition-colors duration-200',
                    isToday && 'bg-accent font-semibold text-accent-ink',
                    !isToday && isSelected && 'text-accent-text',
                    !isToday && !isSelected && 'text-muted',
                  )}
                >
                  {day.getDate()}
                </span>

                {/* Task density: up to three dots, then a count. */}
                <span className="absolute bottom-1.5 flex h-1.5 items-center gap-[3px]">
                  {dailyTasks.slice(0, 3).map((task) => (
                    <span
                      key={task.id}
                      className="h-1.5 w-1.5 rounded-full transition-opacity duration-200"
                      style={{
                        backgroundColor: task.color,
                        opacity: task.is_completed ? 0.35 : 1,
                      }}
                    />
                  ))}
                  {dailyTasks.length > 3 && (
                    <span className="ds-numeric text-[9px] font-semibold leading-none text-faint">
                      +{dailyTasks.length - 3}
                    </span>
                  )}
                </span>
              </motion.button>
            );
          })}
        </div>
      </Card>

      {/* Day agenda ------------------------------------------------- */}
      <Card padding="lg" sheen className="flex min-w-0 flex-col">
        <CardHeader
          title={focusedLabel}
          icon={CalendarDays}
          action={
            <div className="flex shrink-0 items-center gap-1.5">
              {selectedDateTasks.length > 0 && (
                <span className="ds-numeric rounded-md border border-line bg-surface-2 px-2 py-1 text-[11px] font-medium text-muted">
                  {completedCount}/{selectedDateTasks.length}
                </span>
              )}
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Add a task on ${focusedDateStr}`}
                title="Add a task on this day"
                onClick={() => onAddForDate(focusedDateStr)}
              >
                <Plus className="h-4 w-4" strokeWidth={2} />
              </Button>
            </div>
          }
        />

        <div className="ds-scroll -mr-2 max-h-[520px] flex-1 space-y-2 overflow-y-auto pr-2">
          {selectedDateTasks.length === 0 ? (
            <EmptyState
              compact
              icon={Inbox}
              title="Nothing scheduled"
              description="Pick another day, or add a task for this one."
              action={
                <Button variant="secondary" size="sm" onClick={() => onAddForDate(focusedDateStr)}>
                  <Plus className="h-4 w-4" strokeWidth={2} />
                  <span>Add for this day</span>
                </Button>
              }
            />
          ) : (
            selectedDateTasks.map((task, index) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.28, delay: index * 0.035, ease: EASE }}
                className={cn(
                  'group relative overflow-hidden rounded-xl border border-line bg-surface-2 p-3 pl-4',
                  'transition-colors duration-200 hover:border-line-strong hover:bg-surface-3',
                  task.is_completed && 'opacity-60',
                )}
              >
                <span
                  aria-hidden
                  className="absolute inset-y-0 left-0 w-[3px]"
                  style={{ backgroundColor: task.color }}
                />

                <div className="flex items-start justify-between gap-2">
                  <h4
                    className={cn(
                      'min-w-0 truncate text-[13px] font-medium',
                      task.is_completed ? 'text-muted line-through' : 'text-ink',
                    )}
                  >
                    {task.title}
                  </h4>

                  <div className="flex shrink-0 items-center gap-0.5 transition-opacity duration-200 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                    <button
                      type="button"
                      onClick={() => onEdit(task)}
                      aria-label={`Edit "${task.title}"`}
                      className="flex h-6 w-6 cursor-pointer items-center justify-center rounded text-faint transition-colors duration-200 hover:bg-accent-soft hover:text-ink"
                    >
                      <Pencil className="h-3 w-3" strokeWidth={2} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(task.id)}
                      aria-label={`Delete "${task.title}"`}
                      className="flex h-6 w-6 cursor-pointer items-center justify-center rounded text-faint transition-colors duration-200 hover:bg-danger/10 hover:text-danger"
                    >
                      <Trash2 className="h-3 w-3" strokeWidth={2} />
                    </button>
                  </div>
                </div>

                <p className="ds-numeric mt-1 text-[11px] font-medium text-faint">
                  {formatTime(task.start_time)} – {formatTime(task.end_time)}
                </p>
              </motion.div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
