import type { ActivityId } from '@/constants/activities';
import type { ActivitySessionSnapshot } from '@/lib/firestore/results';

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
