import { Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';
import { useThemeStore } from '../store/useThemeStore';

export function ThemeToggle() {
  const { isDark, toggleTheme } = useThemeStore();

  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={toggleTheme}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="relative w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition-colors focus:outline-none"
      aria-label="Toggle dark mode"
    >
      <motion.div
        key={isDark ? 'moon' : 'sun'}
        initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
        animate={{ rotate: 0,   opacity: 1, scale: 1   }}
        exit={{    rotate:  90, opacity: 0, scale: 0.5 }}
        transition={{ duration: 0.25 }}
      >
        {isDark
          ? <Sun  size={20} className="text-amber-400" />
          : <Moon size={20} className="text-gray-500"  />
        }
      </motion.div>
    </motion.button>
  );
}
