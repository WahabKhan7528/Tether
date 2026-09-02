import { createContext, useContext, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme;
    }
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  const location = useLocation();

  useEffect(() => {
    const isFixedDarkPage = ['/', '/login', '/signup', '/onboarding'].includes(location.pathname);
    const activeTheme = isFixedDarkPage ? 'dark' : theme;
    
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(activeTheme);
    localStorage.setItem('theme', theme);
  }, [theme, location.pathname]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
