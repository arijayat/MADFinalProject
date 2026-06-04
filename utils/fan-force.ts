/** Classroom stiffness coefficients (N/rad) from activity reference table. */
export const MATERIAL_STIFFNESS_K: Record<string, number> = {
  "Thin printer paper": 0.05,
  "Standard card stock": 0.2,
  "Thin cardboard": 0.5,
  "Corrugated cardboard": 2.5,
};

export function getStiffnessK(material: string | undefined): number | null {
  if (!material?.trim()) return null;
  return MATERIAL_STIFFNESS_K[material] ?? null;
}

export function degreesToRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/** F ≈ k × θ with θ in radians. */
export function estimateForceN(
  stiffnessK: number,
  angleDegrees: number,
): number | null {
  if (!Number.isFinite(stiffnessK) || !Number.isFinite(angleDegrees)) return null;
  return stiffnessK * degreesToRadians(angleDegrees);
}

const BEND_MATCH_TOLERANCE_DEG = 5;

export function bendPredictionMatches(
  predictedDegrees: string | undefined,
  actualDegrees: number,
): string {
  const predicted = parseFloat(predictedDegrees ?? "");
  if (!Number.isFinite(predicted)) return "—";
  return Math.abs(predicted - actualDegrees) <= BEND_MATCH_TOLERANCE_DEG
    ? "Yes"
    : "No";
}

export function formatForceN(forceN: number): string {
  if (forceN < 0.01) return `${forceN.toFixed(4)} N`;
  if (forceN < 1) return `${forceN.toFixed(3)} N`;
  return `${forceN.toFixed(2)} N`;
}
