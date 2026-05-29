import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
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
import { parsePositiveSeconds } from '@/utils/parse-number';
import {
  useActivitySession,
  type BounceObservation,
  type ParachuteReading,
} from '@/contexts/ActivitySessionContext';

type Props = {
  cfg: ActivityConfig;
};

type Phase = 'preview' | 'recording' | 'review' | 'times';

type RecordingResult = { uri: string };

/** Quarter-speed playback when reviewing drops for precise landing timestamps. */
const REVIEW_PLAYBACK_RATE = 0.25;

export function ParachuteCaptureScreen({ cfg }: Props) {
  const router = useRouter();
  const { setParachuteReadings, setBounceActual, clearCapture, getSession } = useActivitySession();
  const expectsBounce = getSession(cfg.id).predictions.bounce === 'Bounce';
  const actions = cfg.parachuteDropActions ?? ['Drop'];
  const cameraRef = useRef<CameraView>(null);
  const recordingPromiseRef = useRef<Promise<RecordingResult | undefined> | null>(null);

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();

  const [actionIndex, setActionIndex] = useState(0);
  const [saved, setSaved] = useState<ParachuteReading[]>([]);
  const [phase, setPhase] = useState<Phase>('preview');
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const [fallTimeInput, setFallTimeInput] = useState('');
  const [contactTimeInput, setContactTimeInput] = useState('');
  const [reboundTimeInput, setReboundTimeInput] = useState('');
  const [observedBounce, setObservedBounce] = useState<BounceObservation | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isLastAction = actionIndex === actions.length - 1;

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
      Alert.alert('Use a phone', 'Video capture requires the iOS or Android app on a real device.');
      return false;
    }
    if (!cameraPermission?.granted) {
      const cam = await requestCameraPermission();
      if (!cam.granted) {
        Alert.alert('Camera needed', 'Allow camera access to record each drop.');
        return false;
      }
    }
    if (!micPermission?.granted) {
      const mic = await requestMicPermission();
      if (!mic.granted) {
        Alert.alert('Microphone optional', 'You can still record video without microphone audio.');
      }
    }
    return true;
  }, [cameraPermission?.granted, micPermission?.granted, requestCameraPermission, requestMicPermission]);

  const startRecording = useCallback(async () => {
    if (!(await ensurePermissions())) return;
    setVideoUri(null);
    setPhase('recording');
    setTick(0);
    timerRef.current = setInterval(() => setTick((t) => t + 1), 1000);
    try {
      recordingPromiseRef.current = cameraRef.current?.recordAsync({ maxDuration: 30 }) ?? null;
    } catch {
      Alert.alert('Could not record', 'Try again with the camera pointed at the full drop path.');
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

  const goToTimesEntry = useCallback(() => {
    setPhase('times');
    setFallTimeInput('');
    setContactTimeInput('');
    setReboundTimeInput('');
    setObservedBounce(null);
  }, []);

  const reRecord = useCallback(() => {
    setVideoUri(null);
    setPhase('preview');
  }, []);

  const saveTimes = useCallback(() => {
    const fall = parsePositiveSeconds(fallTimeInput);
    if (fall == null) {
      Alert.alert(
        'Fall time needed',
        'Enter the fall time in seconds from your video (e.g. 0.85 or 0,85).'
      );
      return;
    }
    const contactRaw = contactTimeInput.trim();
    const contact = contactRaw.length > 0 ? parsePositiveSeconds(contactRaw) : null;
    if (contactRaw.length > 0 && contact == null) {
      Alert.alert(
        'Invalid contact time',
        'Contact time must be a positive number in seconds (e.g. 0.05 or 0,05).'
      );
      return;
    }
    const reboundRaw = reboundTimeInput.trim();
    const rebound = reboundRaw.length > 0 ? parsePositiveSeconds(reboundRaw) : null;
    if (reboundRaw.length > 0 && rebound == null) {
      Alert.alert(
        'Invalid rebound time',
        'Rebound time must be a positive number in seconds (e.g. 0.15 or 0,15).'
      );
      return;
    }

    if (isLastAction && !observedBounce) {
      Alert.alert(
        'Bounce observation needed',
        'After reviewing your landing in the video, choose whether the toy bounced.'
      );
      return;
    }

    const reading: ParachuteReading = {
      label: currentLabel,
      fallTimeS: fall,
      contactTimeS: contact,
      reboundTimeS: rebound,
      observedBounce: isLastAction ? observedBounce : null,
    };
    const nextSaved = [...saved, reading];
    setSaved(nextSaved);
    setVideoUri(null);

    if (actionIndex + 1 < actions.length) {
      setActionIndex((i) => i + 1);
      setPhase('preview');
    } else {
      setParachuteReadings(cfg.id, nextSaved);
      if (observedBounce) setBounceActual(cfg.id, observedBounce);
      setPhase('preview');
    }
  }, [
    fallTimeInput,
    contactTimeInput,
    reboundTimeInput,
    observedBounce,
    isLastAction,
    currentLabel,
    saved,
    actionIndex,
    actions.length,
    setParachuteReadings,
    setBounceActual,
    cfg.id,
  ]);

  const permissionsReady =
    Platform.OS === 'web' || (cameraPermission?.granted && cameraPermission?.status !== 'undetermined');

  let footer: ReactNode = null;
  if (allDone) {
    footer = (
      <PrimaryButton label="VIEW RESULTS" onPress={() => router.push(`/activity/${cfg.id}/dashboard`)} />
    );
  } else if (phase === 'recording') {
    footer = <PrimaryButton label="STOP RECORDING" onPress={stopRecording} />;
  } else if (phase === 'review') {
    footer = <PrimaryButton label="ENTER TIMES" onPress={goToTimesEntry} />;
  } else if (phase === 'times') {
    footer = <PrimaryButton label="SAVE TIMES & CONTINUE" onPress={saveTimes} />;
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
            Replay your drop in slow motion. Scrub the timeline to find when the toy was released and
            when it first hit the ground.
          </Text>
          <Pressable onPress={reRecord} hitSlop={8}>
            <Text style={styles.reRecordLink}>Re-record this drop</Text>
          </Pressable>
        </View>
      );
    }

    if (Platform.OS === 'web') {
      return (
        <View style={styles.viewfinder}>
          <Text style={styles.webHint}>
            Open on a physical phone to use the camera. Place the phone on the floor so the full fall
            from table to ground is in frame.
          </Text>
        </View>
      );
    }

    if (!cameraPermission?.granted) {
      return (
        <View style={styles.viewfinder}>
          <Text style={styles.webHint}>Camera permission is required to record each drop.</Text>
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
          {cfg.showSlowMo ? <Text style={styles.tagGrey}>SLOW-MO FOR LANDING</Text> : null}
        </View>
      </View>
    );
  };

  return (
    <WireScreen
      scroll={phase === 'times' || phase === 'review'}
      footer={footer}>
      <ScreenHeader
        backLabel="BACK"
        onBack={() => router.back()}
        title="Video capture"
        subtitle={
          phase === 'review'
            ? 'Review your recording, then enter fall and landing times.'
            : 'Film each drop with your phone camera.'
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
      <Text style={styles.actionLabel}>{allDone ? 'All drops recorded' : currentLabel}</Text>

      {phase !== 'review' && phase !== 'times' ? (
        <Text style={styles.hint}>
          Place the phone on the floor facing the drop path. Drop from the same height each time.
        </Text>
      ) : null}

      {viewfinder()}

      {phase === 'times' && videoUri ? (
        <View style={styles.inlineReview}>
          <Text style={styles.inlineReviewLabel}>Your recording</Text>
          <DropVideoReview uri={videoUri} playbackRate={REVIEW_PLAYBACK_RATE} />
        </View>
      ) : null}

      {phase === 'times' ? (
        <View style={styles.timesPanel}>
          <Text style={styles.timesTitle}>Read times from your video</Text>
          <Text style={styles.fieldLabel}>Fall time — release to first ground contact (s)</Text>
          <TextInput
            style={styles.input}
            keyboardType="decimal-pad"
            placeholder="e.g. 0.85 or 0,85"
            placeholderTextColor={Wireframe.placeholder}
            value={fallTimeInput}
            onChangeText={setFallTimeInput}
          />
          <Text style={styles.fieldLabel}>
            Contact time — slow-motion, first hit until stop (s, optional)
          </Text>
          <TextInput
            style={styles.input}
            keyboardType="decimal-pad"
            placeholder="e.g. 0.05 or 0,05"
            placeholderTextColor={Wireframe.placeholder}
            value={contactTimeInput}
            onChangeText={setContactTimeInput}
          />
          {expectsBounce || observedBounce === 'Bounce' ? (
            <>
              <Text style={styles.fieldLabel}>
                Rebound time — leave surface to max height (s, if toy bounces)
              </Text>
              <TextInput
                style={styles.input}
                keyboardType="decimal-pad"
                placeholder="e.g. 0.15 or 0,15"
                placeholderTextColor={Wireframe.placeholder}
                value={reboundTimeInput}
                onChangeText={setReboundTimeInput}
              />
            </>
          ) : null}
          {isLastAction ? (
            <>
              <Text style={styles.fieldLabel}>Did the toy bounce on landing?</Text>
              <View style={styles.bounceRow}>
                {(['No bounce', 'Bounce'] as const).map((opt) => (
                  <Pressable
                    key={opt}
                    style={[styles.bounceBtn, observedBounce === opt && styles.bounceBtnActive]}
                    onPress={() => setObservedBounce(opt)}>
                    <Text
                      style={[
                        styles.bounceBtnText,
                        observedBounce === opt && styles.bounceBtnTextActive,
                      ]}>
                      {opt}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </>
          ) : null}
        </View>
      ) : null}

      {saved.length > 0 ? (
        <View style={styles.savedBlock}>
          <Text style={styles.savedTitle}>Recorded</Text>
          {saved.map((r) => (
            <Text key={r.label} style={styles.savedRow}>
              • {r.label}: fall {r.fallTimeS}s
              {r.contactTimeS != null ? `, contact ${r.contactTimeS}s` : ''}
              {r.observedBounce != null ? `, ${r.observedBounce}` : ''}
            </Text>
          ))}
        </View>
      ) : null}

      {allDone ? (
        <View style={styles.statusBlock}>
          <Text style={styles.statusLine}>✓ {cfg.captureDoneStatusA}</Text>
          <Text style={styles.statusLine}>✓ {cfg.captureDoneStatusB}</Text>
        </View>
      ) : null}
    </WireScreen>
  );
}

const styles = StyleSheet.create({
  warn: {
    color: Wireframe.accentYellow,
    fontSize: 13,
    marginBottom: 8,
  },
  step: {
    color: '#aaa',
    fontSize: 12,
    marginBottom: 4,
  },
  actionLabel: {
    color: Wireframe.panelBg,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  hint: {
    color: '#aaa',
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 10,
  },
  reviewHint: {
    color: '#cfcfcf',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 10,
    marginBottom: 8,
  },
  reRecordLink: {
    color: Wireframe.accentYellow,
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'underline',
    marginBottom: 8,
  },
  inlineReview: {
    marginTop: 12,
    marginBottom: 4,
  },
  inlineReviewLabel: {
    color: '#aaa',
    fontSize: 12,
    marginBottom: 6,
  },
  viewfinder: {
    minHeight: 280,
    backgroundColor: '#3a3a3a',
    borderWidth: 1,
    borderColor: '#555',
    overflow: 'hidden',
  },
  camera: {
    ...StyleSheet.absoluteFillObject,
  },
  webHint: {
    color: Wireframe.panelBg,
    fontSize: 13,
    padding: 16,
    lineHeight: 19,
  },
  recordingBar: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 2,
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
    zIndex: 2,
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
    backgroundColor: 'rgba(0,0,0,0.65)',
    color: Wireframe.panelBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 11,
  },
  timesPanel: {
    marginTop: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: Wireframe.border,
    backgroundColor: Wireframe.panelBg,
  },
  timesTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Wireframe.text,
    marginBottom: 10,
  },
  fieldLabel: {
    fontSize: 12,
    color: Wireframe.textMuted,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: Wireframe.border,
    padding: 10,
    fontSize: 14,
    color: Wireframe.text,
    marginBottom: 12,
  },
  savedBlock: { marginTop: 16 },
  savedTitle: { color: '#aaa', fontSize: 12, marginBottom: 6 },
  savedRow: { color: Wireframe.panelBg, fontSize: 13, marginBottom: 4 },
  statusBlock: { marginTop: 12 },
  statusLine: { color: Wireframe.panelBg, fontSize: 14, marginBottom: 4 },
  bounceRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  bounceBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: Wireframe.border,
    paddingVertical: 10,
    alignItems: 'center',
  },
  bounceBtnActive: {
    backgroundColor: Wireframe.text,
    borderColor: Wireframe.text,
  },
  bounceBtnText: { fontSize: 13, color: Wireframe.text },
  bounceBtnTextActive: { color: Wireframe.panelBg, fontWeight: '700' },
});
