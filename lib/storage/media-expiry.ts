/** Team media in Storage is removed after 30 days (see storage.lifecycle.json). */
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

export function activeStoredMediaUrl(
  media: StoredActivityMedia | null | undefined,
): string | null {
  if (!media?.url) return null;
  if (isActivityMediaExpired(media.expiresAtMs)) return null;
  return media.url;
}

export function formatActivityMediaExpiry(expiresAtMs: number): string {
  return new Date(expiresAtMs).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
