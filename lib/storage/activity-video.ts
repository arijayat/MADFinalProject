import { Platform } from 'react-native';
import { Video } from 'react-native-compressor';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';

import { getFirebaseStorage } from '@/lib/firebase';
import {
  activityMediaExpiresAtMs,
  type StoredActivityMedia,
} from '@/lib/storage/activity-media-expiry';

export type ActivityVideoFolder = 'parachute-videos' | 'fan-videos';

/** Max longest edge — keeps bend/drop detail readable on a phone. */
const MAX_VIDEO_DIMENSION = 960;

export async function compressActivityVideo(localUri: string): Promise<string> {
  if (Platform.OS === 'web') return localUri;

  try {
    return await Video.compress(localUri, {
      compressionMethod: 'auto',
      maxSize: MAX_VIDEO_DIMENSION,
      minimumFileSizeForCompress: 0,
    });
  } catch {
    return localUri;
  }
}

function videoContentTypeFromUri(uri: string): string {
  const lower = uri.toLowerCase();
  if (lower.endsWith('.mov')) return 'video/quicktime';
  return 'video/mp4';
}

export async function uploadActivityVideo(params: {
  teamId: string;
  localUri: string;
  folder: ActivityVideoFolder;
  fileName: string;
}): Promise<StoredActivityMedia> {
  const compressedUri = await compressActivityVideo(params.localUri);
  const response = await fetch(compressedUri);
  const blob = await response.blob();
  const contentType = blob.type?.startsWith('video/') ? blob.type : videoContentTypeFromUri(compressedUri);

  const objectRef = ref(
    getFirebaseStorage(),
    `teams/${params.teamId}/${params.folder}/${params.fileName}`,
  );

  await uploadBytes(objectRef, blob, { contentType });

  const uploadedAtMs = Date.now();
  return {
    url: await getDownloadURL(objectRef),
    expiresAtMs: activityMediaExpiresAtMs(uploadedAtMs),
  };
}
