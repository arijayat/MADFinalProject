const G = 9.8;

export type ParachutePhysics = {
  finalVelocityMs: number;
  accelerationMs2: number;
  netForceN: number;
  weightN: number;
  dragForceN: number;
  gForce: number | null;
};

/** Kinematics and forces during the fall (worksheet steps 3–6). */
export function computeFallPhysics(
  dropHeightM: number,
  fallTimeS: number,
  massGrams: number
): ParachutePhysics | null {
  if (fallTimeS <= 0 || dropHeightM <= 0 || massGrams <= 0) return null;
  const massKg = massGrams / 1000;
  const finalVelocityMs = dropHeightM / fallTimeS;
  const accelerationMs2 = finalVelocityMs / fallTimeS;
  const netForceN = massKg * accelerationMs2;
  const weightN = massKg * G;
  const dragForceN = weightN - netForceN;
  return {
    finalVelocityMs,
    accelerationMs2,
    netForceN,
    weightN,
    dragForceN,
    gForce: null,
  };
}

/** G-force from slow-motion contact time (no-bounce case). */
export function computeGForceNoBounce(impactSpeedMs: number, contactTimeS: number): number | null {
  if (contactTimeS <= 0 || impactSpeedMs <= 0) return null;
  return impactSpeedMs / contactTimeS / G;
}

/** G-force when the toy bounces (Δv = v_down + v_up). */
export function computeGForceBounce(
  impactSpeedMs: number,
  contactTimeS: number,
  timeToMaxHeightS: number
): number | null {
  if (contactTimeS <= 0 || impactSpeedMs <= 0 || timeToMaxHeightS <= 0) return null;
  const vUp = G * timeToMaxHeightS;
  const deltaV = impactSpeedMs + vUp;
  return deltaV / contactTimeS / G;
}

export function formatPhysics(n: number, decimals = 2): string {
  return Number.isFinite(n) ? n.toFixed(decimals) : '—';
}
