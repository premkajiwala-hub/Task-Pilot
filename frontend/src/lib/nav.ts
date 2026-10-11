import {
  LayoutDashboard,
  CalendarDays,
  CalendarRange,
  ChartColumn,
  Settings2,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  /** Must match the values `activeTab` is compared against in App.tsx. */
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  {
    id: 'dashboard',
    name: 'Dashboard',
    description: 'Today at a glance',
    icon: LayoutDashboard,
  },
  {
    id: 'upcoming',
    name: 'Upcoming',
    description: 'What is scheduled next',
    icon: CalendarRange,
  },
  {
    id: 'calendar',
    name: 'Calendar',
    description: 'Plan across the month',
    icon: CalendarDays,
  },
  {
    id: 'analytics',
    name: 'Analytics',
    description: 'Focus, streaks and trends',
    icon: ChartColumn,
  },
  {
    id: 'settings',
    name: 'Settings',
    description: 'Appearance and preferences',
    icon: Settings2,
  },
];

export function getNavItem(id: string): NavItem {
  return NAV_ITEMS.find((item) => item.id === id) ?? NAV_ITEMS[0];
}
