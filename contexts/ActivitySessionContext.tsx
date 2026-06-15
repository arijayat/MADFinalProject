import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type { ActivityId } from "@/constants/activities";
import { useAuth } from "@/contexts/AuthContext";
import { useTeam } from "@/contexts/TeamContext";
import type { ActivityPerformer } from "@/types/firestore";
import {
  sessionFromActivityResult,
  toActivitySessionSnapshot,
} from "@/lib/activity-snapshot";
import {
  deleteActivityDraft,
  loadAllActivityDrafts,
  saveActivityDraft,
  sessionFromDraftOrCloud,
} from "@/lib/db/activity-drafts";
import { listTeamActivityResults } from "@/lib/firestore/results";
import type { StoredActivityMedia } from "@/lib/storage/media-expiry";

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
  /** Cloud recording for this drop (30-day retention) */
  video: StoredActivityMedia | null;
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
  movementRangeG?: number;
  peakRotationRadS?: number;
  averageRotationRadS?: number;
  motionQuality?: 'low' | 'steady' | 'active';
};

export type FanAngleReading = {
  label: string;
  angleDegrees: number;
  /** Cloud recording for this trial (30-day retention) */
  video: StoredActivityMedia | null;
};

export type ActivitySession = {
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
  /** Photo of revised parachute design before Action 3 drop */
  parachuteDesignPhotoUrl: string | null;
  parachuteDesignPhotoExpiresAtMs: number | null;
  performer: ActivityPerformer | null;
};

type ActivitySessionContextValue = {
  getSession: (activityId: ActivityId) => ActivitySession;
  isActivityCompleted: (activityId: ActivityId) => boolean;
  markActivityCompleted: (activityId: ActivityId) => void;
  resetActivityForRedo: (activityId: ActivityId) => void;
  setActivityPerformer: (
    activityId: ActivityId,
    performer: ActivityPerformer | null,
  ) => void;
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
  setParachuteDesignPhoto: (
    activityId: ActivityId,
    photo: { url: string; expiresAtMs: number } | null,
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
  parachuteDesignPhotoUrl: null,
  parachuteDesignPhotoExpiresAtMs: null,
  performer: null,
});

function overlayLocalSession(
  base: ReturnType<typeof sessionFromActivityResult>,
  local: ActivitySession,
): ActivitySession {
  return {
    predictions: { ...base.predictions, ...local.predictions },
    decibelReadings:
      local.decibelReadings.length > 0
        ? local.decibelReadings
        : (base.decibelReadings as DecibelReading[]),
    vibrationReadings:
      local.vibrationReadings.length > 0
        ? local.vibrationReadings
        : (base.vibrationReadings as VibrationReading[]),
    performanceReadings:
      local.performanceReadings.length > 0
        ? local.performanceReadings
        : (base.performanceReadings as PerformanceReading[]),
    parachuteReadings:
      local.parachuteReadings.length > 0
        ? local.parachuteReadings
        : (base.parachuteReadings as ParachuteReading[]),
    tapReactionReadings:
      local.tapReactionReadings.length > 0
        ? local.tapReactionReadings
        : (base.tapReactionReadings as TapReactionReading[]),
    tracingReadings:
      local.tracingReadings.length > 0
        ? local.tracingReadings
        : (base.tracingReadings as TracingReading[]),
    breathingReadings:
      local.breathingReadings.length > 0
        ? local.breathingReadings
        : (base.breathingReadings as BreathingReading[]),
    fanAngleReadings:
      local.fanAngleReadings.length > 0
        ? local.fanAngleReadings
        : (base.fanAngleReadings as FanAngleReading[]),
    bounceActual:
      local.bounceActual ?? (base.bounceActual as BounceObservation | null),
    parachuteDesignPhotoUrl:
      local.parachuteDesignPhotoUrl ?? base.parachuteDesignPhotoUrl,
    parachuteDesignPhotoExpiresAtMs:
      local.parachuteDesignPhotoExpiresAtMs ??
      base.parachuteDesignPhotoExpiresAtMs,
    performer: local.performer ?? base.performer ?? null,
  };
}

const ActivitySessionContext =
  createContext<ActivitySessionContextValue | null>(null);

export function ActivitySessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const { teamDocId } = useTeam();
  const teamDocIdRef = useRef(teamDocId);
  teamDocIdRef.current = teamDocId;
  const [sessions, setSessions] = useState<
    Partial<Record<ActivityId, ActivitySession>>
  >({});
  const [completedActivityIds, setCompletedActivityIds] = useState<
    Set<ActivityId>
  >(new Set());

  const persistDraft = useCallback(
    (activityId: ActivityId, session: ActivitySession) => {
      const teamId = teamDocIdRef.current;
      if (!teamId) return;
      void saveActivityDraft(
        teamId,
        activityId,
        toActivitySessionSnapshot(session),
      );
    },
    [],
  );

  const patchSession = useCallback(
    (
      activityId: ActivityId,
      patch: Partial<ActivitySession> | ((current: ActivitySession) => ActivitySession),
    ) => {
      setSessions((prev) => {
        const current = prev[activityId] ?? emptySession();
        const updated =
          typeof patch === "function" ? patch(current) : { ...current, ...patch };
        persistDraft(activityId, updated);
        return { ...prev, [activityId]: updated };
      });
    },
    [persistDraft],
  );

  useEffect(() => {
    if (!user || !teamDocId) {
      setCompletedActivityIds(new Set());
      return;
    }

    let cancelled = false;

    void (async () => {
      const [drafts, cloudResults] = await Promise.all([
        loadAllActivityDrafts(teamDocId),
        listTeamActivityResults(teamDocId),
      ]);
      if (cancelled) return;

      setCompletedActivityIds(
        new Set(Object.keys(cloudResults) as ActivityId[]),
      );

      setSessions((prev) => {
        const next = { ...prev };
        const activityIds = new Set([
          ...Object.keys(drafts),
          ...Object.keys(cloudResults),
        ]);

        for (const activityId of activityIds) {
          const id = activityId as ActivityId;
          const base = sessionFromDraftOrCloud(drafts[id], cloudResults[id]);
          const local = prev[id] ?? emptySession();
          next[id] = overlayLocalSession(base, local);
        }
        return next;
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [user, teamDocId]);

  const getSession = useCallback(
    (activityId: ActivityId) => sessions[activityId] ?? emptySession(),
    [sessions],
  );

  const isActivityCompleted = useCallback(
    (activityId: ActivityId) => completedActivityIds.has(activityId),
    [completedActivityIds],
  );

  const markActivityCompleted = useCallback((activityId: ActivityId) => {
    setCompletedActivityIds((prev) => new Set(prev).add(activityId));
  }, []);

  const resetActivityForRedo = useCallback((activityId: ActivityId) => {
    setSessions((prev) => ({ ...prev, [activityId]: emptySession() }));
    const teamId = teamDocIdRef.current;
    if (teamId) {
      void deleteActivityDraft(teamId, activityId);
    }
  }, []);

  const setActivityPerformer = useCallback(
    (activityId: ActivityId, performer: ActivityPerformer | null) => {
      patchSession(activityId, { performer });
    },
    [patchSession],
  );

  const setPredictions = useCallback(
    (activityId: ActivityId, predictions: Record<string, string>) => {
      patchSession(activityId, { predictions });
    },
    [patchSession],
  );

  const setDecibelReadings = useCallback(
    (activityId: ActivityId, readings: DecibelReading[]) => {
      patchSession(activityId, { decibelReadings: readings });
    },
    [patchSession],
  );

  const setVibrationReadings = useCallback(
    (activityId: ActivityId, readings: VibrationReading[]) => {
      patchSession(activityId, { vibrationReadings: readings });
    },
    [patchSession],
  );

  const setPerformanceReadings = useCallback(
    (activityId: ActivityId, readings: PerformanceReading[]) => {
      patchSession(activityId, { performanceReadings: readings });
    },
    [patchSession],
  );

  const setParachuteReadings = useCallback(
    (activityId: ActivityId, readings: ParachuteReading[]) => {
      patchSession(activityId, { parachuteReadings: readings });
    },
    [patchSession],
  );

  const setBounceActual = useCallback(
    (activityId: ActivityId, value: BounceObservation | null) => {
      patchSession(activityId, { bounceActual: value });
    },
    [patchSession],
  );

  const setParachuteDesignPhoto = useCallback(
    (activityId: ActivityId, photo: { url: string; expiresAtMs: number } | null) => {
      patchSession(activityId, {
        parachuteDesignPhotoUrl: photo?.url ?? null,
        parachuteDesignPhotoExpiresAtMs: photo?.expiresAtMs ?? null,
      });
    },
    [patchSession],
  );

  const setTapReactionReadings = useCallback(
    (activityId: ActivityId, readings: TapReactionReading[]) => {
      patchSession(activityId, { tapReactionReadings: readings });
    },
    [patchSession],
  );

  const setTracingReadings = useCallback(
    (activityId: ActivityId, readings: TracingReading[]) => {
      patchSession(activityId, { tracingReadings: readings });
    },
    [patchSession],
  );

  const setBreathingReadings = useCallback(
    (activityId: ActivityId, readings: BreathingReading[]) => {
      patchSession(activityId, { breathingReadings: readings });
    },
    [patchSession],
  );

  const setFanAngleReadings = useCallback(
    (activityId: ActivityId, readings: FanAngleReading[]) => {
      patchSession(activityId, { fanAngleReadings: readings });
    },
    [patchSession],
  );

  const clearCapture = useCallback(
    (activityId: ActivityId) => {
      patchSession(activityId, (current) => ({
        ...current,
        decibelReadings: [],
        vibrationReadings: [],
        performanceReadings: [],
        parachuteReadings: [],
        tapReactionReadings: [],
        tracingReadings: [],
        breathingReadings: [],
        fanAngleReadings: [],
        bounceActual: null,
      }));
    },
    [patchSession],
  );

  const value = useMemo(
    () => ({
      getSession,
      isActivityCompleted,
      markActivityCompleted,
      resetActivityForRedo,
      setActivityPerformer,
      setPredictions,
      setDecibelReadings,
      setVibrationReadings,
      setPerformanceReadings,
      setParachuteReadings,
      setBounceActual,
      setParachuteDesignPhoto,
      setTapReactionReadings,
      setTracingReadings,
      setBreathingReadings,
      setFanAngleReadings,
      clearCapture,
    }),
    [
      getSession,
      isActivityCompleted,
      markActivityCompleted,
      resetActivityForRedo,
      setActivityPerformer,
      setPredictions,
      setDecibelReadings,
      setVibrationReadings,
      setPerformanceReadings,
      setParachuteReadings,
      setBounceActual,
      setParachuteDesignPhoto,
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
