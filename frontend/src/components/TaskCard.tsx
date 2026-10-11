import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Clock, Pencil, Trash2, Repeat2, Tag } from 'lucide-react';
import { Badge, PriorityBadge } from './ui/Badge';
import type { Task } from '../types';
import { cn } from '../lib/utils';

const EASE = [0.22, 1, 0.36, 1] as const;

/** Circular checkbox with a spring fill and a drawn check on completion. */
function CompletionToggle({
  done,
  onToggle,
  title,
}: {
  done: boolean;
  onToggle: () => void;
  title: string;
}) {
  return (
    <motion.button
      type="button"
      onClick={onToggle}
      whileTap={{ scale: 0.86 }}
      transition={{ type: 'spring', stiffness: 600, damping: 26 }}
      aria-pressed={done}
      aria-label={done ? `Mark "${title}" as pending` : `Mark "${title}" as done`}
      className={cn(
        'relative flex h-[22px] w-[22px] shrink-0 items-center justify-center',
        'rounded-full border-2 cursor-pointer transition-colors duration-200',
        done
          ? 'border-accent bg-accent'
          : 'border-line-strong bg-transparent hover:border-accent',
      )}
    >
      <AnimatePresence initial={false}>
        {done && (
          <motion.span
            key="check"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 700, damping: 24 }}
            className="flex items-center justify-center"
          >
            <Check className="h-3 w-3 text-accent-ink" strokeWidth={3.5} />
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

export interface TaskCardProps {
  task: Task;
  formatTime: (value: string) => string;
  onToggle: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: number) => void;
}

/**
 * Ref is forwarded because `AnimatePresence mode="popLayout"` measures each
 * child to hold its slot while siblings reflow.
 */
export const TaskCard = React.forwardRef<HTMLElement, TaskCardProps>(function TaskCard(
  { task, formatTime, onToggle, onEdit, onDelete },
  ref,
) {
  const done = task.is_completed;

  return (
    <motion.article
      ref={ref}
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.18 } }}
      transition={{ duration: 0.32, ease: EASE }}
      whileHover={{ y: -2 }}
      className={cn(
        'group relative overflow-hidden rounded-2xl ds-sheen',
        'border border-line bg-surface shadow-soft',
        'transition-[box-shadow,border-color,opacity] duration-300',
        'hover:shadow-lift hover:border-line-strong',
        done && 'opacity-[0.62] hover:opacity-100',
      )}
    >
      {/* Task colour rail — the only place the per-task hue appears at size. */}
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-[3px] transition-opacity duration-300"
        style={{ backgroundColor: task.color, opacity: done ? 0.35 : 1 }}
      />

      <div className="flex items-start gap-3.5 py-4 pl-5 pr-3 sm:gap-4 sm:pr-4">
        <div className="pt-0.5">
          <CompletionToggle
            done={done}
            onToggle={() => onToggle(task)}
            title={task.title}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="relative inline-block max-w-full">
            <h4
              className={cn(
                'truncate text-[14.5px] font-medium leading-snug transition-colors duration-300',
                done ? 'text-muted' : 'text-ink',
              )}
            >
              {task.title}
            </h4>
            {/* Strike-through draws in rather than snapping on. */}
            <motion.span
              aria-hidden
              className="pointer-events-none absolute left-0 top-1/2 h-px origin-left bg-muted"
              initial={false}
              animate={{ scaleX: done ? 1 : 0 }}
              transition={{ duration: 0.32, ease: EASE }}
              style={{ width: '100%' }}
            />
          </div>

          {task.description && (
            <p className="mt-1 truncate text-[13px] leading-relaxed text-muted">
              {task.description}
            </p>
          )}

          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <Badge icon={Clock} className="ds-numeric">
              {formatTime(task.start_time)} – {formatTime(task.end_time)}
            </Badge>
            <Badge icon={Tag} tone="outline">
              {task.category}
            </Badge>
            <PriorityBadge priority={task.priority} />
            {task.repeat !== 'none' && (
              <Badge icon={Repeat2} tone="outline" className="capitalize">
                {task.repeat}
              </Badge>
            )}
          </div>
        </div>

        {/* Row actions: always reachable, visually quiet until hover/focus. */}
        <div
          className={cn(
            'flex shrink-0 items-center gap-0.5 transition-opacity duration-200',
            'sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100',
          )}
        >
          <button
            type="button"
            onClick={() => onEdit(task)}
            aria-label={`Edit "${task.title}"`}
            className="flex h-8 w-8 items-center justify-center rounded-md text-faint transition-colors duration-200 hover:bg-accent-soft hover:text-ink cursor-pointer"
          >
            <Pencil className="h-[15px] w-[15px]" strokeWidth={1.75} />
          </button>
          <button
            type="button"
            onClick={() => onDelete(task.id)}
            aria-label={`Delete "${task.title}"`}
            className="flex h-8 w-8 items-center justify-center rounded-md text-faint transition-colors duration-200 hover:bg-danger/10 hover:text-danger cursor-pointer"
          >
            <Trash2 className="h-[15px] w-[15px]" strokeWidth={1.75} />
          </button>
        </div>
      </div>
    </motion.article>
  );
});
