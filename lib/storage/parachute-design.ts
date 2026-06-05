import * as ImageManipulator from 'expo-image-manipulator';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';

import { getFirebaseStorage } from '@/lib/firebase';
import { parachuteDesignPhotoExpiresAtMs } from '@/lib/storage/activity-media-expiry';

/** Longest edge after resize — enough to review a parachute on a phone. */
const MAX_EDGE_PX = 1024;
/** JPEG quality (0–1). Lower = smaller file; 0.62 keeps detail for design review. */
const JPEG_QUALITY = 0.62;

export type ParachuteDesignUpload = {
  url: string;
  expiresAtMs: number;
};

export async function compressParachuteDesignPhoto(localUri: string): Promise<string> {
  const result = await ImageManipulator.manipulateAsync(
    localUri,
    [{ resize: { width: MAX_EDGE_PX } }],
    { compress: JPEG_QUALITY, format: ImageManipulator.SaveFormat.JPEG },
  );
  return result.uri;
}

export async function uploadParachuteDesignPhoto(params: {
  teamId: string;
  localUri: string;
}): Promise<ParachuteDesignUpload> {
  const compressedUri = await compressParachuteDesignPhoto(params.localUri);
  const response = await fetch(compressedUri);
  const blob = await response.blob();

  const objectRef = ref(
    getFirebaseStorage(),
    `teams/${params.teamId}/parachute-designs/design.jpg`,
  );

  await uploadBytes(objectRef, blob, { contentType: 'image/jpeg' });

  const uploadedAtMs = Date.now();
  return {
    url: await getDownloadURL(objectRef),
    expiresAtMs: parachuteDesignPhotoExpiresAtMs(uploadedAtMs),
  };
}
