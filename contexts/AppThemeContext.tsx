import React, { createContext, useContext, useMemo, useState } from 'react';

import { Wireframe } from '@/constants/wireframe-theme';

export type AppThemeMode = 'light' | 'dark';

type AppThemeColors = {
  screenBg: string;
  headerText: string;
  headerSubtle: string;
  translucent: string;
};

type AppThemeContextValue = {
  mode: AppThemeMode;
  isDark: boolean;
  colors: AppThemeColors;
  setMode: (mode: AppThemeMode) => void;
  toggleMode: () => void;
};

const lightColors: AppThemeColors = {
  screenBg: Wireframe.screenBg,
  headerText: Wireframe.panelBg,
  headerSubtle: 'rgba(255,255,255,0.76)',
  translucent: 'rgba(255,255,255,0.12)',
};

const darkColors: AppThemeColors = {
  screenBg: '#101828',
  headerText: Wireframe.panelBg,
  headerSubtle: 'rgba(255,255,255,0.7)',
  translucent: 'rgba(255,255,255,0.1)',
};

const AppThemeContext = createContext<AppThemeContextValue | null>(null);

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<AppThemeMode>('light');
  const colors = mode === 'dark' ? darkColors : lightColors;

  const value = useMemo(
    () => ({
      mode,
      isDark: mode === 'dark',
      colors,
      setMode,
      toggleMode: () => setMode((current) => (current === 'dark' ? 'light' : 'dark')),
    }),
    [colors, mode],
  );

  return (
    <AppThemeContext.Provider value={value}>
      {children}
    </AppThemeContext.Provider>
  );
}

export function useAppTheme() {
  const ctx = useContext(AppThemeContext);
  if (!ctx) throw new Error('useAppTheme must be used within AppThemeProvider');
  return ctx;
}
