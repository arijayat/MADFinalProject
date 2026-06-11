import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Wireframe } from '@/constants/wireframe-theme';

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

type Props = {
  active: boolean;
};

/** Timer UI isolated from the camera subtree to avoid re-rendering CameraView every second. */
export function RecordingTimerOverlay({ active }: Props) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!active) {
      setTick(0);
      return;
    }

    const timer = setInterval(() => setTick((value) => value + 1), 1000);
    return () => clearInterval(timer);
  }, [active]);

  if (!active) return null;

  return (
    <View style={styles.recordingBar}>
      <Text style={styles.recording}>RECORDING</Text>
      <Text style={styles.timer}>{formatTime(tick)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
});
