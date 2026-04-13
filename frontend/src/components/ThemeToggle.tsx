import { Moon, Sun, Waves } from 'lucide-react';
import { motion } from 'framer-motion';
import { useThemeStore } from '../store/useThemeStore';

const THEME_LABEL: Record<'light' | 'dark' | 'ocean', string> = {
  light: 'Light',
  dark: 'Dark',
  ocean: 'Ocean',
};

export function ThemeToggle() {
  const { theme, cycleTheme } = useThemeStore();

  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={cycleTheme}
      title={`Theme: ${THEME_LABEL[theme]}. Click to switch`}
      className="relative flex h-10 min-w-20 items-center justify-center gap-1.5 rounded-xl px-2 hover:bg-gray-100 transition-colors focus:outline-none dark:hover:bg-white/10"
      aria-label="Switch theme mode"
    >
      {theme === 'dark' ? (
        <Moon size={18} className="text-slate-400" />
      ) : theme === 'ocean' ? (
        <Waves size={18} className="text-cyan-500" />
      ) : (
        <Sun size={18} className="text-amber-500" />
      )}
      <span className="text-[11px] font-bold uppercase tracking-wide text-gray-600 dark:text-gray-300">
        {THEME_LABEL[theme]}
      </span>
    </motion.button>
  );
}
