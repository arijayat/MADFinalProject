import React, { createContext, useContext, useMemo, useState } from 'react';

import { Wireframe } from '@/constants/wireframe-theme';

export type AppThemeMode = 'light' | 'dark';

type AppThemeColors = {
  screenBg: string;
  panelBg: string;
  surfaceAlt: string;
  text: string;
  textMuted: string;
  border: string;
  accentSoft: string;
  shadow: string;
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
  panelBg: Wireframe.panelBg,
  surfaceAlt: Wireframe.surfaceAlt,
  text: Wireframe.text,
  textMuted: Wireframe.textMuted,
  border: Wireframe.border,
  accentSoft: Wireframe.accentSoft,
  shadow: Wireframe.shadow,
  headerText: Wireframe.panelBg,
  headerSubtle: 'rgba(255,255,255,0.76)',
  translucent: 'rgba(255,255,255,0.12)',
};

const darkColors: AppThemeColors = {
  screenBg: '#0b1220',
  panelBg: '#111827',
  surfaceAlt: '#1f2937',
  text: '#ffffff',
  textMuted: '#d1d5db',
  border: '#374151',
  accentSoft: '#1f4654',
  shadow: '0 8px 24px rgba(0, 0, 0, 0.28)',
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
