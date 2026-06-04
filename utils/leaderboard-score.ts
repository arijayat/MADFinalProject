import type { ActivityId } from '@/constants/activities';
import type { ActivityResultDocument } from '@/types/firestore';

function totalReadings(doc: ActivityResultDocument): number {
  return (
    doc.decibelReadings.length +
    doc.vibrationReadings.length +
    doc.performanceReadings.length +
    doc.parachuteReadings.length +
    doc.tapReactionReadings.length +
    doc.tracingReadings.length +
    doc.breathingReadings.length +
    doc.fanAngleReadings.length
  );
}

/** 0–100 score for leaderboard ordering (higher is better). */
export function computeLeaderboardScore(
  _activityId: ActivityId,
  doc: ActivityResultDocument,
): number {
  const stars = doc.reflection?.stars ?? 0;
  const reflectionPart = Math.min(75, stars * 15);
  const readingPart = Math.min(25, totalReadings(doc) * 2);
  return Math.min(100, Math.round(reflectionPart + readingPart));
}
