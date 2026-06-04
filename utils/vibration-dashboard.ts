import type { VibrationReading } from "@/contexts/ActivitySessionContext";

const TILT_MATCH_TOLERANCE_DEG = 2;

const DESIGN_LABELS = ["Design 1", "Design 2", "Design 3"] as const;

export const VIBRATION_DESIGN_SHORT = [
  "Design 1 — 4 folds, 4 pillars",
  "Design 2 — 10 folds, 4 pillars",
  "Design 3 — your best design",
];

export function tiltPredictionMatches(
  predictedDegrees: string | undefined,
  actualTiltDeg: number,
): string {
  const predicted = parseFloat(predictedDegrees ?? "");
  if (!Number.isFinite(predicted)) return "—";
  return Math.abs(predicted - actualTiltDeg) <= TILT_MATCH_TOLERANCE_DEG
    ? "Yes"
    : "No";
}

export function getSteadiestDesignIndex(readings: VibrationReading[]): number {
  if (readings.length === 0) return -1;
  return readings.reduce(
    (bestIdx, r, i, arr) =>
      r.peakTiltDeg < arr[bestIdx].peakTiltDeg ? i : bestIdx,
    0,
  );
}

export function steadiestDesignLabel(readings: VibrationReading[]): string {
  const idx = getSteadiestDesignIndex(readings);
  if (idx < 0) return "—";
  return DESIGN_LABELS[idx] ?? readings[idx]?.label ?? "—";
}

export function mostStablePredictionMatches(
  prediction: string | undefined,
  readings: VibrationReading[],
): string {
  const pred = prediction?.trim();
  if (!pred || readings.length === 0) return "—";
  const idx = getSteadiestDesignIndex(readings);
  if (idx < 0) return "—";
  return pred === DESIGN_LABELS[idx] ? "Yes" : "No";
}
