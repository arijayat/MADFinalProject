import type { ActivityId } from '@/constants/activities';
import type { ActivityResultDocument } from '@/types/firestore';

function activityReadingCount(
  activityId: ActivityId,
  doc: ActivityResultDocument,
): number {
  switch (activityId) {
    case 'parachute-drop':
      return doc.parachuteReadings?.length ?? 0;
    case 'decibel-detector':
      return doc.decibelReadings?.length ?? 0;
    case 'hand-fan-challenge':
      return doc.fanAngleReadings?.length ?? 0;
    case 'vibration-analysis':
      return doc.vibrationReadings?.length ?? 0;
    case 'surface-smoothness':
      return doc.performanceReadings?.length ?? 0;
    case 'reaction-time':
      return (
        (doc.tapReactionReadings?.length ?? 0) +
        (doc.tracingReadings?.length ?? 0)
      );
    case 'breathing-pattern':
      return doc.breathingReadings?.length ?? 0;
    default:
      return 0;
  }
}

/** 0–100 score for leaderboard ordering (higher is better). */
export function computeLeaderboardScore(
  activityId: ActivityId,
  doc: ActivityResultDocument,
): number {
  const stars = doc.reflection?.stars ?? 0;
  const reflectionPart = Math.min(75, stars * 15);
  const readingPart = Math.min(
    25,
    activityReadingCount(activityId, doc) * 2,
  );
  return Math.min(100, Math.round(reflectionPart + readingPart));
}
