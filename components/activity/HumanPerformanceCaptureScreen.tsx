import { Accelerometer } from 'expo-sensors';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { ScreenHeader } from '@/components/wireframe/BackNav';
import { PrimaryButton } from '@/components/wireframe/PrimaryButton';
import { WireScreen } from '@/components/wireframe/WireScreen';
import type { ActivityConfig } from '@/constants/activities';
import { Wireframe } from '@/constants/wireframe-theme';
import {
  useActivitySession,
  type PerformanceReading,
} from '@/contexts/ActivitySessionContext';
import { formatVibration, vibrationMs2 } from '@/utils/vibration';

type Props = {
  cfg: ActivityConfig;
};

/** Buzz when dynamic acceleration exceeds this (m/s²). */
const HAPTIC_THRESHOLD_MS2 = 0.9;
const HAPTIC_COOLDOWN_MS = 250;

type ScreenPhase = 'idle' | 'recording' | 'attempt2_prompt' | 'all_done';

export function HumanPerformanceCaptureScreen({ cfg }: Props) {
  const router = useRouter();
  const { setPerformanceReadings, clearCapture } = useActivitySession();
  const movements = cfg.movementActions ?? ['Movement test'];
  const totalSteps = movements.length * 2;

  const [attempt, setAttempt] = useState<1 | 2>(1);
  const [movementIndex, setMovementIndex] = useState(0);
  const [saved, setSaved] = useState<PerformanceReading[]>([]);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [screenPhase, setScreenPhase] = useState<ScreenPhase>('idle');
  const [liveVibration, setLiveVibration] = useState<number | null>(null);
  const [peakVibrationDisplay, setPeakVibrationDisplay] = useState<
    number | null
  >(null);
  const [elapsedS, setElapsedS] = useState(0);
  const [hapticPulses, setHapticPulses] = useState(0);

  const peakVibrationRef = useRef<number | null>(null);
  const subscriptionRef = useRef<{ remove: () => void } | null>(null);
  const elapsedTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordStartRef = useRef<number | null>(null);
  const lastHapticRef = useRef(0);
  const attemptRef = useRef<1 | 2>(1);
  const screenPhaseRef = useRef<ScreenPhase>('idle');

  const recording = screenPhase === 'recording';
  const showAttempt2Prompt = screenPhase === 'attempt2_prompt';
  const allDone = screenPhase === 'all_done';

  const currentLabel =
    movements[movementIndex] ?? movements[movements.length - 1];
  const stepNumber = saved.length + (recording ? 1 : 0);
  const hapticActive = attempt === 2;

  useEffect(() => {
    attemptRef.current = attempt;
  }, [attempt]);

  useEffect(() => {
    screenPhaseRef.current = screenPhase;
  }, [screenPhase]);

  const stopSubscription = useCallback(() => {
    subscriptionRef.current?.remove();
    subscriptionRef.current = null;
  }, []);

  const stopElapsedTimer = useCallback(() => {
    if (elapsedTimerRef.current) {
      clearInterval(elapsedTimerRef.current);
      elapsedTimerRef.current = null;
    }
  }, []);

  const fireHaptic = useCallback(async () => {
    if (Platform.OS === 'web') return;
    try {
      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Warning,
      );
    } catch {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      } catch {
        // Device may not support haptics
      }
    }
  }, []);

  const maybeHapticPulse = useCallback(
    (vib: number) => {
      if (attemptRef.current !== 2 || screenPhaseRef.current !== 'recording') {
        return;
      }
      const now = Date.now();
      if (
        vib >= HAPTIC_THRESHOLD_MS2 &&
        now - lastHapticRef.current >= HAPTIC_COOLDOWN_MS
      ) {
        lastHapticRef.current = now;
        setHapticPulses((n) => n + 1);
        void fireHaptic();
      }
    },
    [fireHaptic],
  );

  const startSubscription = useCallback(() => {
    stopSubscription();
    Accelerometer.setUpdateInterval(40);
    subscriptionRef.current = Accelerometer.addListener(({ x, y, z }) => {
      const vib = vibrationMs2({ x, y, z });
      setLiveVibration(vib);

      if (screenPhaseRef.current === 'recording') {
        if (
          peakVibrationRef.current == null ||
          vib > peakVibrationRef.current
        ) {
          peakVibrationRef.current = vib;
          setPeakVibrationDisplay(vib);
        }
        maybeHapticPulse(vib);
      }
    });
  }, [stopSubscription, maybeHapticPulse]);

  useEffect(() => {
    clearCapture(cfg.id);
    (async () => {
      if (Platform.OS === 'web') {
        setAvailable(false);
        return;
      }
      const isAvailable = await Accelerometer.isAvailableAsync();
      setAvailable(isAvailable);
      if (isAvailable) {
        startSubscription();
      }
    })();
    return () => {
      stopSubscription();
      stopElapsedTimer();
    };
  }, [
    cfg.id,
    clearCapture,
    startSubscription,
    stopSubscription,
    stopElapsedTimer,
  ]);

  const beginRecording = useCallback(() => {
    peakVibrationRef.current = null;
    setPeakVibrationDisplay(null);
    setLiveVibration(null);
    setElapsedS(0);
    setHapticPulses(0);
    lastHapticRef.current = 0;
    recordStartRef.current = Date.now();
    screenPhaseRef.current = 'recording';
    setScreenPhase('recording');

    if (attemptRef.current === 2) {
      void fireHaptic();
    }
  }, [fireHaptic]);

  const stopRecording = useCallback(() => {
    stopElapsedTimer();
    const durationS =
      recordStartRef.current != null
        ? Math.max(1, Math.round((Date.now() - recordStartRef.current) / 1000))
        : elapsedS || 1;

    const reading: PerformanceReading = {
      label: currentLabel,
      peakVibrationMs2: peakVibrationRef.current ?? 0,
      durationS,
      hapticFeedback: attempt === 2,
      attempt,
    };
    const nextSaved = [...saved, reading];
    setSaved(nextSaved);

    const finishedAttempt1 =
      attempt === 1 && movementIndex + 1 >= movements.length;
    const finishedAttempt2 =
      attempt === 2 && movementIndex + 1 >= movements.length;

    if (finishedAttempt1) {
      screenPhaseRef.current = 'attempt2_prompt';
      setScreenPhase('attempt2_prompt');
      return;
    }

    if (finishedAttempt2) {
      screenPhaseRef.current = 'all_done';
      setScreenPhase('all_done');
      setPerformanceReadings(cfg.id, nextSaved);
      return;
    }

    screenPhaseRef.current = 'idle';
    setScreenPhase('idle');
    setMovementIndex((i) => i + 1);
    peakVibrationRef.current = null;
    setPeakVibrationDisplay(null);
    setElapsedS(0);
  }, [
    stopElapsedTimer,
    elapsedS,
    currentLabel,
    attempt,
    saved,
    movementIndex,
    movements.length,
    setPerformanceReadings,
    cfg.id,
  ]);

  const startAttempt2 = useCallback(() => {
    setAttempt(2);
    attemptRef.current = 2;
    setMovementIndex(0);
    peakVibrationRef.current = null;
    setPeakVibrationDisplay(null);
    screenPhaseRef.current = 'idle';
    setScreenPhase('idle');
    void fireHaptic();
  }, [fireHaptic]);

  useEffect(() => {
    if (!recording) return;
    elapsedTimerRef.current = setInterval(() => {
      if (recordStartRef.current != null) {
        setElapsedS(
          Math.floor((Date.now() - recordStartRef.current) / 1000),
        );
      }
    }, 200);
    return () => stopElapsedTimer();
  }, [recording, stopElapsedTimer]);

  const smoothest =
    saved.length > 0
      ? saved.reduce((a, b) =>
          b.peakVibrationMs2 < a.peakVibrationMs2 ? b : a,
        )
      : null;

  let footerLabel = 'START RECORDING';
  let footerAction: () => void = beginRecording;
  let footerDisabled = available === false || recording;

  if (allDone) {
    footerLabel = 'VIEW RESULTS';
    footerAction = () => router.push(`/activity/${cfg.id}/dashboard`);
    footerDisabled = false;
  } else if (showAttempt2Prompt) {
    footerLabel = 'START ATTEMPT 2 (WITH VIBRATION)';
    footerAction = startAttempt2;
    footerDisabled = false;
  } else if (recording) {
    footerLabel = 'STOP RECORDING';
    footerAction = stopRecording;
    footerDisabled = false;
  } else if (available === false) {
    footerLabel = 'SENSOR UNAVAILABLE';
    footerAction = () => {};
    footerDisabled = true;
  }

  return (
    <WireScreen
      scroll
      footer={
        <PrimaryButton
          label={footerLabel}
          onPress={footerAction}
          disabled={footerDisabled}
        />
      }>
      <ScreenHeader
        backLabel="BACK"
        onBack={() => router.back()}
        title="Movement & vibration capture"
        subtitle="Hold the phone in one hand and follow each guided movement."
      />

      {Platform.OS === 'web' ? (
        <Text style={styles.warn}>
          Open this project on a physical iPhone or Android device to use the
          accelerometer and haptic feedback.
        </Text>
      ) : available === false ? (
        <Text style={styles.warn}>
          Motion sensors are not available on this device.
        </Text>
      ) : null}

      {showAttempt2Prompt ? (
        <View style={styles.promptBanner}>
          <Text style={styles.promptTitle}>Attempt 1 complete</Text>
          <Text style={styles.promptBody}>
            Now repeat all three movements with vibration feedback ON. Your
            phone will buzz whenever movement is not smooth—try to keep the
            vibration low.
          </Text>
        </View>
      ) : null}

      <Text style={styles.step}>
        Step {Math.min(stepNumber, totalSteps)} of {totalSteps} · Attempt{' '}
        {attempt}
      </Text>
      <Text style={styles.actionLabel}>
        {allDone
          ? 'All movements recorded'
          : showAttempt2Prompt
            ? 'Ready for Attempt 2'
            : currentLabel}
      </Text>

      {hapticActive && !showAttempt2Prompt && !allDone ? (
        <View style={styles.hapticOnBanner}>
          <Text style={styles.hapticOnText}>
            Vibration feedback ON — phone buzzes when movement is not smooth
            {recording ? ` (${hapticPulses} buzzes so far)` : ''}
          </Text>
        </View>
      ) : null}

      {!hapticActive && !recording && !showAttempt2Prompt && !allDone ? (
        <Text style={styles.attemptHint}>
          Attempt 1: record each movement without phone vibration. Attempt 2
          will turn on buzz feedback automatically.
        </Text>
      ) : null}

      <View style={styles.meterWrap}>
        <View
          style={[
            styles.meterCircle,
            recording && styles.meterActive,
            hapticActive && styles.meterHaptic,
          ]}>
          <Text style={styles.meterText}>
            {allDone && smoothest
              ? formatVibration(smoothest.peakVibrationMs2)
              : formatVibration(
                  recording || liveVibration != null
                    ? liveVibration
                    : peakVibrationDisplay,
                )}
          </Text>
          <Text style={styles.meterSub}>
            {recording ? 'live vibration' : 'live / last peak'}
          </Text>
        </View>
        <Text style={styles.meterCaption}>
          {recording
            ? `Recording… ${elapsedS}s — ${hapticActive ? 'move smoothly to avoid buzzes' : 'move slowly and smoothly'}`
            : 'Shake test: values update live. Lower m/s² = smoother movement.'}
        </Text>
      </View>

      {!recording && !allDone && !showAttempt2Prompt ? (
        <Text style={styles.hint}>
          Hold the phone firmly in one hand. Tap START, perform the movement,
          then tap STOP when finished.
        </Text>
      ) : null}

      {saved.length > 0 ? (
        <View style={styles.savedBlock}>
          <Text style={styles.savedTitle}>Recorded</Text>
          {saved.map((r, i) => (
            <Text key={`${r.label}-${r.attempt}-${i}`} style={styles.savedRow}>
              • Attempt {r.attempt} — {r.label}: peak{' '}
              {formatVibration(r.peakVibrationMs2)} in {r.durationS}s
              {r.hapticFeedback ? ' (haptic ON)' : ''}
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

      <Text style={styles.disclaimer}>
        Vibration values are relative estimates from the phone accelerometer for
        comparing movements in class—not medical-grade measurements.
      </Text>
    </WireScreen>
  );
}

const styles = StyleSheet.create({
  warn: {
    color: Wireframe.accentYellow,
    fontSize: 13,
    marginBottom: 8,
  },
  promptBanner: {
    backgroundColor: '#2a4a2a',
    borderWidth: 1,
    borderColor: '#4caf50',
    padding: 12,
    marginBottom: 12,
  },
  promptTitle: {
    color: '#a5d6a7',
    fontWeight: '800',
    fontSize: 14,
    marginBottom: 6,
  },
  promptBody: {
    color: '#e8f5e9',
    fontSize: 13,
    lineHeight: 18,
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
    marginBottom: 8,
  },
  attemptHint: {
    color: '#bbb',
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 10,
  },
  hapticOnBanner: {
    backgroundColor: '#4a3a10',
    borderWidth: 1,
    borderColor: Wireframe.accentYellow,
    padding: 10,
    marginBottom: 10,
  },
  hapticOnText: {
    color: Wireframe.accentYellow,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
  },
  meterWrap: {
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3a3a3a',
    borderWidth: 1,
    borderColor: '#555',
    padding: 16,
  },
  meterCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#d0d0d0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#888',
  },
  meterActive: { borderColor: Wireframe.accentRed },
  meterHaptic: { borderColor: Wireframe.accentYellow },
  meterText: { fontSize: 26, fontWeight: '800', color: Wireframe.text },
  meterSub: { fontSize: 11, color: '#666', marginTop: 4 },
  meterCaption: {
    marginTop: 12,
    color: '#cfcfcf',
    fontSize: 13,
    textAlign: 'center',
  },
  hint: {
    marginTop: 12,
    fontSize: 12,
    color: '#aaa',
    lineHeight: 17,
  },
  savedBlock: { marginTop: 16 },
  savedTitle: { color: '#aaa', fontSize: 12, marginBottom: 6 },
  savedRow: { color: Wireframe.panelBg, fontSize: 13, marginBottom: 4 },
  statusBlock: { marginTop: 12 },
  statusLine: { color: Wireframe.panelBg, fontSize: 14, marginBottom: 4 },
  disclaimer: {
    marginTop: 12,
    fontSize: 11,
    color: '#888',
    lineHeight: 16,
  },
});
