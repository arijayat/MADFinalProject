import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

import type { ActivityId } from '@/constants/activities';

export type DecibelReading = {
  label: string;
  peakDb: number;
};

export type BounceObservation = 'No bounce' | 'Bounce';

export type ParachuteReading = {
  label: string;
  /** Time from release to first ground contact (s), from video timestamp */
  fallTimeS: number;
  /** Time from first contact until toy stops (s), from slow-motion video */
  contactTimeS: number | null;
  /** Time from bounce leave to max height (s), for bounce g-force */
  reboundTimeS: number | null;
  /** What you saw on landing (from slow-motion review) */
  observedBounce: BounceObservation | null;
};

type ActivitySession = {
  predictions: Record<string, string>;
  decibelReadings: DecibelReading[];
  parachuteReadings: ParachuteReading[];
  /** Landing bounce observed on best-design drop (Action 3), if set on dashboard */
  bounceActual: BounceObservation | null;
};

type ActivitySessionContextValue = {
  getSession: (activityId: ActivityId) => ActivitySession;
  setPredictions: (activityId: ActivityId, predictions: Record<string, string>) => void;
  setDecibelReadings: (activityId: ActivityId, readings: DecibelReading[]) => void;
  setParachuteReadings: (activityId: ActivityId, readings: ParachuteReading[]) => void;
  setBounceActual: (activityId: ActivityId, value: BounceObservation | null) => void;
  clearCapture: (activityId: ActivityId) => void;
};

const emptySession = (): ActivitySession => ({
  predictions: {},
  decibelReadings: [],
  parachuteReadings: [],
  bounceActual: null,
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

  const setParachuteReadings = useCallback((activityId: ActivityId, readings: ParachuteReading[]) => {
    setSessions((prev) => ({
      ...prev,
      [activityId]: { ...(prev[activityId] ?? emptySession()), parachuteReadings: readings },
    }));
  }, []);

  const setBounceActual = useCallback((activityId: ActivityId, value: BounceObservation | null) => {
    setSessions((prev) => ({
      ...prev,
      [activityId]: { ...(prev[activityId] ?? emptySession()), bounceActual: value },
    }));
  }, []);

  const clearCapture = useCallback((activityId: ActivityId) => {
    setSessions((prev) => ({
      ...prev,
      [activityId]: {
        ...(prev[activityId] ?? emptySession()),
        decibelReadings: [],
        parachuteReadings: [],
        bounceActual: null,
      },
    }));
  }, []);

  const value = useMemo(
    () => ({
      getSession,
      setPredictions,
      setDecibelReadings,
      setParachuteReadings,
      setBounceActual,
      clearCapture,
    }),
    [getSession, setPredictions, setDecibelReadings, setParachuteReadings, setBounceActual, clearCapture]
  );

  return <ActivitySessionContext.Provider value={value}>{children}</ActivitySessionContext.Provider>;
}

export function useActivitySession() {
  const ctx = useContext(ActivitySessionContext);
  if (!ctx) throw new Error('useActivitySession must be used within ActivitySessionProvider');
  return ctx;
}
