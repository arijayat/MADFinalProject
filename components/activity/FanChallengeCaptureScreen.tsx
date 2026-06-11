import { useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import {
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import {
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useAuth } from '@/contexts/AuthContext';
import { useTeam } from '@/contexts/TeamContext';
import { useActivityVideoUpload } from '@/hooks/useActivityVideoUpload';
import { useCameraVideoRecording } from '@/hooks/useCameraVideoRecording';
import { confirmBatteryForCapture } from '@/lib/device/battery-guard';

import { ActivityCameraPreview } from '@/components/activity/ActivityCameraPreview';
import { DropVideoReview } from '@/components/activity/DropVideoReview';
import { RecordingTimerOverlay } from '@/components/activity/RecordingTimerOverlay';
import { ActivityVideoUploadStatus } from '@/components/activity/ActivityVideoUploadStatus';
import { BatteryCaptureBanner } from '@/components/device/BatteryCaptureBanner';
import { ScreenHeader } from '@/components/wireframe/BackNav';
import { PrimaryButton } from '@/components/wireframe/PrimaryButton';
import { WireScreen } from '@/components/wireframe/WireScreen';
import type { ActivityConfig } from '@/constants/activities';
import { Wireframe } from '@/constants/wireframe-theme';
import { useAppTheme } from '@/contexts/AppThemeContext';
import {
  useActivitySession,
  type FanAngleReading,
} from '@/contexts/ActivitySessionContext';

type Props = {
  cfg: ActivityConfig;
};

type Phase = 'preview' | 'recording' | 'review' | 'angle';

/** Quarter-speed playback when reviewing bends for precise angle measurement. */
const REVIEW_PLAYBACK_RATE = 0.25;

export function FanChallengeCaptureScreen({ cfg }: Props) {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { user } = useAuth();
  const { teamDocId } = useTeam();
  const { setFanAngleReadings } = useActivitySession();
  const {
    uploadState,
    uploadedVideo,
    uploadError,
    startUpload,
    resetUpload,
    retryUpload,
    requireUploadComplete,
  } = useActivityVideoUpload({
    activityId: 'hand-fan-challenge',
    teamId: teamDocId,
    isSignedIn: !!user,
  });
  const actions = cfg.fanChallengeActions ?? ['Record bend'];

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();
  const [actionIndex, setActionIndex] = useState(0);
  const [saved, setSaved] = useState<FanAngleReading[]>([]);
  const [phase, setPhase] = useState<Phase>('preview');
  const {
    cameraRef,
    cameraReady,
    canMountCamera,
    sessionKey,
    onCameraReady,
    onMountError,
    resetCameraReady,
    isRecording,
    beginRecording,
    finishRecording,
  } = useCameraVideoRecording({
    cameraPermissionGranted: !!cameraPermission?.granted,
    onRecordingFailed: () => setPhase('preview'),
  });
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [angleInput, setAngleInput] = useState('');

  const allDone = saved.length >= actions.length;
  const currentLabel = actions[actionIndex] ?? actions[actions.length - 1];

  useEffect(() => {
    if (!videoUri) return;
    void startUpload(videoUri, actionIndex);
  }, [videoUri, actionIndex, startUpload]);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    if (!cameraPermission?.granted) void requestCameraPermission();
    if (micPermission == null || !micPermission.granted) void requestMicPermission();
  }, [
    cameraPermission?.granted,
    micPermission,
    requestCameraPermission,
    requestMicPermission,
  ]);

  const ensurePermissions = useCallback(async () => {
    if (Platform.OS === 'web') {
      Alert.alert(
        'Use a phone',
        'Video capture requires the iOS or Android app on a real device.',
      );
      return false;
    }
    if (!cameraPermission?.granted) {
      const cam = await requestCameraPermission();
      if (!cam.granted) {
        Alert.alert(
          'Camera needed',
          'Allow camera access to record paper bending during the fan challenge.',
        );
        return false;
      }
    }
    if (!micPermission?.granted) {
      const mic = await requestMicPermission();
      if (!mic.granted) {
        Alert.alert(
          'Microphone optional',
          'You can still record video without microphone audio.',
        );
      }
    }
    return true;
  }, [
    cameraPermission?.granted,
    micPermission?.granted,
    requestCameraPermission,
    requestMicPermission,
  ]);

  const startRecording = useCallback(async () => {
    if (!(await ensurePermissions())) return;
    const batteryOk = await confirmBatteryForCapture({
      activityLabel: 'video recording',
      strictBlock: false,
    });
    if (!batteryOk) return;
    setVideoUri(null);
    const started = await beginRecording();
    if (started) setPhase('recording');
  }, [beginRecording, ensurePermissions]);

  const stopRecording = useCallback(async () => {
    const uri = await finishRecording();
    if (uri) {
      setVideoUri(uri);
      setPhase('review');
    } else {
      setPhase('preview');
    }
  }, [finishRecording]);

  const goToAngleEntry = useCallback(() => {
    setPhase('angle');
    setAngleInput('');
  }, []);

  const reRecord = useCallback(() => {
    setVideoUri(null);
    resetUpload();
    setPhase('preview');
  }, [resetUpload]);

  const saveAngle = useCallback(() => {
    const angle = parseFloat(angleInput);
    if (!Number.isFinite(angle) || angle < 0 || angle > 180) {
      Alert.alert('Invalid angle', 'Enter a bend angle between 0 and 180 degrees.');
      return;
    }

    const video = requireUploadComplete();
    if (!video) return;

    const reading: FanAngleReading = {
      label: currentLabel,
      angleDegrees: angle,
      video,
    };
    const nextSaved = [...saved, reading];
    setSaved(nextSaved);
    setVideoUri(null);
    resetUpload();

    if (actionIndex + 1 < actions.length) {
      setActionIndex((i) => i + 1);
      setPhase('preview');
    } else {
      setFanAngleReadings(cfg.id, nextSaved);
      setPhase('preview');
    }
  }, [
    angleInput,
    saved,
    actionIndex,
    actions.length,
    currentLabel,
    setFanAngleReadings,
    cfg.id,
    requireUploadComplete,
    resetUpload,
  ]);

  const permissionsReady =
    Platform.OS === 'web' ||
    (cameraPermission?.granted && cameraPermission?.status !== 'undetermined');

  let footer: ReactNode = null;
  if (allDone) {
    footer = (
      <PrimaryButton
        label="VIEW RESULTS"
        onPress={() => router.push(`/activity/${cfg.id}/dashboard`)}
      />
    );
  } else if (phase === 'recording') {
    footer = <PrimaryButton label="STOP RECORDING" onPress={stopRecording} />;
  } else if (phase === 'review') {
    footer = <PrimaryButton label="MEASURE ANGLE" onPress={goToAngleEntry} />;
  } else if (phase === 'angle') {
    footer = (
      <PrimaryButton
        label="SAVE ANGLE & CONTINUE"
        onPress={saveAngle}
        disabled={uploadState === 'uploading'}
      />
    );
  } else if (!permissionsReady && Platform.OS !== 'web') {
    footer = <PrimaryButton label="ALLOW CAMERA" onPress={ensurePermissions} />;
  } else {
    footer = (
      <PrimaryButton
        label={cameraReady ? 'START RECORDING' : 'PREPARING CAMERA…'}
        onPress={startRecording}
        disabled={!cameraReady}
      />
    );
  }

  const showCamera = phase === 'preview' || phase === 'recording';

  useEffect(() => {
    if (!showCamera) resetCameraReady();
  }, [showCamera, resetCameraReady]);

  const viewfinder = () => {
    if (phase === 'review' && videoUri) {
      return (
        <View>
          <DropVideoReview uri={videoUri} playbackRate={REVIEW_PLAYBACK_RATE} />
          <Text style={styles.reviewHint}>
            Replay in slow motion. Scrub the timeline and pause at maximum bend,
            then measure the angle.
          </Text>
          <Pressable onPress={reRecord} hitSlop={8}>
            <Text style={styles.reRecordLink}>Re-record this trial</Text>
          </Pressable>
          <ActivityVideoUploadStatus
            state={uploadState}
            error={uploadError}
            expiresAtMs={uploadedVideo?.expiresAtMs}
            onRetry={videoUri ? () => void retryUpload(videoUri) : undefined}
          />
        </View>
      );
    }

    if (Platform.OS === 'web') {
      return (
        <View style={styles.viewfinder}>
          <Text style={styles.webHint}>
            Open on a physical phone to use the camera. Position the phone to
            capture both the fan wave and the vertical paper movement.
          </Text>
        </View>
      );
    }

    if (!cameraPermission?.granted) {
      return (
        <View style={styles.viewfinder}>
          <Text style={styles.webHint}>
            Camera permission is required to record paper bending.
          </Text>
        </View>
      );
    }

    if (!showCamera) {
      return null;
    }

    if (!canMountCamera) {
      return (
        <View style={styles.viewfinder}>
          <Text style={styles.webHint}>Preparing camera…</Text>
        </View>
      );
    }

    return (
      <View style={styles.viewfinder}>
        <ActivityCameraPreview
          cameraRef={cameraRef}
          sessionKey={sessionKey}
          onCameraReady={onCameraReady}
          onMountError={onMountError}
        />
        <RecordingTimerOverlay active={isRecording} />
        <View style={styles.camRow}>
          <Text style={styles.tagRed}>
            {allDone ? cfg.captureDoneLabel : phase === 'recording' ? 'REC' : cfg.captureIdleLabel}
          </Text>
          {cfg.showSlowMo ? (
            <Text style={styles.tagGrey}>SLOW-MO FOR BEND ANGLE</Text>
          ) : null}
        </View>
      </View>
    );
  };

  return (
    <WireScreen scroll={!showCamera} animateLayout={!showCamera} footer={footer}>
      <ScreenHeader
        backLabel="BACK"
        onBack={() => router.back()}
        title="Hand Fan Challenge"
        subtitle={
          phase === 'review'
            ? 'Review your recording, then measure the maximum bend angle.'
            : 'Record how the paper bends when you fan air at it.'
        }
      />

      <BatteryCaptureBanner />

      {Platform.OS === 'web' ? (
        <Text style={styles.warn}>
          Open this project on a physical iPhone or Android device to use the camera.
        </Text>
      ) : null}

      <Text style={styles.step}>
        Step {Math.min(actionIndex + 1, actions.length)} of {actions.length}
      </Text>
      <Text style={styles.actionLabel}>
        {allDone ? 'All trials recorded' : currentLabel}
      </Text>

      {phase !== 'review' && phase !== 'angle' ? (
        <Text style={styles.hint}>
          Position the phone to capture the vertical paper and fan movement from
          the side. Wave the fan, then stop recording.
        </Text>
      ) : null}

      {viewfinder()}

      {phase === 'angle' && videoUri ? (
        <View
          style={[
            styles.anglePanel,
            {
              backgroundColor: colors.panelBg,
              borderColor: colors.border,
            },
          ]}>
          <ActivityVideoUploadStatus
            state={uploadState}
            error={uploadError}
            expiresAtMs={uploadedVideo?.expiresAtMs}
            onRetry={() => void retryUpload(videoUri)}
          />
          <Text style={[styles.angleTitle, { color: colors.text }]}>Enter maximum bend angle</Text>
          <Text style={[styles.angleHint, { color: colors.textMuted }]}>
            From your slow-motion video, measure the angle (in degrees) at the
            furthest bend.
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.surfaceAlt,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            placeholder="e.g. 30"
            placeholderTextColor={Wireframe.placeholder}
            value={angleInput}
            onChangeText={setAngleInput}
            keyboardType="decimal-pad"
            maxLength={6}
          />
          <DropVideoReview uri={videoUri} playbackRate={REVIEW_PLAYBACK_RATE} />
        </View>
      ) : null}

      {allDone ? (
        <View
          style={[
            styles.summary,
            {
              backgroundColor: colors.panelBg,
              borderColor: colors.border,
            },
          ]}>
          <Text style={[styles.summaryTitle, { color: colors.text }]}>Trials complete</Text>
          {saved.map((reading, i) => (
            <Text key={i} style={[styles.summaryLine, { color: colors.text }]}>
              {reading.label}: {reading.angleDegrees}°
            </Text>
          ))}
        </View>
      ) : null}
    </WireScreen>
  );
}

const styles = StyleSheet.create({
  viewfinder: {
    flex: 1,
    minHeight: 280,
    backgroundColor: '#3a3a3a',
    borderWidth: 1,
    borderColor: '#555',
    overflow: 'hidden',
    position: 'relative',
  },
  camera: {
    flex: 1,
    minHeight: 280,
  },
  recordingBar: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  recording: { color: Wireframe.accentRed, fontWeight: '800', fontSize: 12 },
  timer: { color: Wireframe.panelBg, fontWeight: '700' },
  camRow: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  tagRed: {
    backgroundColor: Wireframe.accentRed,
    color: Wireframe.panelBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontWeight: '800',
    fontSize: 12,
  },
  tagGrey: {
    backgroundColor: '#555',
    color: Wireframe.panelBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 11,
  },
  webHint: {
    color: Wireframe.panelBg,
    fontSize: 14,
    lineHeight: 20,
    padding: 16,
    textAlign: 'center',
  },
  warn: {
    color: Wireframe.accentYellow,
    fontSize: 13,
    marginBottom: 8,
  },
  step: {
    color: Wireframe.panelBg,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  actionLabel: {
    color: Wireframe.panelBg,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 8,
  },
  hint: {
    color: '#cfcfcf',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  reviewHint: {
    color: '#cfcfcf',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 12,
  },
  reRecordLink: {
    color: Wireframe.accentYellow,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 8,
  },
  anglePanel: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#272727',
    borderWidth: 1,
    borderColor: Wireframe.border,
  },
  angleTitle: {
    color: Wireframe.panelBg,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  angleHint: {
    color: '#cfcfcf',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  input: {
    backgroundColor: Wireframe.panelBg,
    borderWidth: 1,
    borderColor: Wireframe.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: Wireframe.text,
    marginBottom: 12,
  },
  summary: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#272727',
    borderWidth: 1,
    borderColor: Wireframe.border,
  },
  summaryTitle: {
    color: Wireframe.panelBg,
    fontWeight: '700',
    marginBottom: 8,
  },
  summaryLine: {
    color: Wireframe.panelBg,
    fontSize: 14,
    marginBottom: 4,
  },
});
