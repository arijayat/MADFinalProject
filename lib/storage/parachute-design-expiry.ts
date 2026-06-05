import {
  activityMediaExpiresAtMs,
  isActivityMediaExpired,
  formatActivityMediaExpiry,
} from '@/lib/storage/media-expiry';

/** @deprecated Use media-expiry exports */
export const PARACHUTE_DESIGN_PHOTO_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export function parachuteDesignPhotoExpiresAtMs(fromMs: number = Date.now()): number {
  return activityMediaExpiresAtMs(fromMs);
}

export function isParachuteDesignPhotoExpired(
  expiresAtMs: number | null | undefined,
  nowMs: number = Date.now(),
): boolean {
  return isActivityMediaExpired(expiresAtMs, nowMs);
}

export function formatParachuteDesignPhotoExpiry(expiresAtMs: number): string {
  return formatActivityMediaExpiry(expiresAtMs);
}
