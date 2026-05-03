import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface ThemeContextType {
  isDark: boolean;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextType>({ isDark: false, toggle: () => {} });

// Apply dark class immediately (before React renders) to avoid flash
function getInitialTheme(): boolean {
  try {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') return true;
    if (saved === 'light') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  } catch {
    return false;
  }
}

function applyTheme(dark: boolean) {
  const root = document.documentElement;
  if (dark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
  try {
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  } catch {}
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDark, setIsDark] = useState<boolean>(() => {
    const initial = getInitialTheme();
    // Apply immediately on init
    applyTheme(initial);
    return initial;
  });

  const toggle = useCallback(() => {
    setIsDark(prev => {
      const next = !prev;
      applyTheme(next);
      return next;
    });
  }, []);

  // Sync on mount in case state and DOM diverge
  useEffect(() => {
    applyTheme(isDark);
  }, []);

  return (
    <ThemeContext.Provider value={{ isDark, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
