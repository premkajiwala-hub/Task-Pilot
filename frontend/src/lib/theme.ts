import { useCallback, useEffect, useRef, useState } from 'react';
import { Moon, Sun, Flame, type LucideIcon } from 'lucide-react';

export type ThemeId = 'nocturne' | 'sandstone' | 'crimson';

export interface ThemeMeta {
  id: ThemeId;
  name: string;
  hint: string;
  icon: LucideIcon;
  /** Swatch shown in the switcher and settings: [surface, accent]. */
  swatch: [string, string];
}

export const THEMES: ThemeMeta[] = [
  {
    id: 'nocturne',
    name: 'Nocturne',
    hint: 'Blue slate and seafoam',
    icon: Moon,
    swatch: ['#18212b', '#7fb6ac'],
  },
  {
    id: 'sandstone',
    name: 'Sandstone',
    hint: 'Warm paper and clay',
    icon: Sun,
    swatch: ['#ffffff', '#8c4f3a'],
  },
  {
    id: 'crimson',
    name: 'Crimson',
    hint: 'Black, white and red',
    icon: Flame,
    swatch: ['#1e1e1e', '#e63946'],
  },
];

const STORAGE_KEY = 'taskpilot-theme';

export const THEME_IDS: ThemeId[] = ['nocturne', 'sandstone', 'crimson'];

/** Themes retired in the redesign, mapped onto their closest replacement. */
const LEGACY_ALIASES: Record<string, ThemeId> = {
  noir: 'nocturne',
  light: 'sandstone',
};

export function normalizeTheme(value: string | null | undefined): ThemeId | null {
  if (!value) return null;
  if ((THEME_IDS as string[]).includes(value)) return value as ThemeId;
  return LEGACY_ALIASES[value] ?? null;
}

/** The PWA / browser-chrome colour that matches each theme's canvas. */
const THEME_COLOR: Record<ThemeId, string> = {
  nocturne: '#0d1218',
  sandstone: '#f5f2ed',
  crimson: '#0d0d0d',
};

function readStoredTheme(): ThemeId {
  if (typeof document !== 'undefined') {
    const fromAttr = normalizeTheme(document.documentElement.getAttribute('data-theme'));
    if (fromAttr) return fromAttr;
  }
  try {
    const fromStorage = normalizeTheme(localStorage.getItem(STORAGE_KEY));
    if (fromStorage) return fromStorage;
  } catch {
    /* storage unavailable */
  }
  return 'nocturne';
}

/**
 * Presentation-only state: reads/writes the `data-theme` attribute that the
 * token layer in index.css keys off. Touches nothing in the task domain.
 */
export function useTheme() {
  const [theme, setThemeState] = useState<ThemeId>(readStoredTheme);
  const isFirstRun = useRef(true);

  useEffect(() => {
    const root = document.documentElement;

    // Crossfade only on an actual switch — never on the initial paint, which
    // would otherwise animate the app in from whatever the default theme was.
    let timer: number | undefined;
    if (!isFirstRun.current) {
      root.classList.add('theme-switching');
      timer = window.setTimeout(() => root.classList.remove('theme-switching'), 260);
    }
    isFirstRun.current = false;

    root.setAttribute('data-theme', theme);
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', THEME_COLOR[theme]);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* storage unavailable — the theme still applies for this session */
    }

    return () => {
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [theme]);

  const setTheme = useCallback((next: ThemeId) => setThemeState(next), []);

  const cycleTheme = useCallback(() => {
    setThemeState((current) => {
      const i = THEMES.findIndex((t) => t.id === current);
      return THEMES[(i + 1) % THEMES.length].id;
    });
  }, []);

  return { theme, setTheme, cycleTheme };
}
