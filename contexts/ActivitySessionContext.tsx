import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import type { ActivityId } from "@/constants/activities";
import { useAuth } from "@/contexts/AuthContext";
import { useTeam } from "@/contexts/TeamContext";
import { sessionFromActivityResult } from "@/lib/activity-snapshot";
import { listTeamActivityResults } from "@/lib/firestore/results";

export type DecibelReading = {
  label: string;
  peakDb: number;
};

export type VibrationReading = {
  label: string;
  peakTiltDeg: number;
  peakVibrationMs2: number;
  startLevelDeg: number;
};

export type PerformanceReading = {
  label: string;
  peakVibrationMs2: number;
  durationS: number;
  hapticFeedback: boolean;
  attempt: 1 | 2;
};

export type BounceObservation = "No bounce" | "Bounce";

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

export type TapReactionReading = {
  hand: "dominant" | "non_dominant";
  attempt: 1 | 2 | 3;
  reactionTimeMs: number;
  falseStart: boolean;
};

export type TracingReading = {
  attempt: 1 | 2 | 3;
  /** 0–100, higher = closer to the moving target */
  accuracyPct: number;
  /** Average lag behind the target (ms) */
  avgDelayMs: number;
};

export type BreathingReading = {
  label: string;
  breathCount: number;
  breathsPerMinute: number;
  durationS: number;
  peakMovementMs2: number;
};

export type FanAngleReading = {
  label: string;
  angleDegrees: number;
};

type ActivitySession = {
  predictions: Record<string, string>;
  decibelReadings: DecibelReading[];
  vibrationReadings: VibrationReading[];
  performanceReadings: PerformanceReading[];
  parachuteReadings: ParachuteReading[];
  tapReactionReadings: TapReactionReading[];
  tracingReadings: TracingReading[];
  breathingReadings: BreathingReading[];
  fanAngleReadings: FanAngleReading[];
  /** Landing bounce observed on best-design drop (Action 3), if set on dashboard */
  bounceActual: BounceObservation | null;
};

type ActivitySessionContextValue = {
  getSession: (activityId: ActivityId) => ActivitySession;
  setPredictions: (
    activityId: ActivityId,
    predictions: Record<string, string>,
  ) => void;
  setDecibelReadings: (
    activityId: ActivityId,
    readings: DecibelReading[],
  ) => void;
  setVibrationReadings: (
    activityId: ActivityId,
    readings: VibrationReading[],
  ) => void;
  setPerformanceReadings: (
    activityId: ActivityId,
    readings: PerformanceReading[],
  ) => void;
  setParachuteReadings: (
    activityId: ActivityId,
    readings: ParachuteReading[],
  ) => void;
  setBounceActual: (
    activityId: ActivityId,
    value: BounceObservation | null,
  ) => void;
  setTapReactionReadings: (
    activityId: ActivityId,
    readings: TapReactionReading[],
  ) => void;
  setTracingReadings: (
    activityId: ActivityId,
    readings: TracingReading[],
  ) => void;
  setBreathingReadings: (
    activityId: ActivityId,
    readings: BreathingReading[],
  ) => void;
  setFanAngleReadings: (
    activityId: ActivityId,
    readings: FanAngleReading[],
  ) => void;
  clearCapture: (activityId: ActivityId) => void;
};

const emptySession = (): ActivitySession => ({
  predictions: {},
  decibelReadings: [],
  vibrationReadings: [],
  performanceReadings: [],
  parachuteReadings: [],
  tapReactionReadings: [],
  tracingReadings: [],
  breathingReadings: [],
  fanAngleReadings: [],
  bounceActual: null,
});

const ActivitySessionContext =
  createContext<ActivitySessionContextValue | null>(null);

export function ActivitySessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const { teamDocId } = useTeam();
  const [sessions, setSessions] = useState<
    Partial<Record<ActivityId, ActivitySession>>
  >({});

  useEffect(() => {
    if (!user || !teamDocId) return;

    let cancelled = false;

    void listTeamActivityResults(teamDocId).then((saved) => {
      if (cancelled) return;
      setSessions((prev) => {
        const next = { ...prev };
        for (const [activityId, doc] of Object.entries(saved)) {
          const id = activityId as ActivityId;
          const fromCloud = sessionFromActivityResult(doc);
          const local = prev[id] ?? emptySession();
          next[id] = {
            predictions: { ...fromCloud.predictions, ...local.predictions },
            decibelReadings:
              local.decibelReadings.length > 0
                ? local.decibelReadings
                : (fromCloud.decibelReadings as DecibelReading[]),
            vibrationReadings:
              local.vibrationReadings.length > 0
                ? local.vibrationReadings
                : (fromCloud.vibrationReadings as VibrationReading[]),
            performanceReadings:
              local.performanceReadings.length > 0
                ? local.performanceReadings
                : (fromCloud.performanceReadings as PerformanceReading[]),
            parachuteReadings:
              local.parachuteReadings.length > 0
                ? local.parachuteReadings
                : (fromCloud.parachuteReadings as ParachuteReading[]),
            tapReactionReadings:
              local.tapReactionReadings.length > 0
                ? local.tapReactionReadings
                : (fromCloud.tapReactionReadings as TapReactionReading[]),
            tracingReadings:
              local.tracingReadings.length > 0
                ? local.tracingReadings
                : (fromCloud.tracingReadings as TracingReading[]),
            breathingReadings:
              local.breathingReadings.length > 0
                ? local.breathingReadings
                : (fromCloud.breathingReadings as BreathingReading[]),
            fanAngleReadings:
              local.fanAngleReadings.length > 0
                ? local.fanAngleReadings
                : (fromCloud.fanAngleReadings as FanAngleReading[]),
            bounceActual:
              local.bounceActual ??
              (fromCloud.bounceActual as BounceObservation | null),
          };
        }
        return next;
      });
    });

    return () => {
      cancelled = true;
    };
  }, [user, teamDocId]);

  const getSession = useCallback(
    (activityId: ActivityId) => sessions[activityId] ?? emptySession(),
    [sessions],
  );

  const setPredictions = useCallback(
    (activityId: ActivityId, predictions: Record<string, string>) => {
      setSessions((prev) => ({
        ...prev,
        [activityId]: { ...(prev[activityId] ?? emptySession()), predictions },
      }));
    },
    [],
  );

  const setDecibelReadings = useCallback(
    (activityId: ActivityId, readings: DecibelReading[]) => {
      setSessions((prev) => ({
        ...prev,
        [activityId]: {
          ...(prev[activityId] ?? emptySession()),
          decibelReadings: readings,
        },
      }));
    },
    [],
  );

  const setVibrationReadings = useCallback(
    (activityId: ActivityId, readings: VibrationReading[]) => {
      setSessions((prev) => ({
        ...prev,
        [activityId]: {
          ...(prev[activityId] ?? emptySession()),
          vibrationReadings: readings,
        },
      }));
    },
    [],
  );

  const setPerformanceReadings = useCallback(
    (activityId: ActivityId, readings: PerformanceReading[]) => {
      setSessions((prev) => ({
        ...prev,
        [activityId]: {
          ...(prev[activityId] ?? emptySession()),
          performanceReadings: readings,
        },
      }));
    },
    [],
  );

  const setParachuteReadings = useCallback(
    (activityId: ActivityId, readings: ParachuteReading[]) => {
      setSessions((prev) => ({
        ...prev,
        [activityId]: {
          ...(prev[activityId] ?? emptySession()),
          parachuteReadings: readings,
        },
      }));
    },
    [],
  );

  const setBounceActual = useCallback(
    (activityId: ActivityId, value: BounceObservation | null) => {
      setSessions((prev) => ({
        ...prev,
        [activityId]: {
          ...(prev[activityId] ?? emptySession()),
          bounceActual: value,
        },
      }));
    },
    [],
  );

  const setTapReactionReadings = useCallback(
    (activityId: ActivityId, readings: TapReactionReading[]) => {
      setSessions((prev) => ({
        ...prev,
        [activityId]: {
          ...(prev[activityId] ?? emptySession()),
          tapReactionReadings: readings,
        },
      }));
    },
    [],
  );

  const setTracingReadings = useCallback(
    (activityId: ActivityId, readings: TracingReading[]) => {
      setSessions((prev) => ({
        ...prev,
        [activityId]: {
          ...(prev[activityId] ?? emptySession()),
          tracingReadings: readings,
        },
      }));
    },
    [],
  );

  const setBreathingReadings = useCallback(
    (activityId: ActivityId, readings: BreathingReading[]) => {
      setSessions((prev) => ({
        ...prev,
        [activityId]: {
          ...(prev[activityId] ?? emptySession()),
          breathingReadings: readings,
        },
      }));
    },
    [],
  );

  const setFanAngleReadings = useCallback(
    (activityId: ActivityId, readings: FanAngleReading[]) => {
      setSessions((prev) => ({
        ...prev,
        [activityId]: {
          ...(prev[activityId] ?? emptySession()),
          fanAngleReadings: readings,
        },
      }));
    },
    [],
  );

  const clearCapture = useCallback((activityId: ActivityId) => {
    setSessions((prev) => ({
      ...prev,
      [activityId]: {
        ...(prev[activityId] ?? emptySession()),
        decibelReadings: [],
        vibrationReadings: [],
        performanceReadings: [],
        parachuteReadings: [],
        tapReactionReadings: [],
        tracingReadings: [],
        breathingReadings: [],
        fanAngleReadings: [],
        bounceActual: null,
      },
    }));
  }, []);

  const value = useMemo(
    () => ({
      getSession,
      setPredictions,
      setDecibelReadings,
      setVibrationReadings,
      setPerformanceReadings,
      setParachuteReadings,
      setBounceActual,
      setTapReactionReadings,
      setTracingReadings,
      setBreathingReadings,
      setFanAngleReadings,
      clearCapture,
    }),
    [
      getSession,
      setPredictions,
      setDecibelReadings,
      setVibrationReadings,
      setPerformanceReadings,
      setParachuteReadings,
      setBounceActual,
      setTapReactionReadings,
      setTracingReadings,
      setBreathingReadings,
      setFanAngleReadings,
      clearCapture,
    ],
  );

  return (
    <ActivitySessionContext.Provider value={value}>
      {children}
    </ActivitySessionContext.Provider>
  );
}

export function useActivitySession() {
  const ctx = useContext(ActivitySessionContext);
  if (!ctx)
    throw new Error(
      "useActivitySession must be used within ActivitySessionProvider",
    );
  return ctx;
}
