import { CameraView, type CameraView as CameraViewType } from 'expo-camera';
import { memo, type RefObject } from 'react';
import { StyleSheet } from 'react-native';

type Props = {
  cameraRef: RefObject<CameraViewType | null>;
  sessionKey: number;
  onCameraReady: () => void;
  onMountError: () => void;
};

/**
 * Isolated camera preview so parent re-renders (timers, context, battery) do not
 * pass new props into CameraView and disrupt the native preview on iOS.
 */
export const ActivityCameraPreview = memo(function ActivityCameraPreview({
  cameraRef,
  sessionKey,
  onCameraReady,
  onMountError,
}: Props) {
  return (
    <CameraView
      key={sessionKey}
      ref={cameraRef}
      style={styles.camera}
      facing="back"
      mode="video"
      mute
      onCameraReady={onCameraReady}
      onMountError={onMountError}
    />
  );
});

const styles = StyleSheet.create({
  camera: {
    flex: 1,
    minHeight: 280,
  },
});
