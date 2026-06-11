import type { ActivityId } from '@/constants/activities';
import type { ActivitySessionSnapshot } from '@/lib/firestore/results';
import type { ActivityResultDocument } from '@/types/firestore';
import type { BounceObservation } from '@/contexts/ActivitySessionContext';
import type { ActivityPerformer } from '@/types/firestore';

type SessionLike = {
  predictions: Record<string, string>;
  decibelReadings: unknown[];
  vibrationReadings: unknown[];
  performanceReadings: unknown[];
  parachuteReadings: unknown[];
  tapReactionReadings: unknown[];
  tracingReadings: unknown[];
  breathingReadings: unknown[];
  fanAngleReadings: unknown[];
  bounceActual: string | null;
  parachuteDesignPhotoUrl: string | null;
  parachuteDesignPhotoExpiresAtMs: number | null;
  performer?: ActivityPerformer | null;
};

export function toActivitySessionSnapshot(session: SessionLike): ActivitySessionSnapshot {
  return {
    predictions: session.predictions,
    decibelReadings: session.decibelReadings,
    vibrationReadings: session.vibrationReadings,
    performanceReadings: session.performanceReadings,
    parachuteReadings: session.parachuteReadings,
    tapReactionReadings: session.tapReactionReadings,
    tracingReadings: session.tracingReadings,
    breathingReadings: session.breathingReadings,
    fanAngleReadings: session.fanAngleReadings,
    bounceActual: session.bounceActual,
    parachuteDesignPhotoUrl: session.parachuteDesignPhotoUrl,
    parachuteDesignPhotoExpiresAtMs: session.parachuteDesignPhotoExpiresAtMs,
    performer: session.performer ?? null,
  };
}

export function sessionFromActivityResult(
  doc: ActivityResultDocument,
): SessionLike {
  return {
    predictions: doc.predictions ?? {},
    decibelReadings: doc.decibelReadings ?? [],
    vibrationReadings: doc.vibrationReadings ?? [],
    performanceReadings: doc.performanceReadings ?? [],
    parachuteReadings: doc.parachuteReadings ?? [],
    tapReactionReadings: doc.tapReactionReadings ?? [],
    tracingReadings: doc.tracingReadings ?? [],
    breathingReadings: doc.breathingReadings ?? [],
    fanAngleReadings: doc.fanAngleReadings ?? [],
    bounceActual: (doc.bounceActual as BounceObservation | null) ?? null,
    parachuteDesignPhotoUrl: doc.parachuteDesignPhotoUrl ?? null,
    parachuteDesignPhotoExpiresAtMs: doc.parachuteDesignPhotoExpiresAtMs ?? null,
    performer: doc.performer ?? null,
  };
}

export function isActivityId(value: string): value is ActivityId {
  return [
    'parachute-drop',
    'decibel-detector',
    'hand-fan-challenge',
    'vibration-analysis',
    'reaction-time',
    'surface-smoothness',
    'breathing-pattern',
  ].includes(value);
}
