import { AnimatePresence } from 'framer-motion';
import {
  Inbox,
  CircleDashed,
  CircleCheckBig,
  Gauge,
  CalendarClock,
  ListFilter,
  Plus,
  Search,
} from 'lucide-react';
import { StatCard } from '../ui/StatCard';
import { Select } from '../ui/Field';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { TaskCard } from '../TaskCard';
import type { Task } from '../../types';

export interface DashboardViewProps {
  dashboardDateStr: string;
  onDashboardDateChange: (value: string) => void;
  priorityFilter: string;
  onPriorityFilterChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  searchQuery: string;
  totalTasks: number;
  pendingTasks: number;
  completedTasks: number;
  completionRate: number;
  filteredTasks: Task[];
  formatTime: (value: string) => string;
  onToggle: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: number) => void;
  onQuickAdd: () => void;
}

export function DashboardView({
  dashboardDateStr,
  onDashboardDateChange,
  priorityFilter,
  onPriorityFilterChange,
  statusFilter,
  onStatusFilterChange,
  searchQuery,
  totalTasks,
  pendingTasks,
  completedTasks,
  completionRate,
  filteredTasks,
  formatTime,
  onToggle,
  onEdit,
  onDelete,
  onQuickAdd,
}: DashboardViewProps) {
  const isFiltered =
    searchQuery.trim() !== '' || priorityFilter !== 'all' || statusFilter !== 'all';

  return (
    <div className="space-y-6">
      {/* Statistics ------------------------------------------------- */}
      <section
        aria-label="Summary"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <StatCard
          index={0}
          label="Scheduled"
          value={totalTasks}
          caption="Tasks on this day"
          icon={CalendarClock}
        />
        <StatCard
          index={1}
          label="Pending"
          value={pendingTasks}
          caption={pendingTasks === 0 ? 'Nothing left to do' : 'Still open'}
          icon={CircleDashed}
        />
        <StatCard
          index={2}
          label="Completed"
          value={completedTasks}
          caption={`of ${totalTasks} scheduled`}
          icon={CircleCheckBig}
        />
        <StatCard
          index={3}
          label="Completion"
          value={`${completionRate}%`}
          progress={completionRate}
          icon={Gauge}
          emphasis
        />
      </section>

      {/* Toolbar ---------------------------------------------------- */}
      <section
        aria-label="Filters"
        className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-3 shadow-soft sm:flex-row sm:items-center sm:justify-between"
      >
        <label className="flex h-10 items-center gap-2.5 rounded-lg border border-line bg-surface-2 px-3.5 transition-colors duration-200 hover:border-line-strong sm:w-auto">
          <CalendarClock className="h-4 w-4 shrink-0 text-faint" strokeWidth={1.75} />
          <span className="sr-only">Showing tasks for</span>
          <input
            type="date"
            value={dashboardDateStr}
            onChange={(e) => onDashboardDateChange(e.target.value)}
            className="ds-numeric w-full cursor-pointer bg-transparent text-[13px] font-medium text-ink outline-none sm:w-[132px]"
          />
        </label>

        <div className="flex items-center gap-2">
          <ListFilter
            className="hidden h-4 w-4 shrink-0 text-faint sm:block"
            strokeWidth={1.75}
          />
          <Select
            aria-label="Filter by priority"
            value={priorityFilter}
            onChange={(e) => onPriorityFilterChange(e.target.value)}
            className="w-full text-[13px] sm:w-[150px]"
          >
            <option value="all">All priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </Select>
          <Select
            aria-label="Filter by status"
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="w-full text-[13px] sm:w-[150px]"
          >
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </Select>
        </div>
      </section>

      {/* Task feed -------------------------------------------------- */}
      {/* The empty state sits outside AnimatePresence: mixing a single keyed
          child with a mapped list under `popLayout` leaves the exiting node
          stranded in the DOM. */}
      <section aria-label="Tasks" className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="rounded-2xl border border-line bg-surface shadow-soft">
            {isFiltered ? (
              <EmptyState
                icon={Search}
                title="No matching tasks"
                description="Nothing on this day fits the current search and filters. Try widening them."
              />
            ) : (
              <EmptyState
                icon={Inbox}
                title="A clear day"
                description="Nothing is scheduled yet. Add your first task and it will show up here."
                action={
                  <Button variant="primary" onClick={onQuickAdd}>
                    <Plus className="h-4 w-4" strokeWidth={2.25} />
                    <span>New task</span>
                  </Button>
                }
              />
            )}
          </div>
        ) : (
          <AnimatePresence mode="popLayout" initial={false}>
            {filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                formatTime={formatTime}
                onToggle={onToggle}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </AnimatePresence>
        )}
      </section>
    </div>
  );
}
