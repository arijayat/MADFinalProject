import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DecibelCaptureScreen } from '@/components/activity/DecibelCaptureScreen';
import { ParachuteCaptureScreen } from '@/components/activity/ParachuteCaptureScreen';
import { ScreenHeader } from '@/components/wireframe/BackNav';
import { PrimaryButton } from '@/components/wireframe/PrimaryButton';
import { WireScreen } from '@/components/wireframe/WireScreen';
import { getActivity } from '@/constants/activities';
import { Wireframe } from '@/constants/wireframe-theme';

type Phase = 'idle' | 'recording' | 'done' | 'wait_reaction';

export default function ActivityCaptureScreen() {
  const router = useRouter();
  const { activityId } = useLocalSearchParams<{ activityId: string }>();
  const cfg = activityId ? getActivity(activityId) : undefined;
  const [phase, setPhase] = useState<Phase>('idle');
  const [tick, setTick] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  if (!cfg) {
    return (
      <WireScreen>
        <Text style={{ color: Wireframe.panelBg }}>Activity not found.</Text>
      </WireScreen>
    );
  }

  if (cfg.captureKind === 'decibel') {
    return <DecibelCaptureScreen cfg={cfg} />;
  }

  if (cfg.id === 'parachute-drop') {
    return <ParachuteCaptureScreen cfg={cfg} />;
  }

  const done = phase === 'done';

  let footer: ReactNode = null;
  if (cfg.captureKind === 'reaction') {
    if (phase === 'wait_reaction') {
      footer = null;
    } else if (phase === 'idle') {
      footer = <PrimaryButton label="START CAPTURE" onPress={() => setPhase('wait_reaction')} />;
    } else if (done) {
      footer = <PrimaryButton label="VIEW RESULTS" onPress={() => router.push(`/activity/${cfg.id}/dashboard`)} />;
    }
  } else if (!done) {
    if (cfg.captureKind === 'camera' && phase === 'recording') {
      footer = null;
    } else {
      footer = (
        <PrimaryButton
          label="START CAPTURE"
          onPress={() => {
            if (cfg.captureKind === 'camera') {
              setPhase('recording');
              if (cfg.showRecordingTimer) {
                setTick(0);
                timerRef.current = setInterval(() => setTick((t) => t + 1), 1000);
              }
              setTimeout(() => {
                if (timerRef.current) {
                  clearInterval(timerRef.current);
                  timerRef.current = null;
                }
                setPhase('done');
              }, 2500);
            } else {
              setTimeout(() => setPhase('done'), 500);
            }
          }}
        />
      );
    }
  } else {
    footer = <PrimaryButton label="VIEW RESULTS" onPress={() => router.push(`/activity/${cfg.id}/dashboard`)} />;
  }

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}:00`;
  };

  const viewport = () => {
    if (cfg.captureKind === 'camera') {
      return (
        <View style={styles.viewfinder}>
          {phase === 'recording' && cfg.showRecordingTimer ? (
            <View style={styles.recordingBar}>
              <Text style={styles.recording}>RECORDING</Text>
              <Text style={styles.timer}>{formatTime(tick)}</Text>
            </View>
          ) : null}
          <View style={styles.camRow}>
            <Text style={styles.tagRed}>{done ? cfg.captureDoneLabel : cfg.captureIdleLabel}</Text>
            {cfg.showSlowMo ? <Text style={styles.tagGrey}>SLOW-MO MODE</Text> : <View />}
          </View>
        </View>
      );
    }
    if (cfg.captureKind === 'decibel' || cfg.captureKind === 'vibration_hz') {
      return (
        <View style={styles.meterWrap}>
          <View style={styles.meterCircle}>
            <Text style={styles.meterText}>{done ? cfg.captureDoneLabel : cfg.captureIdleLabel}</Text>
          </View>
          <Text style={styles.meterCaption}>
            {cfg.captureKind === 'decibel' ? 'Live Decibels Reading' : 'Live vibration reading'}
          </Text>
        </View>
      );
    }
    if (cfg.captureKind === 'waveform') {
      return (
        <View style={styles.waveBox}>
          <View style={styles.waveInner} />
          <Text style={styles.waveCaption}>Accelerometer Waveform Visualization</Text>
        </View>
      );
    }
    if (cfg.captureKind === 'reaction') {
      if (phase === 'done') {
        return (
          <View style={styles.reactionWrap}>
            <Text style={styles.reactionHint}>Tap when the color changes.</Text>
            <View style={[styles.reactionSquare, { backgroundColor: '#2e7d32' }]} />
          </View>
        );
      }
      if (phase === 'wait_reaction') {
        return (
          <Pressable style={styles.reactionWrap} onPress={() => setPhase('done')}>
            <Text style={styles.reactionHint}>Tap when the color changes.</Text>
            <View style={[styles.reactionSquare, { backgroundColor: '#c62828' }]} />
          </Pressable>
        );
      }
      return (
        <View style={styles.reactionWrap}>
          <Text style={styles.reactionHint}>Tap START CAPTURE to begin.</Text>
          <View style={[styles.reactionSquare, { backgroundColor: '#9e9e9e' }]} />
        </View>
      );
    }
    return null;
  };

  return (
    <WireScreen scroll={false} footer={footer ?? undefined}>
      <ScreenHeader
        backLabel="BACK"
        onBack={() => router.back()}
        title="Sensor Capture"
        subtitle="Perform the experiment and capture."
      />
      {viewport()}
      {done ? (
        <View style={styles.statusBlock}>
          <Text style={styles.statusLine}>✓ {cfg.captureDoneStatusA}</Text>
          <Text style={styles.statusLine}>✓ {cfg.captureDoneStatusB}</Text>
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
    justifyContent: 'center',
    padding: 12,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    flex: 1,
  },
  tagRed: {
    backgroundColor: Wireframe.accentRed,
    color: Wireframe.panelBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontWeight: '800',
    fontSize: 12,
    overflow: 'hidden',
  },
  tagGrey: {
    backgroundColor: '#555',
    color: Wireframe.panelBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 11,
  },
  meterWrap: {
    minHeight: 280,
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
  meterText: { fontSize: 28, fontWeight: '800', color: Wireframe.text },
  meterCaption: { marginTop: 12, color: '#cfcfcf', fontSize: 13 },
  waveBox: {
    minHeight: 280,
    backgroundColor: '#3a3a3a',
    borderWidth: 1,
    borderColor: '#555',
    padding: 12,
    justifyContent: 'flex-end',
  },
  waveInner: {
    flex: 1,
    backgroundColor: '#111',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  waveCaption: { color: '#cfcfcf', fontSize: 12, textAlign: 'center' },
  reactionWrap: {
    minHeight: 280,
    backgroundColor: '#3a3a3a',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#555',
  },
  reactionHint: { color: Wireframe.panelBg, marginBottom: 16, fontSize: 14 },
  reactionSquare: { width: 160, height: 160 },
  statusBlock: { marginTop: 12 },
  statusLine: { color: Wireframe.panelBg, fontSize: 14, marginBottom: 4 },
});
