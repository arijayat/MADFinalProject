import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Battery from 'expo-battery';
import { useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { Wireframe } from '@/constants/wireframe-theme';

export function BatteryCaptureBanner() {
  const [level, setLevel] = useState<number | null>(null);
  const [charging, setCharging] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web') return;

    void Battery.getBatteryLevelAsync().then(setLevel);
    void Battery.getBatteryStateAsync().then((state) => {
      setCharging(
        state === Battery.BatteryState.CHARGING ||
          state === Battery.BatteryState.FULL,
      );
    });

    const levelSub = Battery.addBatteryLevelListener(({ batteryLevel }) => {
      setLevel(batteryLevel);
    });
    const stateSub = Battery.addBatteryStateListener(({ batteryState }) => {
      setCharging(
        batteryState === Battery.BatteryState.CHARGING ||
          batteryState === Battery.BatteryState.FULL,
      );
    });

    return () => {
      levelSub.remove();
      stateSub.remove();
    };
  }, []);

  if (Platform.OS === 'web' || level == null) return null;

  const pct = Math.round(level * 100);
  const low = pct < 20 && !charging;

  return (
    <View style={[styles.row, low && styles.rowLow]}>
      <MaterialIcons
        name={charging ? 'battery-charging-full' : 'battery-std'}
        size={16}
        color={low ? Wireframe.accentYellow : Wireframe.textMuted}
      />
      <Text style={[styles.text, low && styles.textLow]}>
        Battery {pct}%
        {charging ? ' · charging' : ''}
        {low ? ' · low — plug in for best results' : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginBottom: 8,
    backgroundColor: Wireframe.panelBg,
    borderWidth: 1,
    borderColor: Wireframe.border,
    borderRadius: 8,
    boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)',
  },
  rowLow: {
    borderColor: Wireframe.accentYellow,
  },
  text: {
    flex: 1,
    fontSize: 12,
    color: Wireframe.textMuted,
  },
  textLow: {
    color: Wireframe.text,
    fontWeight: '600',
  },
});
