/**
 * Converts native recorder metering (dBFS, typically −160…0) to a classroom-style
 * display value for relative comparison. Not calibrated SPL — use for louder/quieter only.
 */
export function meteringToDisplayDb(meteringDbfs: number): number {
  const display = Math.round(90 + meteringDbfs);
  return Math.min(130, Math.max(20, display));
}

export function formatDisplayDb(db: number | null | undefined): string {
  if (db == null || Number.isNaN(db)) return '—';
  return `${db} dB`;
}
