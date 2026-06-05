/** Activity media (photos/videos) are removed from Storage after 30 days (see storage.lifecycle.json). */
export const ACTIVITY_MEDIA_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export type StoredActivityMedia = {
  url: string;
  expiresAtMs: number;
};

export function activityMediaExpiresAtMs(fromMs: number = Date.now()): number {
  return fromMs + ACTIVITY_MEDIA_TTL_MS;
}

export function isActivityMediaExpired(
  expiresAtMs: number | null | undefined,
  nowMs: number = Date.now(),
): boolean {
  if (expiresAtMs == null) return false;
  return nowMs >= expiresAtMs;
}

export function formatActivityMediaExpiry(expiresAtMs: number): string {
  return new Date(expiresAtMs).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function activeActivityMediaUrl(
  url: string | null | undefined,
  expiresAtMs: number | null | undefined,
): string | null {
  if (!url || isActivityMediaExpired(expiresAtMs)) return null;
  return url;
}
