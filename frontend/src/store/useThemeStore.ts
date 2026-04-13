import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'light' | 'dark' | 'ocean';

interface ThemeState {
  theme: ThemeMode;
  isDark: boolean;
  setTheme: (theme: ThemeMode) => void;
  cycleTheme: () => void;
  toggleTheme: () => void;
}

const THEME_ORDER: ThemeMode[] = ['light', 'dark', 'ocean'];

export function applyThemeToDocument(theme: ThemeMode) {
  const root = document.documentElement;

  root.classList.remove('dark', 'theme-light', 'theme-dark', 'theme-ocean');
  root.classList.add(`theme-${theme}`);

  if (theme === 'dark') {
    root.classList.add('dark');
  }
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      isDark: false,
      setTheme: (theme) => {
        set({ theme, isDark: theme === 'dark' });
        applyThemeToDocument(theme);
      },
      cycleTheme: () => {
        const current = get().theme;
        const currentIndex = THEME_ORDER.indexOf(current);
        const nextTheme = THEME_ORDER[(currentIndex + 1) % THEME_ORDER.length];
        get().setTheme(nextTheme);
      },
      toggleTheme: () => {
        const nextTheme = get().theme === 'dark' ? 'light' : 'dark';
        get().setTheme(nextTheme);
      },
    }),
    { name: 'drive-theme' },
  ),
);
