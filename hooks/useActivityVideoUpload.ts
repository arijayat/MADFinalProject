import { useCallback, useRef, useState } from 'react';
import { Alert } from 'react-native';

import { useAuth } from '@/contexts/AuthContext';
import { useTeam } from '@/contexts/TeamContext';
import type { StoredActivityMedia } from '@/lib/storage/activity-media-expiry';
import {
  uploadActivityVideo,
  type ActivityVideoFolder,
} from '@/lib/storage/activity-video';

export function useActivityVideoUpload(folder: ActivityVideoFolder) {
  const { user } = useAuth();
  const { teamDocId } = useTeam();
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState<StoredActivityMedia | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const inFlightUriRef = useRef<string | null>(null);

  const canUpload = Boolean(user && teamDocId);

  const resetUpload = useCallback(() => {
    setUploading(false);
    setUploaded(null);
    setUploadError(null);
    inFlightUriRef.current = null;
  }, []);

  const startUpload = useCallback(
    async (localUri: string, actionIndex: number) => {
      if (!user) {
        setUploadError('Sign in to upload videos to the cloud.');
        return;
      }
      if (!teamDocId) {
        setUploadError('Join a team to upload videos to the cloud.');
        return;
      }
      if (inFlightUriRef.current === localUri) {
        return;
      }

      inFlightUriRef.current = localUri;
      setUploading(true);
      setUploadError(null);
      setUploaded(null);

      try {
        const result = await uploadActivityVideo({
          teamId: teamDocId,
          localUri,
          folder,
          fileName: `action-${actionIndex + 1}.mp4`,
        });
        setUploaded(result);
      } catch (error) {
        inFlightUriRef.current = null;
        const message =
          error instanceof Error
            ? error.message
            : 'Could not upload video. Check Storage rules and your connection.';
        setUploadError(message);
      } finally {
        setUploading(false);
      }
    },
    [user, teamDocId, folder],
  );

  const retryUpload = useCallback(
    (localUri: string, actionIndex: number) => {
      inFlightUriRef.current = null;
      void startUpload(localUri, actionIndex);
    },
    [startUpload],
  );

  const requireUploadedBeforeSave = useCallback((): boolean => {
    if (!canUpload) return true;
    if (uploading) {
      Alert.alert('Video uploading', 'Wait for the video to finish uploading before continuing.');
      return false;
    }
    if (!uploaded) {
      Alert.alert(
        'Video upload needed',
        uploadError ?? 'Your recording must upload to the cloud before you continue.',
      );
      return false;
    }
    return true;
  }, [canUpload, uploading, uploaded, uploadError]);

  return {
    canUpload,
    uploading,
    uploaded,
    uploadError,
    startUpload,
    retryUpload,
    resetUpload,
    requireUploadedBeforeSave,
  };
}
