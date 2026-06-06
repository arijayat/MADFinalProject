import { Accelerometer } from 'expo-sensors';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Platform, StyleSheet, Text, View } from 'react-native';

import { BatteryCaptureBanner } from '@/components/device/BatteryCaptureBanner';
import { ScreenHeader } from '@/components/wireframe/BackNav';
import { PrimaryButton } from '@/components/wireframe/PrimaryButton';
import { WireScreen } from '@/components/wireframe/WireScreen';
import type { ActivityConfig } from '@/constants/activities';
import { Wireframe } from '@/constants/wireframe-theme';
import {
  useActivitySession,
  type VibrationReading,
} from '@/contexts/ActivitySessionContext';
import { useAppTheme } from '@/contexts/AppThemeContext';
import {
  formatTilt,
  formatVibration,
  levelLabel,
  levelStatus,
  tiltDegrees,
  vibrationMs2,
  type LevelStatus,
} from '@/utils/vibration';
import { confirmBatteryForCapture } from '@/lib/device/battery-guard';

type Props = {
  cfg: ActivityConfig;
};

type Phase = 'level' | 'recording' | 'between';

export function VibrationCaptureScreen({ cfg }: Props) {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { setVibrationReadings } = useActivitySession();
  const actions = cfg.vibrationDesignActions ?? ['Design test'];
  const [actionIndex, setActionIndex] = useState(0);
  const [saved, setSaved] = useState<VibrationReading[]>([]);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [phase, setPhase] = useState<Phase>('level');
  const [liveTilt, setLiveTilt] = useState<number | null>(null);
  const [liveVibration, setLiveVibration] = useState<number | null>(null);
  const [levelState, setLevelState] = useState<LevelStatus>('slight');
  const [startTilt, setStartTilt] = useState<number | null>(null);
  const [peakTiltDisplay, setPeakTiltDisplay] = useState<number | null>(null);
  const [peakVibrationDisplay, setPeakVibrationDisplay] = useState<
    number | null
  >(null);

  const peakTiltRef = useRef<number | null>(null);
  const peakVibrationRef = useRef<number | null>(null);
  const subscriptionRef = useRef<{ remove: () => void } | null>(null);

  const allDone = saved.length >= actions.length;
  const currentLabel = actions[actionIndex] ?? actions[actions.length - 1];

  const stopSubscription = useCallback(() => {
    subscriptionRef.current?.remove();
    subscriptionRef.current = null;
  }, []);

  const startSubscription = useCallback(
    (mode: 'level' | 'recording', baselineTilt: number | null) => {
      stopSubscription();
      Accelerometer.setUpdateInterval(50);
      subscriptionRef.current = Accelerometer.addListener(({ x, y, z }) => {
        const tilt = tiltDegrees({ x, y, z });
        setLiveTilt(tilt);
        setLevelState(levelStatus(tilt));

        if (mode === 'recording') {
          const vib = vibrationMs2({ x, y, z });
          setLiveVibration(vib);
          const baseline = baselineTilt ?? tilt;
          const tiltChange = Math.abs(tilt - baseline);
          if (peakTiltRef.current == null || tiltChange > peakTiltRef.current) {
            peakTiltRef.current = tiltChange;
            setPeakTiltDisplay(tiltChange);
          }
          if (
            peakVibrationRef.current == null ||
            vib > peakVibrationRef.current
          ) {
            peakVibrationRef.current = vib;
            setPeakVibrationDisplay(vib);
          }
        }
      });
    },
    [stopSubscription],
  );

  useEffect(() => {
    (async () => {
      if (Platform.OS === 'web') {
        setAvailable(false);
        return;
      }
      const isAvailable = await Accelerometer.isAvailableAsync();
      setAvailable(isAvailable);
      if (isAvailable) {
        startSubscription('level', null);
      }
    })();
    return () => stopSubscription();
  }, [cfg.id, startSubscription, stopSubscription]);

  const beginRecording = useCallback(async () => {
    const batteryOk = await confirmBatteryForCapture({
      activityLabel: 'accelerometer recording',
      strictBlock: true,
    });
    if (!batteryOk) return;

    if (levelState === 'unlevel') {
      Alert.alert(
        'Surface not level',
        'Adjust the platform so the phone reads level (within 5°) before starting the earthquake test.',
      );
      return;
    }
    peakTiltRef.current = null;
    peakVibrationRef.current = null;
    setPeakTiltDisplay(null);
    setPeakVibrationDisplay(null);
    setLiveVibration(null);
    setStartTilt(liveTilt);
    setPhase('recording');
    startSubscription('recording', liveTilt);
  }, [levelState, liveTilt, startSubscription]);

  const stopRecording = useCallback(() => {
    stopSubscription();
    const reading: VibrationReading = {
      label: currentLabel,
      peakTiltDeg: peakTiltRef.current ?? 0,
      peakVibrationMs2: peakVibrationRef.current ?? 0,
      startLevelDeg: startTilt ?? liveTilt ?? 0,
    };
    const nextSaved = [...saved, reading];
    setSaved(nextSaved);
    setPhase('between');
    setLiveVibration(null);

    if (actionIndex + 1 < actions.length) {
      setActionIndex((i) => i + 1);
      peakTiltRef.current = null;
      peakVibrationRef.current = null;
      setPeakTiltDisplay(null);
      setPeakVibrationDisplay(null);
      setStartTilt(null);
      setPhase('level');
      startSubscription('level', null);
    } else {
      setVibrationReadings(cfg.id, nextSaved);
    }
  }, [
    stopSubscription,
    currentLabel,
    saved,
    startTilt,
    liveTilt,
    actionIndex,
    actions.length,
    setVibrationReadings,
    cfg.id,
    startSubscription,
  ]);

  const meterPrimary = () => {
    if (allDone && saved.length > 0) {
      const steadiest = saved.reduce((a, b) =>
        b.peakTiltDeg < a.peakTiltDeg ? b : a,
      );
      return formatTilt(steadiest.peakTiltDeg);
    }
    if (phase === 'recording') return formatVibration(liveVibration);
    return formatTilt(liveTilt);
  };

  const meterCaption = () => {
    if (phase === 'recording') {
      return 'Live vibration — shake the table gently now';
    }
    return levelLabel(levelState);
  };

  let footerLabel = 'START EARTHQUAKE TEST';
  let footerAction: () => void = beginRecording;
  let footerDisabled = available === false;

  if (allDone) {
    footerLabel = 'VIEW RESULTS';
    footerAction = () => router.push(`/activity/${cfg.id}/dashboard`);
  } else if (phase === 'recording') {
    footerLabel = 'STOP TEST';
    footerAction = stopRecording;
  } else if (available === false) {
    footerLabel = 'SENSOR UNAVAILABLE';
    footerAction = () => {};
    footerDisabled = true;
  }

  return (
    <WireScreen
      scroll={false}
      footer={
        <PrimaryButton
          label={footerLabel}
          onPress={footerAction}
          disabled={footerDisabled}
        />
      }>
      <BatteryCaptureBanner />

      <ScreenHeader
        backLabel="BACK"
        onBack={() => router.back()}
        title="Vibration & level capture"
        subtitle="Use accelerometer and level sensor on your phone."
      />

      {Platform.OS === 'web' ? (
        <Text style={styles.warn}>
          Open this project on a physical iPhone or Android device to use motion
          sensors.
        </Text>
      ) : available === false ? (
        <Text style={styles.warn}>
          Motion sensors are not available on this device.
        </Text>
      ) : null}

      <Text style={styles.step}>
        Step {Math.min(actionIndex + 1, actions.length)} of {actions.length}
      </Text>
      <Text style={styles.actionLabel}>
        {allDone ? 'All designs tested' : currentLabel}
      </Text>

      <View style={styles.levelRow}>
        <View
          style={[
            styles.levelDot,
            levelState === 'level' && styles.levelDotGood,
            levelState === 'slight' && styles.levelDotWarn,
            levelState === 'unlevel' && styles.levelDotBad,
          ]}
        />
        <Text style={[styles.levelText, { color: colors.headerSubtle }]}>
          {phase === 'recording'
            ? `Peak tilt: ${formatTilt(peakTiltDisplay)} · Peak vibration: ${formatVibration(peakVibrationDisplay)}`
            : `Level check: ${formatTilt(liveTilt)} from flat`}
        </Text>
      </View>

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
            phase === 'recording' && styles.meterActive,
            phase !== 'recording' &&
              levelState === 'level' &&
              styles.meterLevel,
          ]}>
          <Text style={[styles.meterText, { color: colors.text }]}>{meterPrimary()}</Text>
          <Text style={[styles.meterSub, { color: colors.textMuted }]}>
            {phase === 'recording' ? 'peak vibration' : 'surface tilt'}
          </Text>
        </View>
        <Text style={[styles.meterCaption, { color: colors.textMuted }]}>{meterCaption()}</Text>
      </View>

      {phase === 'level' && !allDone ? (
        <Text style={styles.hint}>
          Place the phone screen-up on your cardboard platform so you can use the
          buttons. When the level dot is green, tap START and gently shake the
          table to simulate an earthquake.
        </Text>
      ) : null}

      {saved.length > 0 ? (
        <View style={styles.savedBlock}>
          <Text style={styles.savedTitle}>Recorded</Text>
          {saved.map((r) => (
            <Text key={r.label} style={styles.savedRow}>
              • {r.label}: tilt {formatTilt(r.peakTiltDeg)}, vibration{' '}
              {formatVibration(r.peakVibrationMs2)}
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
        Tilt and vibration values are relative estimates for comparing designs
        in class—not certified seismograph readings.
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
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  levelDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#888',
  },
  levelDotGood: { backgroundColor: '#2e7d32' },
  levelDotWarn: { backgroundColor: Wireframe.accentYellow },
  levelDotBad: { backgroundColor: Wireframe.accentRed },
  levelText: { color: '#ccc', fontSize: 12, flex: 1 },
  meterWrap: {
    minHeight: 240,
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
  meterLevel: { borderColor: '#2e7d32' },
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
