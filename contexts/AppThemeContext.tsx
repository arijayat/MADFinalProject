import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { Wireframe } from '@/constants/wireframe-theme';
import { useAuth } from '@/contexts/AuthContext';
import { updateUserPreferences } from '@/lib/firestore/users';
import { defaultUserPreferences } from '@/types/firestore';

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
  const { user, profile } = useAuth();
  const [mode, setModeState] = useState<AppThemeMode>(defaultUserPreferences.themeMode);
  const colors = mode === 'dark' ? darkColors : lightColors;

  useEffect(() => {
    if (!user) {
      setModeState(defaultUserPreferences.themeMode);
      return;
    }

    const saved = profile?.preferences?.themeMode;
    if (saved === 'light' || saved === 'dark') {
      setModeState(saved);
    }
  }, [user?.uid, profile?.preferences?.themeMode]);

  const persistMode = useCallback(
    (nextMode: AppThemeMode) => {
      if (!user) return;
      void updateUserPreferences(user.uid, { themeMode: nextMode }).catch((error) => {
        console.error('Failed to save theme preference', error);
      });
    },
    [user],
  );

  const setMode = useCallback(
    (nextMode: AppThemeMode) => {
      setModeState(nextMode);
      persistMode(nextMode);
    },
    [persistMode],
  );

  const toggleMode = useCallback(() => {
    setModeState((current) => {
      const nextMode = current === 'dark' ? 'light' : 'dark';
      persistMode(nextMode);
      return nextMode;
    });
  }, [persistMode]);

  const value = useMemo(
    () => ({
      mode,
      isDark: mode === 'dark',
      colors,
      setMode,
      toggleMode,
    }),
    [colors, mode, setMode, toggleMode],
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
