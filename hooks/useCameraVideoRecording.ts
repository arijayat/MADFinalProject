import type { CameraView } from 'expo-camera';
import { useCallback, useRef, useState } from 'react';
import { Alert } from 'react-native';

type RecordingResult = { uri: string };

const MAX_DURATION_SEC = 30;

type Options = {
  cameraPermissionGranted: boolean;
  onRecordingFailed?: () => void;
};

export function useCameraVideoRecording(options: Options) {
  const cameraRef = useRef<CameraView>(null);
  const recordingPromiseRef = useRef<Promise<RecordingResult | undefined> | null>(null);
  const onRecordingFailedRef = useRef(options.onRecordingFailed);
  onRecordingFailedRef.current = options.onRecordingFailed;

  const [cameraReady, setCameraReady] = useState(false);
  const [sessionKey, setSessionKey] = useState(0);
  const [isRecording, setIsRecording] = useState(false);

  const onCameraReady = useCallback(() => setCameraReady(true), []);

  const resetCameraReady = useCallback(() => setCameraReady(false), []);

  const restartCameraSession = useCallback(() => {
    resetCameraReady();
    setSessionKey((key) => key + 1);
  }, [resetCameraReady]);

  const handleRecordingFailure = useCallback(() => {
    setIsRecording(false);
    recordingPromiseRef.current = null;
    restartCameraSession();
    onRecordingFailedRef.current?.();
  }, [restartCameraSession]);

  const onMountError = useCallback(() => {
    resetCameraReady();
    Alert.alert(
      'Camera unavailable',
      'Could not start the camera preview. Try closing other apps that use the camera, then tap START RECORDING again.',
    );
  }, [resetCameraReady]);

  const beginRecording = useCallback(async (): Promise<boolean> => {
    if (!cameraReady) {
      Alert.alert(
        'Camera loading',
        'Wait for the camera preview to appear, then try again.',
      );
      return false;
    }
    if (isRecording) return false;

    const camera = cameraRef.current;
    if (!camera) {
      handleRecordingFailure();
      Alert.alert('Could not record', 'Camera is not available. Try again.');
      return false;
    }

    try {
      const promise = camera.recordAsync({ maxDuration: MAX_DURATION_SEC });
      recordingPromiseRef.current = promise;
      void promise.catch(() => {
        handleRecordingFailure();
        Alert.alert(
          'Could not record',
          'The camera stopped unexpectedly. Wait for the preview to return, then try again.',
        );
      });

      setIsRecording(true);
      return true;
    } catch {
      handleRecordingFailure();
      Alert.alert(
        'Could not record',
        'The camera stopped unexpectedly. Wait for the preview to return, then try again.',
      );
      return false;
    }
  }, [cameraReady, handleRecordingFailure, isRecording]);

  const finishRecording = useCallback(async (): Promise<string | null> => {
    setIsRecording(false);

    try {
      cameraRef.current?.stopRecording();
    } catch {
      /* already stopped */
    }

    try {
      const result = await recordingPromiseRef.current;
      recordingPromiseRef.current = null;
      if (result?.uri) return result.uri;
      Alert.alert('No video saved', 'Try recording again.');
      restartCameraSession();
      return null;
    } catch {
      recordingPromiseRef.current = null;
      Alert.alert('Could not save video', 'Try recording again.');
      restartCameraSession();
      return null;
    }
  }, [restartCameraSession]);

  return {
    cameraRef,
    cameraReady,
    canMountCamera: options.cameraPermissionGranted,
    sessionKey,
    onCameraReady,
    onMountError,
    resetCameraReady,
    isRecording,
    beginRecording,
    finishRecording,
  };
}
