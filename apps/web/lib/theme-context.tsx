'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'hu_theme';

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('light');

  // Initialize theme from localStorage or document class
  useEffect(() => {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
      const initialTheme: Theme = stored === 'dark' || stored === 'light' || stored === 'system' ? stored : 'light';
      setThemeState(initialTheme);

      const computed = initialTheme === 'system' ? getSystemTheme() : initialTheme;
      setResolvedTheme(computed);
      applyThemeToDocument(computed);
    } catch {
      // Fallback if localStorage unavailable
      const isDark = document.documentElement.classList.contains('dark');
      setResolvedTheme(isDark ? 'dark' : 'light');
    }
  }, []);

  // Apply theme changes to document
  const applyThemeToDocument = (resTheme: ResolvedTheme) => {
    const root = document.documentElement;
    if (resTheme === 'dark') {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch {
      // ignore
    }

    const computed = newTheme === 'system' ? getSystemTheme() : newTheme;
    setResolvedTheme(computed);
    applyThemeToDocument(computed);
  };

  const toggleTheme = () => {
    const isDark =
      typeof document !== 'undefined'
        ? document.documentElement.classList.contains('dark')
        : resolvedTheme === 'dark';
    setTheme(isDark ? 'light' : 'dark');
  };

  // Listen to system changes when in system mode
  useEffect(() => {
    if (theme !== 'system') return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = (e: MediaQueryListEvent) => {
      const newResolved = e.matches ? 'dark' : 'light';
      setResolvedTheme(newResolved);
      applyThemeToDocument(newResolved);
    };
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
