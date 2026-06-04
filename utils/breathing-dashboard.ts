import type { BreathingReading } from "@/contexts/ActivitySessionContext";

const BPM_TOLERANCE = 4;

export const BREATHING_PHASE_SHORT = [
  "At rest",
  "After Exercise 1",
  "After Exercise 2",
];

export function bpmPredictionMatches(
  predictedBpm: string | undefined,
  actualBpm: number | undefined,
): string {
  const predicted = parseFloat(predictedBpm ?? "");
  if (!Number.isFinite(predicted) || actualBpm == null) return "—";
  return Math.abs(predicted - actualBpm) <= BPM_TOLERANCE ? "Yes" : "No";
}

export function formatRecordingDetail(reading: BreathingReading): string {
  return `${reading.durationS}s · peak ${reading.peakMovementMs2.toFixed(2)} m/s²`;
}

export function higherAfterExerciseActual(
  readings: BreathingReading[],
): string {
  if (readings.length < 2) return "—";
  const rest = readings[0]?.breathsPerMinute ?? 0;
  const after = Math.max(
    readings[1]?.breathsPerMinute ?? 0,
    readings[2]?.breathsPerMinute ?? 0,
  );
  if (after > rest) return "Yes — rate increased";
  if (after < rest) return "No — rate did not increase";
  return "About the same";
}

export function higherAfterExerciseMatches(
  prediction: string | undefined,
  readings: BreathingReading[],
): string {
  const pred = prediction?.trim();
  if (!pred || readings.length < 2) return "—";
  const rest = readings[0]?.breathsPerMinute ?? 0;
  const after = Math.max(
    readings[1]?.breathsPerMinute ?? 0,
    readings[2]?.breathsPerMinute ?? 0,
  );
  const actual =
    after > rest ? "Yes" : after < rest ? "No" : "About the same";
  return pred === actual ? "Yes" : "No";
}
