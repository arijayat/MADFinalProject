export type AccelSample = { x: number; y: number; z: number };

/** Tilt from level in degrees (0 = perfectly flat, screen up or down). */
export function tiltDegrees({ x, y, z }: AccelSample): number {
  const horizontal = Math.sqrt(x * x + y * y);
  const vertical = Math.abs(z);
  return (Math.atan2(horizontal, vertical) * 180) / Math.PI;
}

/** Total acceleration magnitude in g. */
export function magnitudeG({ x, y, z }: AccelSample): number {
  return Math.sqrt(x * x + y * y + z * z);
}

/** Dynamic vibration above 1 g resting baseline, in m/s². */
export function vibrationMs2(sample: AccelSample): number {
  const dynamicG = Math.max(0, magnitudeG(sample) - 1);
  return dynamicG * 9.81;
}

export function formatTilt(deg: number | null): string {
  if (deg == null) return '—';
  return `${deg.toFixed(1)}°`;
}

export function formatVibration(ms2: number | null): string {
  if (ms2 == null) return '—';
  return `${ms2.toFixed(2)} m/s²`;
}

export type LevelStatus = 'level' | 'slight' | 'unlevel';

export function levelStatus(tiltDeg: number): LevelStatus {
  if (tiltDeg <= 2) return 'level';
  if (tiltDeg <= 5) return 'slight';
  return 'unlevel';
}

export function levelLabel(status: LevelStatus): string {
  if (status === 'level') return 'Level — surface is stable';
  if (status === 'slight') return 'Slightly tilted — adjust platform';
  return 'Not level — re-seat the phone before testing';
}
