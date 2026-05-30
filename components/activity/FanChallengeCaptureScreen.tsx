import {
  CameraView,
  useCameraPermissions,
  useMicrophonePermissions,
} from 'expo-camera';
import { useRouter } from 'expo-router';
import {
  useCallback,
  useEffect,
  useRef,
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

import { DropVideoReview } from '@/components/activity/DropVideoReview';
import { ScreenHeader } from '@/components/wireframe/BackNav';
import { PrimaryButton } from '@/components/wireframe/PrimaryButton';
import { WireScreen } from '@/components/wireframe/WireScreen';
import type { ActivityConfig } from '@/constants/activities';
import { Wireframe } from '@/constants/wireframe-theme';
import {
  useActivitySession,
  type FanAngleReading,
} from '@/contexts/ActivitySessionContext';

type Props = {
  cfg: ActivityConfig;
};

type Phase = 'preview' | 'recording' | 'review' | 'angle';

type RecordingResult = { uri: string };

/** Quarter-speed playback when reviewing bends for precise angle measurement. */
const REVIEW_PLAYBACK_RATE = 0.25;

export function FanChallengeCaptureScreen({ cfg }: Props) {
  const router = useRouter();
  const { setFanAngleReadings, clearCapture } = useActivitySession();
  const actions = cfg.fanChallengeActions ?? ['Record bend'];
  const cameraRef = useRef<CameraView>(null);
  const recordingPromiseRef = useRef<Promise<RecordingResult | undefined> | null>(
    null,
  );

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();

  const [actionIndex, setActionIndex] = useState(0);
  const [saved, setSaved] = useState<FanAngleReading[]>([]);
  const [phase, setPhase] = useState<Phase>('preview');
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const [angleInput, setAngleInput] = useState('');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const allDone = saved.length >= actions.length;
  const currentLabel = actions[actionIndex] ?? actions[actions.length - 1];

  useEffect(() => {
    clearCapture(cfg.id);
  }, [cfg.id, clearCapture]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

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
    setVideoUri(null);
    setPhase('recording');
    setTick(0);
    timerRef.current = setInterval(() => setTick((t) => t + 1), 1000);
    try {
      recordingPromiseRef.current =
        cameraRef.current?.recordAsync({ maxDuration: 30 }) ?? null;
    } catch {
      Alert.alert(
        'Could not record',
        'Try again with the camera positioned to capture the paper and fan.',
      );
      setPhase('preview');
    }
  }, [ensurePermissions]);

  const stopRecording = useCallback(async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    try {
      cameraRef.current?.stopRecording();
    } catch {
      /* already stopped */
    }
    try {
      const result = await recordingPromiseRef.current;
      recordingPromiseRef.current = null;
      if (result?.uri) {
        setVideoUri(result.uri);
        setPhase('review');
      } else {
        Alert.alert('No video saved', 'Try recording again.');
        setPhase('preview');
      }
    } catch {
      recordingPromiseRef.current = null;
      Alert.alert('Could not save video', 'Try recording again.');
      setPhase('preview');
    }
  }, []);

  const goToAngleEntry = useCallback(() => {
    setPhase('angle');
    setAngleInput('');
  }, []);

  const reRecord = useCallback(() => {
    setVideoUri(null);
    setPhase('preview');
  }, []);

  const saveAngle = useCallback(() => {
    const angle = parseFloat(angleInput);
    if (!Number.isFinite(angle) || angle < 0 || angle > 180) {
      Alert.alert('Invalid angle', 'Enter a bend angle between 0 and 180 degrees.');
      return;
    }

    const reading: FanAngleReading = {
      label: currentLabel,
      angleDegrees: angle,
    };
    const nextSaved = [...saved, reading];
    setSaved(nextSaved);
    setVideoUri(null);

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
    footer = <PrimaryButton label="SAVE ANGLE & CONTINUE" onPress={saveAngle} />;
  } else if (!permissionsReady && Platform.OS !== 'web') {
    footer = <PrimaryButton label="ALLOW CAMERA" onPress={ensurePermissions} />;
  } else {
    footer = <PrimaryButton label="START RECORDING" onPress={startRecording} />;
  }

  const showCamera = phase === 'preview' || phase === 'recording';

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

    return (
      <View style={styles.viewfinder}>
        <CameraView ref={cameraRef} style={styles.camera} facing="back" mode="video" />
        {phase === 'recording' ? (
          <View style={styles.recordingBar}>
            <Text style={styles.recording}>RECORDING</Text>
            <Text style={styles.timer}>{formatTime(tick)}</Text>
          </View>
        ) : null}
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
    <WireScreen scroll={phase === 'review' || phase === 'angle'} footer={footer}>
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
        <View style={styles.anglePanel}>
          <Text style={styles.angleTitle}>Enter maximum bend angle</Text>
          <Text style={styles.angleHint}>
            From your slow-motion video, measure the angle (in degrees) at the
            furthest bend.
          </Text>
          <TextInput
            style={styles.input}
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
        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>Trials complete</Text>
          {saved.map((reading, i) => (
            <Text key={i} style={styles.summaryLine}>
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
