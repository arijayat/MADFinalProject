import { useCallback, useRef, useState } from 'react';
import { Alert } from 'react-native';

import type { VideoActivityId } from '@/lib/storage/activity-video';
import { uploadActivityVideo } from '@/lib/storage/activity-video';
import type { StoredActivityMedia } from '@/lib/storage/media-expiry';

export type VideoUploadState = 'idle' | 'uploading' | 'done' | 'failed';

export function useActivityVideoUpload(params: {
  activityId: VideoActivityId;
  teamId: string | null;
  isSignedIn: boolean;
}) {
  const [uploadState, setUploadState] = useState<VideoUploadState>('idle');
  const [uploadedVideo, setUploadedVideo] = useState<StoredActivityMedia | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const actionIndexRef = useRef(0);

  const resetUpload = useCallback(() => {
    setUploadState('idle');
    setUploadedVideo(null);
    setUploadError(null);
  }, []);

  const startUpload = useCallback(
    async (localUri: string, actionIndex: number) => {
      if (!params.isSignedIn) {
        setUploadState('failed');
        setUploadError('Sign in to upload videos to the cloud.');
        return;
      }
      if (!params.teamId) {
        setUploadState('failed');
        setUploadError('Register or join a team before uploading videos.');
        return;
      }

      actionIndexRef.current = actionIndex;
      setUploadState('uploading');
      setUploadError(null);
      setUploadedVideo(null);

      try {
        const result = await uploadActivityVideo({
          teamId: params.teamId,
          activityId: params.activityId,
          actionIndex,
          localUri,
        });
        setUploadedVideo(result);
        setUploadState('done');
      } catch (error) {
        setUploadState('failed');
        setUploadError(
          error instanceof Error
            ? error.message
            : 'Could not upload video. Check Storage rules and your connection.',
        );
      }
    },
    [params.activityId, params.isSignedIn, params.teamId],
  );

  const retryUpload = useCallback(
    async (localUri: string) => {
      await startUpload(localUri, actionIndexRef.current);
    },
    [startUpload],
  );

  const requireUploadComplete = useCallback((): StoredActivityMedia | null => {
    if (uploadState === 'uploading') {
      Alert.alert('Upload in progress', 'Wait for the video to finish uploading to the cloud.');
      return null;
    }
    if (uploadState !== 'done' || !uploadedVideo) {
      Alert.alert(
        'Video upload needed',
        uploadError ?? 'Your recording must be uploaded before you continue.',
        [{ text: 'OK' }],
      );
      return null;
    }
    return uploadedVideo;
  }, [uploadState, uploadedVideo, uploadError]);

  return {
    uploadState,
    uploadedVideo,
    uploadError,
    startUpload,
    resetUpload,
    retryUpload,
    requireUploadComplete,
  };
}
