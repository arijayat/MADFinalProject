import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';

import type { ActivityId } from '@/constants/activities';
import { getFirebaseStorage } from '@/lib/firebase';
import {
  activityMediaExpiresAtMs,
  type StoredActivityMedia,
} from '@/lib/storage/media-expiry';

const VIDEO_ACTIVITY_IDS = ['parachute-drop', 'hand-fan-challenge'] as const;
export type VideoActivityId = (typeof VIDEO_ACTIVITY_IDS)[number];

function storageFolderForActivity(activityId: VideoActivityId): string {
  return activityId === 'parachute-drop' ? 'parachute-videos' : 'fan-videos';
}

function videoContentType(localUri: string): string {
  const lower = localUri.toLowerCase();
  if (lower.endsWith('.mov')) return 'video/quicktime';
  if (lower.endsWith('.webm')) return 'video/webm';
  return 'video/mp4';
}

function videoExtension(contentType: string): string {
  if (contentType === 'video/quicktime') return 'mov';
  if (contentType === 'video/webm') return 'webm';
  return 'mp4';
}

export function isVideoActivityId(activityId: ActivityId): activityId is VideoActivityId {
  return VIDEO_ACTIVITY_IDS.includes(activityId as VideoActivityId);
}

export async function uploadActivityVideo(params: {
  teamId: string;
  activityId: VideoActivityId;
  actionIndex: number;
  localUri: string;
}): Promise<StoredActivityMedia> {
  const response = await fetch(params.localUri);
  const blob = await response.blob();
  const contentType = blob.type || videoContentType(params.localUri);
  const ext = videoExtension(contentType);
  const folder = storageFolderForActivity(params.activityId);

  const objectRef = ref(
    getFirebaseStorage(),
    `teams/${params.teamId}/${folder}/action-${params.actionIndex}.${ext}`,
  );

  await uploadBytes(objectRef, blob, { contentType });

  const uploadedAtMs = Date.now();
  return {
    url: await getDownloadURL(objectRef),
    expiresAtMs: activityMediaExpiresAtMs(uploadedAtMs),
  };
}
