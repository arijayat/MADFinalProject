import type { PerformanceReading } from "@/contexts/ActivitySessionContext";

export const MOVEMENT_SHORT = [
  "Movement 1 — circle / figure-8",
  "Movement 2 — up & down",
  "Movement 3 — side to side",
];

const MOVEMENT_OPTIONS = ["Movement 1", "Movement 2", "Movement 3"] as const;

export function formatPerformanceReading(r: PerformanceReading): string {
  return `${r.peakVibrationMs2.toFixed(2)} m/s² · ${r.durationS}s`;
}

export function movementIndexFromLabel(label: string): number {
  if (label.includes("Movement 1")) return 0;
  if (label.includes("Movement 2")) return 1;
  if (label.includes("Movement 3")) return 2;
  return -1;
}

export function getHardestMovementPrediction(
  readings: PerformanceReading[],
  attempt: 1 | 2,
): string {
  const filtered = readings.filter((r) => r.attempt === attempt);
  if (filtered.length === 0) return "—";
  const roughest = filtered.reduce((a, b) =>
    b.peakVibrationMs2 > a.peakVibrationMs2 ? b : a,
  );
  const idx = movementIndexFromLabel(roughest.label);
  return idx >= 0 ? MOVEMENT_OPTIONS[idx] : roughest.label;
}

export function hardestMovementMatches(
  prediction: string | undefined,
  readings: PerformanceReading[],
  attempt: 1 | 2 = 1,
): string {
  const pred = prediction?.trim();
  if (!pred || readings.length === 0) return "—";
  return pred === getHardestMovementPrediction(readings, attempt) ? "Yes" : "No";
}

export function averagePeakVibration(
  readings: PerformanceReading[],
  attempt: 1 | 2,
): string {
  const filtered = readings.filter((r) => r.attempt === attempt);
  if (filtered.length === 0) return "—";
  const avg =
    filtered.reduce((s, r) => s + r.peakVibrationMs2, 0) / filtered.length;
  return `${avg.toFixed(2)} m/s² avg`;
}
