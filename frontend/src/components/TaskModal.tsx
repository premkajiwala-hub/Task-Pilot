import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check } from 'lucide-react';
import { Button } from './ui/Button';
import { Input, Select, FormRow, Label } from './ui/Field';
import { CATEGORIES, TASK_COLORS, type TaskFormData } from '../types';
import { cn } from '../lib/utils';

const EASE = [0.22, 1, 0.36, 1] as const;

const PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
] as const;

const REPEATS = [
  { value: 'none', label: 'Once' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
] as const;

/** Segmented control — same semantics as a select, far less chrome. */
function Segmented({
  name,
  value,
  options,
  onChange,
}: {
  name: string;
  value: string;
  options: readonly { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={name}
      className="flex items-center gap-1 rounded-lg border border-line bg-surface-2 p-1"
    >
      {options.map((option) => {
        const isActive = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => onChange(option.value)}
            className={cn(
              'relative flex-1 rounded-md px-2 py-1.5 text-[12.5px] font-medium',
              'cursor-pointer transition-colors duration-200',
              isActive ? 'text-accent-ink' : 'text-muted hover:text-ink',
            )}
          >
            {isActive && (
              <motion.span
                layoutId={`segmented-${name}`}
                transition={{ type: 'spring', stiffness: 480, damping: 36 }}
                className="absolute inset-0 rounded-md bg-accent shadow-soft"
              />
            )}
            <span className="relative">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function ColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div role="radiogroup" aria-label="Task colour" className="flex items-center gap-2">
      {TASK_COLORS.map((color) => {
        const isActive = value.toLowerCase() === color.toLowerCase();
        return (
          <button
            key={color}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={`Colour ${color}`}
            onClick={() => onChange(color)}
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-full',
              'cursor-pointer transition-transform duration-200 hover:scale-110',
              isActive && 'ring-2 ring-offset-2 ring-offset-surface',
            )}
            style={{
              backgroundColor: color,
              ...(isActive ? { boxShadow: `0 0 0 2px ${color}` } : {}),
            }}
          >
            {isActive && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
          </button>
        );
      })}
    </div>
  );
}

export interface TaskModalProps {
  open: boolean;
  isEditing: boolean;
  formData: TaskFormData;
  onFieldChange: (patch: Partial<TaskFormData>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export function TaskModal({
  open,
  isEditing,
  formData,
  onFieldChange,
  onSubmit,
  onClose,
}: TaskModalProps) {
  const titleRef = useRef<HTMLInputElement>(null);

  // Read through a ref so the effect below never has to depend on the
  // identity of `onClose`.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Escape to dismiss, and lock the page behind the modal.
  //
  // Depends on `open` alone, and that matters: this effect autofocuses the
  // title. When it also depended on `onClose`, any parent re-render that
  // produced a new callback re-ran it — so every keystroke in Description, and
  // every date/time change, re-armed the timer and yanked focus back to Title
  // 120ms later. Keyed to open/close only, the focus happens exactly once per
  // opening, which is the intent.
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);

    const focusTimer = window.setTimeout(() => titleRef.current?.focus(), 120);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
      window.clearTimeout(focusTimer);
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={onClose}
            className="absolute inset-0 bg-scrim backdrop-blur-md"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="task-modal-title"
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.32, ease: EASE }}
            className={cn(
              'relative z-10 flex max-h-[92dvh] w-full flex-col overflow-hidden',
              'rounded-t-3xl sm:rounded-3xl sm:max-w-[540px]',
              'border border-line bg-surface shadow-modal ds-sheen',
            )}
          >
            {/* Header ------------------------------------------------- */}
            <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
              <div className="min-w-0">
                <h3
                  id="task-modal-title"
                  className="text-[17px] font-semibold leading-tight text-ink"
                >
                  {isEditing ? 'Edit task' : 'New task'}
                </h3>
                <p className="mt-1 text-[13px] text-muted">
                  {isEditing
                    ? 'Update the details and save your changes.'
                    : 'Give it a name, a slot in the day, and a priority.'}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-faint transition-colors duration-200 hover:bg-accent-soft hover:text-ink cursor-pointer"
              >
                <X className="h-[18px] w-[18px]" strokeWidth={1.75} />
              </button>
            </div>

            {/* Body --------------------------------------------------- */}
            <form
              id="task-form"
              onSubmit={onSubmit}
              className="ds-scroll flex-1 space-y-5 overflow-y-auto px-6 py-6"
            >
              <FormRow label="Title" htmlFor="task-title">
                <Input
                  ref={titleRef}
                  id="task-title"
                  type="text"
                  required
                  placeholder="What needs doing?"
                  value={formData.title}
                  onChange={(e) => onFieldChange({ title: e.target.value })}
                />
              </FormRow>

              <FormRow label="Description" htmlFor="task-description">
                <Input
                  id="task-description"
                  type="text"
                  placeholder="Optional detail"
                  value={formData.description}
                  onChange={(e) => onFieldChange({ description: e.target.value })}
                />
              </FormRow>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <FormRow label="Category" htmlFor="task-category">
                  <Select
                    id="task-category"
                    value={formData.category}
                    onChange={(e) => onFieldChange({ category: e.target.value })}
                  >
                    {CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </Select>
                </FormRow>

                <FormRow label="Date" htmlFor="task-date">
                  <Input
                    id="task-date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => onFieldChange({ date: e.target.value })}
                    className="ds-numeric cursor-pointer"
                  />
                </FormRow>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <FormRow label="Starts" htmlFor="task-start">
                  <Input
                    id="task-start"
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => onFieldChange({ start_time: e.target.value })}
                    className="ds-numeric cursor-pointer"
                  />
                </FormRow>

                <FormRow label="Ends" htmlFor="task-end">
                  <Input
                    id="task-end"
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => onFieldChange({ end_time: e.target.value })}
                    className="ds-numeric cursor-pointer"
                  />
                </FormRow>
              </div>

              <div>
                <Label>Priority</Label>
                <Segmented
                  name="priority"
                  value={formData.priority}
                  options={PRIORITIES}
                  onChange={(value) => onFieldChange({ priority: value })}
                />
              </div>

              <div>
                <Label>Repeats</Label>
                <Segmented
                  name="repeat"
                  value={formData.repeat}
                  options={REPEATS}
                  onChange={(value) => onFieldChange({ repeat: value })}
                />
              </div>

              <div>
                <Label>Colour</Label>
                <ColorPicker
                  value={formData.color}
                  onChange={(value) => onFieldChange({ color: value })}
                />
              </div>
            </form>

            {/* Footer ------------------------------------------------- */}
            <div className="flex items-center justify-end gap-2 border-t border-line bg-surface-2/40 px-6 py-4">
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" form="task-form" variant="primary">
                {isEditing ? 'Save changes' : 'Create task'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
