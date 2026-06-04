/** Approximate quiet-room level for Action 1 louder/softer checks (display dB scale). */
export const QUIET_ROOM_REFERENCE_DB = 45;

/** Same band as classroom reference table — maps display dB to risk label. */
export function getHearingRisk(db: number): string {
  if (db < 0 || Number.isNaN(db)) return "—";
  if (db < 30) return "No risk";
  if (db < 60) return "Safe for long periods";
  if (db < 85) return "Generally safe; long exposure may cause fatigue";
  if (db < 90) return "Hearing damage possible after long exposure";
  if (db < 100) return "Hearing damage likely after short exposure";
  if (db < 110) return "Serious hearing damage in minutes";
  if (db < 120) return "Painful; immediate damage possible";
  if (db < 130) return "Immediate and severe hearing damage";
  if (db < 140) return "Very high — near instant damage";
  return "Instant, permanent hearing damage";
}

const SAME_THRESHOLD_DB = 3;

export function volumeRelation(
  currentDb: number,
  referenceDb: number,
): "Louder" | "Softer" | "About the same" {
  const diff = currentDb - referenceDb;
  if (Math.abs(diff) <= SAME_THRESHOLD_DB) return "About the same";
  return diff > 0 ? "Louder" : "Softer";
}

export function predictionMatchesActual(
  prediction: string | undefined,
  currentDb: number,
  referenceDb: number,
): string {
  const pred = prediction?.trim();
  if (!pred) return "—";
  const actual = volumeRelation(currentDb, referenceDb);
  return pred === actual ? "Yes" : "No";
}
