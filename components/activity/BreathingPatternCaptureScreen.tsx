import { Accelerometer, Gyroscope } from 'expo-sensors';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/wireframe/PrimaryButton';
import { WireScreen } from '@/components/wireframe/WireScreen';
import type { ActivityConfig } from '@/constants/activities';
import { Wireframe } from '@/constants/wireframe-theme';
import {
  useActivitySession,
  type BreathingReading,
} from '@/contexts/ActivitySessionContext';
import { useAppTheme } from '@/contexts/AppThemeContext';
import { useActivityWorkflowChrome } from '@/contexts/ActivityWorkflowContext';
import { captureStepIndex } from '@/lib/activity-progress/steps';
import {
  analyzeBreathing,
  formatBreathingOutcome,
  sampleFromMotion,
  type GyroSample,
} from '@/utils/breathing';
import { confirmBatteryForCapture } from '@/lib/device/battery-guard';

type Props = {
  cfg: ActivityConfig;
};

const RECORD_SECONDS = 30;
const WAVEFORM_POINTS = 48;

type Phase = 'ready' | 'recording' | 'exercise_break' | 'all_done';

export function BreathingPatternCaptureScreen({ cfg }: Props) {
  const router = useRouter();
  const { stepId } = useLocalSearchParams<{ stepId?: string }>();
  const { colors } = useAppTheme();
  const { setActiveStepId } = useActivityWorkflowChrome();
  const { getSession, setBreathingReadings } = useActivitySession();
  const session = getSession(cfg.id);
  const phases = cfg.breathingPhases ?? ['Breathing measurement'];
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [saved, setSaved] = useState<BreathingReading[]>([]);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [screenPhase, setScreenPhase] = useState<Phase>('ready');
  const [elapsedS, setElapsedS] = useState(0);
  const [liveBreathsPerMin, setLiveBreathsPerMin] = useState<number | null>(null);
  const [liveRotation, setLiveRotation] = useState<number | null>(null);
  const [waveform, setWaveform] = useState<number[]>([]);

  const samplesRef = useRef<ReturnType<typeof sampleFromMotion>[]>([]);
  const accelerometerSubscriptionRef = useRef<{ remove: () => void } | null>(null);
  const gyroscopeSubscriptionRef = useRef<{ remove: () => void } | null>(null);
  const latestGyroRef = useRef<GyroSample | null>(null);
  const elapsedTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordStartRef = useRef<number | null>(null);
  const screenPhaseRef = useRef<Phase>('ready');

  const recording = screenPhase === 'recording';
  const exerciseBreak = screenPhase === 'exercise_break';
  const allDone = screenPhase === 'all_done';
  const currentLabel = phases[phaseIndex] ?? phases[phases.length - 1];

  useEffect(() => {
    setActiveStepId(`capture-${phaseIndex}`);
  }, [phaseIndex, setActiveStepId]);

  useEffect(() => {
    const stored = session.breathingReadings;
    if (stored.length === 0) return;
    setSaved(stored);
    const requested = captureStepIndex(stepId);
    const nextIndex =
      requested != null && requested < phases.length
        ? requested
        : Math.min(stored.length, phases.length - 1);
    setPhaseIndex(nextIndex);
    if (stored.length >= phases.length) {
      screenPhaseRef.current = 'all_done';
      setScreenPhase('all_done');
    }
  }, [phases.length, session.breathingReadings, stepId]);

  useEffect(() => {
    screenPhaseRef.current = screenPhase;
  }, [screenPhase]);

  const stopSubscription = useCallback(() => {
    accelerometerSubscriptionRef.current?.remove();
    accelerometerSubscriptionRef.current = null;
    gyroscopeSubscriptionRef.current?.remove();
    gyroscopeSubscriptionRef.current = null;
  }, []);

  const stopElapsedTimer = useCallback(() => {
    if (elapsedTimerRef.current) {
      clearInterval(elapsedTimerRef.current);
      elapsedTimerRef.current = null;
    }
  }, []);

  const startSubscription = useCallback(() => {
    stopSubscription();
    Accelerometer.setUpdateInterval(50);
    Gyroscope.setUpdateInterval(50);
    latestGyroRef.current = null;
    gyroscopeSubscriptionRef.current = Gyroscope.addListener((gyro) => {
      latestGyroRef.current = gyro;
      if (screenPhaseRef.current === 'recording') {
        setLiveRotation(
          Math.sqrt(gyro.x * gyro.x + gyro.y * gyro.y + gyro.z * gyro.z),
        );
      }
    });
    accelerometerSubscriptionRef.current = Accelerometer.addListener((accel) => {
      if (screenPhaseRef.current !== 'recording') return;
      const t = Date.now();
      const sample = sampleFromMotion(t, accel, latestGyroRef.current);
      samplesRef.current.push(sample);

      const recent = samplesRef.current.slice(-120);
      if (recent.length >= 20) {
        const partial = analyzeBreathing(recent);
        setLiveBreathsPerMin(partial.breathsPerMinute);
      }

      const signal = sample.chestMovement;
      setWaveform((prev) => {
        const next = [...prev, signal];
        return next.length > WAVEFORM_POINTS
          ? next.slice(next.length - WAVEFORM_POINTS)
          : next;
      });
    });
  }, [stopSubscription]);

  useEffect(() => {
    (async () => {
      if (Platform.OS === 'web') {
        setAvailable(false);
        return;
      }
      const [hasAccelerometer, hasGyroscope] = await Promise.all([
        Accelerometer.isAvailableAsync(),
        Gyroscope.isAvailableAsync(),
      ]);
      setAvailable(hasAccelerometer && hasGyroscope);
    })();
    return () => {
      stopSubscription();
      stopElapsedTimer();
    };
  }, [cfg.id, stopSubscription, stopElapsedTimer]);

  const finishRecording = useCallback(() => {
    stopElapsedTimer();
    stopSubscription();
    const analysis = analyzeBreathing(samplesRef.current);
    const reading: BreathingReading = {
      label: currentLabel,
      ...analysis,
    };
    const nextSaved = [...saved];
    nextSaved[phaseIndex] = reading;
    setSaved(nextSaved);
    setBreathingReadings(cfg.id, nextSaved);
    samplesRef.current = [];
    latestGyroRef.current = null;
    setLiveBreathsPerMin(null);
    setLiveRotation(null);
    setWaveform([]);
    setElapsedS(0);

    const isLastPhase = phaseIndex + 1 >= phases.length;
    if (isLastPhase) {
      screenPhaseRef.current = 'all_done';
      setScreenPhase('all_done');
      return;
    }

    screenPhaseRef.current = 'exercise_break';
    setScreenPhase('exercise_break');
  }, [
    stopElapsedTimer,
    stopSubscription,
    currentLabel,
    saved,
    phaseIndex,
    phases.length,
    setBreathingReadings,
    cfg.id,
  ]);

  const beginRecording = useCallback(async () => {
    const batteryOk = await confirmBatteryForCapture({
      activityLabel: 'the 30-second breathing recording',
      strictBlock: true,
    });
    if (!batteryOk) return;

    samplesRef.current = [];
    latestGyroRef.current = null;
    setLiveBreathsPerMin(null);
    setLiveRotation(null);
    setWaveform([]);
    setElapsedS(0);
    recordStartRef.current = Date.now();
    screenPhaseRef.current = 'recording';
    setScreenPhase('recording');
    startSubscription();

    elapsedTimerRef.current = setInterval(() => {
      const start = recordStartRef.current;
      if (start == null) return;
      const sec = Math.floor((Date.now() - start) / 1000);
      setElapsedS(sec);
      if (sec >= RECORD_SECONDS) {
        finishRecording();
      }
    }, 500);
  }, [startSubscription, finishRecording]);

  const continueAfterExercise = useCallback(() => {
    setPhaseIndex((i) => i + 1);
    screenPhaseRef.current = 'ready';
    setScreenPhase('ready');
  }, []);

  const waveMin = waveform.length > 0 ? Math.min(...waveform) : 0;
  const waveMax = waveform.length > 0 ? Math.max(...waveform) : 1;
  const waveRange = waveMax - waveMin || 0.01;

  let footerLabel = 'START RECORDING';
  let footerAction: () => void = beginRecording;
  let footerDisabled = available === false;

  if (allDone) {
    footerLabel = 'VIEW RESULTS';
    footerAction = () => router.replace(`/activity/${cfg.id}/dashboard`);
  } else if (recording) {
    footerLabel = 'STOP EARLY';
    footerAction = finishRecording;
  } else if (exerciseBreak) {
    footerLabel = 'READY — START NEXT RECORDING';
    footerAction = continueAfterExercise;
    footerDisabled = false;
  } else if (available === false) {
    footerLabel = 'SENSOR UNAVAILABLE';
    footerAction = () => {};
    footerDisabled = true;
  }

  return (
    <WireScreen
      safeArea={false}
      animateLayout={false}
      footer={
        exerciseBreak ? null : (
          <PrimaryButton
            label={footerLabel}
            onPress={footerAction}
            disabled={footerDisabled}
          />
        )
      }>
      {Platform.OS === 'web' ? (
        <Text style={styles.warn}>
          Open this project on a physical iPhone or Android device to use motion
          sensors.
        </Text>
      ) : available === false ? (
        <Text style={styles.warn}>
          Accelerometer and gyroscope sensors are not available on this device.
        </Text>
      ) : null}

      {exerciseBreak ? (
        <View
          style={[
            styles.breakBox,
            {
              backgroundColor: colors.panelBg,
              borderColor: colors.border,
              boxShadow: colors.shadow,
            },
          ]}>
          <Text style={[styles.breakTitle, { color: Wireframe.accent }]}>Light exercise break</Text>
          <Text style={[styles.breakText, { color: colors.text }]}>
            Before the next measurement, do light exercise—for example jog on the
            spot for one minute, or do 100 star jumps.
          </Text>
          <Text style={[styles.breakText, { color: colors.text }]}>
            Then lie down again, place the phone gently on your chest (screen
            facing up), and tap the button below when you are ready to record
            chest movement.
          </Text>
          <PrimaryButton
            label="READY — START NEXT RECORDING"
            onPress={continueAfterExercise}
          />
        </View>
      ) : (
        <>
          <Text style={styles.step}>
            Phase {Math.min(phaseIndex + 1, phases.length)} of {phases.length}
          </Text>
          <Text style={styles.actionLabel}>
            {allDone ? 'All phases complete' : currentLabel}
          </Text>

          {!recording && !allDone ? (
            <Text style={styles.hint}>
              Lie flat on your back. Rest the phone gently on the centre of your
              chest with the screen facing up. Breathe normally and keep your
              body still. Each recording lasts {RECORD_SECONDS} seconds.
            </Text>
          ) : null}

          <View
            style={[
              styles.meterWrap,
              {
                backgroundColor: colors.panelBg,
                borderColor: colors.border,
                boxShadow: colors.shadow,
              },
            ]}>
            <View
              style={[
                styles.meterCircle,
                {
                  backgroundColor: colors.accentSoft,
                  borderColor: colors.border,
                },
                recording && styles.meterActive,
              ]}>
              <Text style={[styles.meterText, { color: colors.text }]}>
                {recording
                  ? liveBreathsPerMin != null
                    ? `${liveBreathsPerMin}`
                    : '…'
                  : allDone && saved.length > 0
                    ? `${saved[saved.length - 1].breathsPerMinute}`
                    : '—'}
              </Text>
              <Text style={[styles.meterSub, { color: colors.textMuted }]}>breaths / min</Text>
            </View>
            <Text style={[styles.meterCaption, { color: colors.textMuted }]}>
              {recording
                ? `Recording ${elapsedS}s / ${RECORD_SECONDS}s`
                : 'Estimated from chest rise/fall, not heartbeat'}
            </Text>
            {recording && liveRotation != null ? (
              <Text style={[styles.rotationCaption, { color: colors.textMuted }]}>
                Gyro stability: {liveRotation.toFixed(2)} rad/s
              </Text>
            ) : null}
          </View>

          <View
            style={[
              styles.waveBox,
              {
                backgroundColor: colors.panelBg,
                borderColor: colors.border,
                boxShadow: colors.shadow,
              },
            ]}>
            <View style={styles.waveRow}>
              {waveform.length === 0
                ? Array.from({ length: WAVEFORM_POINTS }).map((_, i) => (
                    <View key={i} style={[styles.waveBar, { height: 4 }]} />
                  ))
                : waveform.map((v, i) => {
                    const h = 8 + ((v - waveMin) / waveRange) * 52;
                    return (
                      <View
                        key={`${i}-${v}`}
                        style={[styles.waveBar, { height: h }]}
                      />
                    );
                  })}
            </View>
            <Text style={[styles.waveCaption, { color: colors.textMuted }]}>
              Accelerometer waveform with gyroscope stability check
            </Text>
          </View>

          {saved.length > 0 ? (
            <View style={styles.savedBlock}>
              <Text style={styles.savedTitle}>Recorded</Text>
              {saved.map((r, index) => (
                <Text key={`${r.label}-${index}`} style={styles.savedRow}>
                  • {r.label}: {formatBreathingOutcome(r)}
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
        </>
      )}

      <Text style={styles.disclaimer}>
        Breaths per minute are classroom estimates from phone motion—not medical
        heart-rate or spirometry measurements. Compare breathing movement trends
        at rest vs after exercise.
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
  step: {
    color: 'rgba(255,255,255,0.76)',
    fontSize: 12,
    marginBottom: 4,
  },
  actionLabel: {
    color: Wireframe.panelBg,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
  },
  hint: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.76)',
    lineHeight: 17,
    marginBottom: 12,
  },
  meterWrap: {
    minHeight: 200,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Wireframe.panelBg,
    borderWidth: 1,
    borderColor: Wireframe.border,
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    boxShadow: Wireframe.shadow,
  },
  meterCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: Wireframe.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Wireframe.border,
  },
  meterActive: { borderColor: Wireframe.accentRed },
  meterText: { fontSize: 32, fontWeight: '800', color: Wireframe.text },
  meterSub: { fontSize: 11, color: Wireframe.textMuted, marginTop: 4 },
  meterCaption: {
    marginTop: 12,
    color: Wireframe.textMuted,
    fontSize: 13,
    textAlign: 'center',
  },
  rotationCaption: {
    marginTop: 6,
    color: Wireframe.textMuted,
    fontSize: 11,
    textAlign: 'center',
  },
  waveBox: {
    minHeight: 100,
    backgroundColor: Wireframe.panelBg,
    borderWidth: 1,
    borderColor: Wireframe.border,
    padding: 12,
    marginBottom: 12,
    borderRadius: 8,
    boxShadow: Wireframe.shadow,
  },
  waveRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    height: 64,
    gap: 2,
  },
  waveBar: {
    flex: 1,
    maxWidth: 8,
    backgroundColor: Wireframe.accent,
    borderRadius: 2,
  },
  waveCaption: { color: Wireframe.textMuted, fontSize: 11, textAlign: 'center', marginTop: 8 },
  breakBox: {
    backgroundColor: Wireframe.panelBg,
    borderWidth: 1,
    borderColor: Wireframe.border,
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    boxShadow: Wireframe.shadow,
  },
  breakTitle: {
    color: Wireframe.accent,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  breakText: {
    color: Wireframe.text,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
  savedBlock: { marginTop: 8 },
  savedTitle: { color: 'rgba(255,255,255,0.76)', fontSize: 12, marginBottom: 6 },
  savedRow: { color: Wireframe.panelBg, fontSize: 13, marginBottom: 4 },
  statusBlock: { marginTop: 12 },
  statusLine: { color: Wireframe.panelBg, fontSize: 14, marginBottom: 4 },
  disclaimer: {
    marginTop: 12,
    fontSize: 11,
    color: 'rgba(255,255,255,0.72)',
    lineHeight: 16,
  },
});
