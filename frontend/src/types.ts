export interface Task {
  id: number;
  title: string;
  description?: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  date: string;
  start_time: string;
  end_time: string;
  is_completed: boolean;
  repeat: 'none' | 'daily' | 'weekly';
  color: string;
}

export interface TaskFormData {
  title: string;
  description: string;
  category: string;
  priority: string;
  date: string;
  start_time: string;
  end_time: string;
  repeat: string;
  color: string;
}

export const CATEGORIES = ['Work', 'Personal', 'Health', 'Design'] as const;

/** Accent swatches offered in the task modal; matches the stored `color`. */
export const TASK_COLORS = [
  '#3b82f6',
  '#8b5cf6',
  '#e63946',
  '#f59e0b',
  '#10b981',
  '#64748b',
] as const;
