import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Platform, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/wireframe/PrimaryButton';
import { WireScreen } from '@/components/wireframe/WireScreen';
import type { ActivityConfig } from '@/constants/activities';
import { Wireframe } from '@/constants/wireframe-theme';
import { useAppTheme } from '@/contexts/AppThemeContext';
import { useActivitySession, type DecibelReading } from '@/contexts/ActivitySessionContext';
import { useActivityWorkflowChrome } from '@/contexts/ActivityWorkflowContext';
import { captureStepIndex } from '@/lib/activity-progress/steps';
import { confirmBatteryForCapture } from '@/lib/device/battery-guard';
import { formatDisplayDb, meteringToDisplayDb } from '@/utils/decibels';

const METERING_OPTIONS = {
  ...RecordingPresets.HIGH_QUALITY,
  isMeteringEnabled: true,
};

type Props = {
  cfg: ActivityConfig;
};

export function DecibelCaptureScreen({ cfg }: Props) {
  const router = useRouter();
  const { stepId } = useLocalSearchParams<{ stepId?: string }>();
  const { colors } = useAppTheme();
  const { setActiveStepId } = useActivityWorkflowChrome();
  const { getSession, setDecibelReadings } = useActivitySession();
  const session = getSession(cfg.id);
  const actions = cfg.decibelActions ?? ['Measurement'];
  const [actionIndex, setActionIndex] = useState(0);
  const [saved, setSaved] = useState<DecibelReading[]>([]);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [liveDb, setLiveDb] = useState<number | null>(null);
  const [peakDb, setPeakDb] = useState<number | null>(null);
  const peakRef = useRef<number | null>(null);

  const recorder = useAudioRecorder(METERING_OPTIONS);
  const recorderState = useAudioRecorderState(recorder, 100);

  const isRecording = recorderState.isRecording;
  const allDone = saved.length >= actions.length;
  const currentLabel = actions[actionIndex] ?? actions[actions.length - 1];

  useEffect(() => {
    setActiveStepId(`capture-${actionIndex}`);
  }, [actionIndex, setActiveStepId]);

  useEffect(() => {
    const stored = session.decibelReadings;
    if (stored.length === 0) return;
    setSaved(stored);
    const requested = captureStepIndex(stepId);
    const nextIndex =
      requested != null && requested < actions.length
        ? requested
        : Math.min(stored.length, actions.length - 1);
    setActionIndex(nextIndex);
  }, [actions.length, session.decibelReadings, stepId]);

  useEffect(() => {
    (async () => {
      if (Platform.OS === 'web') {
        setPermissionGranted(false);
        return;
      }
      const status = await AudioModule.requestRecordingPermissionsAsync();
      setPermissionGranted(status.granted);
      if (status.granted) {
        await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      }
    })();
  }, [cfg.id]);

  useEffect(() => {
    if (!isRecording || recorderState.metering == null) return;
    const display = meteringToDisplayDb(recorderState.metering);
    setLiveDb(display);
    if (peakRef.current == null || display > peakRef.current) {
      peakRef.current = display;
      setPeakDb(display);
    }
  }, [isRecording, recorderState.metering]);

  const startMeasurement = useCallback(async () => {
    const batteryOk = await confirmBatteryForCapture({
      activityLabel: 'microphone measurement',
      strictBlock: true,
    });
    if (!batteryOk) return;

    if (Platform.OS === 'web') {
      Alert.alert('Use a phone', 'Sound measurement requires the iOS or Android app on a real device.');
      return;
    }
    if (!permissionGranted) {
      const status = await AudioModule.requestRecordingPermissionsAsync();
      if (!status.granted) {
        Alert.alert('Microphone needed', 'Allow microphone access to measure sound levels.');
        return;
      }
      setPermissionGranted(true);
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    }
    peakRef.current = null;
    setLiveDb(null);
    setPeakDb(null);
    try {
      await recorder.prepareToRecordAsync(METERING_OPTIONS);
      recorder.record();
    } catch {
      Alert.alert('Could not start', 'Unable to start the microphone. Try again on a physical device.');
    }
  }, [permissionGranted, recorder]);

  const stopMeasurement = useCallback(async () => {
    try {
      await recorder.stop();
    } catch {
      /* already stopped */
    }
    const peak = peakRef.current ?? liveDb ?? 35;
    const reading: DecibelReading = { label: currentLabel, peakDb: peak };
    const nextSaved = [...saved];
    nextSaved[actionIndex] = reading;
    setSaved(nextSaved);
    setDecibelReadings(cfg.id, nextSaved);

    if (actionIndex + 1 < actions.length) {
      setActionIndex((i) => i + 1);
      setLiveDb(null);
      setPeakDb(null);
      peakRef.current = null;
    }
  }, [recorder, liveDb, currentLabel, saved, actionIndex, actions.length, setDecibelReadings, cfg.id]);

  const meterLabel = () => {
    if (allDone && saved.length > 0) {
      const loudest = saved.reduce((a, b) => (b.peakDb > a.peakDb ? b : a));
      return formatDisplayDb(loudest.peakDb);
    }
    if (isRecording) return formatDisplayDb(liveDb);
    if (peakDb != null && !isRecording && saved.length < actions.length) return formatDisplayDb(peakDb);
    return '—';
  };

  let footerLabel = 'START MEASUREMENT';
  let footerAction: () => void = startMeasurement;
  if (allDone) {
    footerLabel = 'VIEW RESULTS';
    footerAction = () => router.replace(`/activity/${cfg.id}/dashboard`);
  } else if (isRecording) {
    footerLabel = 'STOP MEASUREMENT';
    footerAction = stopMeasurement;
  }

  return (
    <WireScreen
      safeArea={false}
      animateLayout={false}
      footer={
        permissionGranted === false && Platform.OS !== 'web' ? (
          <PrimaryButton
            label="ALLOW MICROPHONE"
            onPress={async () => {
              const status = await AudioModule.requestRecordingPermissionsAsync();
              setPermissionGranted(status.granted);
            }}
          />
        ) : (
          <PrimaryButton label={footerLabel} onPress={footerAction} disabled={permissionGranted === false} />
        )
      }>
      {Platform.OS === 'web' ? (
        <Text style={styles.warn}>
          Open this project on a physical iPhone or Android device to use the microphone.
        </Text>
      ) : null}

      <Text style={styles.step}>
        Step {Math.min(actionIndex + 1, actions.length)} of {actions.length}
      </Text>
      <Text style={styles.actionLabel}>{allDone ? 'All actions measured' : currentLabel}</Text>

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
            isRecording && styles.meterActive,
          ]}>
          <Text style={[styles.meterText, { color: colors.text }]}>{meterLabel()}</Text>
        </View>
        <Text style={[styles.meterCaption, { color: colors.textMuted }]}>
          {isRecording ? 'Listening… make the sound now' : 'Live decibel reading (approximate)'}
        </Text>
      </View>

      {saved.length > 0 ? (
        <View style={styles.savedBlock}>
          <Text style={styles.savedTitle}>Recorded</Text>
          {saved.map((r, index) => (
            <Text key={`${r.label}-${index}`} style={styles.savedRow}>
              • {r.label}: {formatDisplayDb(r.peakDb)}
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
        Values are relative estimates for classroom comparison, not a certified sound-level meter.
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
    marginBottom: 12,
  },
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
  meterActive: {
    borderColor: Wireframe.accentRed,
  },
  meterText: { fontSize: 26, fontWeight: '800', color: Wireframe.text },
  meterCaption: { marginTop: 12, color: '#cfcfcf', fontSize: 13, textAlign: 'center' },
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
