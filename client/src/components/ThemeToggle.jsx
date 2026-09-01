import { useTheme } from '../context/ThemeContext';
import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      className={`relative w-14 h-8 flex items-center rounded-full p-1 transition-colors duration-500 ${
        isDark ? 'bg-ethereal-outline' : 'bg-ethereal-primary/20'
      }`}
      aria-label="Toggle dark mode"
    >
      <motion.div
        className="w-6 h-6 rounded-full bg-ethereal-surface shadow-sm flex items-center justify-center z-10 relative"
        initial={false}
        animate={{
          x: isDark ? 24 : 0,
        }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        {isDark ? (
          <Moon size={12} className="text-ethereal-tertiary" strokeWidth={2.5} />
        ) : (
          <Sun size={12} className="text-ethereal-primary" strokeWidth={2.5} />
        )}
      </motion.div>
    </button>
  );
}
