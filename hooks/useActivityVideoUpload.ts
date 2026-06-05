import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';

import {
  listPendingUploads,
  updateUploadQueueStatus,
  upsertUploadQueueItem,
} from '@/lib/db/upload-queue';
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
  const queueIdRef = useRef(-1);
  const resumedKeyRef = useRef<string | null>(null);

  const resetUpload = useCallback(() => {
    setUploadState('idle');
    setUploadedVideo(null);
    setUploadError(null);
  }, []);

  const runUpload = useCallback(
    async (localUri: string, actionIndex: number, existingQueueId?: number) => {
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

      const queueId =
        existingQueueId ??
        (await upsertUploadQueueItem({
          teamId: params.teamId,
          activityId: params.activityId,
          actionIndex,
          localUri,
        }));
      queueIdRef.current = queueId;

      if (queueId >= 0) {
        await updateUploadQueueStatus(queueId, 'uploading');
      }

      try {
        const result = await uploadActivityVideo({
          teamId: params.teamId,
          activityId: params.activityId,
          actionIndex,
          localUri,
        });
        if (queueId >= 0) {
          await updateUploadQueueStatus(queueId, 'done');
        }
        setUploadedVideo(result);
        setUploadState('done');
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Could not upload video. Check Storage rules and your connection.';
        if (queueId >= 0) {
          await updateUploadQueueStatus(queueId, 'failed', message);
        }
        setUploadState('failed');
        setUploadError(message);
      }
    },
    [params.activityId, params.isSignedIn, params.teamId],
  );

  const startUpload = useCallback(
    async (localUri: string, actionIndex: number) => {
      await runUpload(localUri, actionIndex);
    },
    [runUpload],
  );

  const retryUpload = useCallback(
    async (localUri: string) => {
      await runUpload(localUri, actionIndexRef.current, queueIdRef.current);
    },
    [runUpload],
  );

  useEffect(() => {
    if (!params.teamId || !params.isSignedIn) return;

    const resumeKey = `${params.teamId}:${params.activityId}`;
    if (resumedKeyRef.current === resumeKey) return;
    resumedKeyRef.current = resumeKey;

    let cancelled = false;
    void (async () => {
      const pending = await listPendingUploads(params.teamId!, params.activityId);
      if (cancelled || pending.length === 0) return;

      const item = pending[0];
      queueIdRef.current = item.id;
      actionIndexRef.current = item.actionIndex;

      if (item.status === 'failed') {
        setUploadState('failed');
        setUploadError(
          item.errorMessage ?? 'Upload failed earlier. Tap retry to upload again.',
        );
        return;
      }

      await runUpload(item.localUri, item.actionIndex, item.id);
    })();

    return () => {
      cancelled = true;
    };
  }, [params.activityId, params.isSignedIn, params.teamId, runUpload]);

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
