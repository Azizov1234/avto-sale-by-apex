import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeState {
  isDark: boolean;
  toggleTheme: () => void;
  setDark: (val: boolean) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      isDark: false,
      toggleTheme: () => {
        const newDark = !get().isDark;
        set({ isDark: newDark });
        document.documentElement.classList.toggle('dark', newDark);
      },
      setDark: (val) => {
        set({ isDark: val });
        document.documentElement.classList.toggle('dark', val);
      },
    }),
    { name: 'drive-theme' }
  )
);
