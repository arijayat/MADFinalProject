import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

import type { ActivityId } from '@/constants/activities';

export type DecibelReading = {
  label: string;
  peakDb: number;
};

type ActivitySession = {
  predictions: Record<string, string>;
  decibelReadings: DecibelReading[];
};

type ActivitySessionContextValue = {
  getSession: (activityId: ActivityId) => ActivitySession;
  setPredictions: (activityId: ActivityId, predictions: Record<string, string>) => void;
  setDecibelReadings: (activityId: ActivityId, readings: DecibelReading[]) => void;
  clearCapture: (activityId: ActivityId) => void;
};

const emptySession = (): ActivitySession => ({
  predictions: {},
  decibelReadings: [],
});

const ActivitySessionContext = createContext<ActivitySessionContextValue | null>(null);

export function ActivitySessionProvider({ children }: { children: React.ReactNode }) {
  const [sessions, setSessions] = useState<Partial<Record<ActivityId, ActivitySession>>>({});

  const getSession = useCallback(
    (activityId: ActivityId) => sessions[activityId] ?? emptySession(),
    [sessions]
  );

  const setPredictions = useCallback((activityId: ActivityId, predictions: Record<string, string>) => {
    setSessions((prev) => ({
      ...prev,
      [activityId]: { ...(prev[activityId] ?? emptySession()), predictions },
    }));
  }, []);

  const setDecibelReadings = useCallback((activityId: ActivityId, readings: DecibelReading[]) => {
    setSessions((prev) => ({
      ...prev,
      [activityId]: { ...(prev[activityId] ?? emptySession()), decibelReadings: readings },
    }));
  }, []);

  const clearCapture = useCallback((activityId: ActivityId) => {
    setSessions((prev) => ({
      ...prev,
      [activityId]: { ...(prev[activityId] ?? emptySession()), decibelReadings: [] },
    }));
  }, []);

  const value = useMemo(
    () => ({ getSession, setPredictions, setDecibelReadings, clearCapture }),
    [getSession, setPredictions, setDecibelReadings, clearCapture]
  );

  return <ActivitySessionContext.Provider value={value}>{children}</ActivitySessionContext.Provider>;
}

export function useActivitySession() {
  const ctx = useContext(ActivitySessionContext);
  if (!ctx) throw new Error('useActivitySession must be used within ActivitySessionProvider');
  return ctx;
}
