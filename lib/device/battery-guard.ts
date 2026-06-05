import * as Battery from 'expo-battery';
import { Alert, Platform } from 'react-native';

export type BatteryGuardLevel = 'ok' | 'warn' | 'block';

export async function getBatteryGuardLevel(): Promise<BatteryGuardLevel> {
  if (Platform.OS === 'web') return 'ok';

  try {
    const state = await Battery.getBatteryStateAsync();
    if (
      state === Battery.BatteryState.CHARGING ||
      state === Battery.BatteryState.FULL
    ) {
      return 'ok';
    }
    const level = await Battery.getBatteryLevelAsync();
    if (level < 0.1) return 'block';
    if (level < 0.2) return 'warn';
    return 'ok';
  } catch {
    return 'ok';
  }
}

export function confirmBatteryForCapture(options: {
  activityLabel: string;
  /** When true, block below 10% unless user overrides. Default true for long sensor sessions. */
  strictBlock?: boolean;
}): Promise<boolean> {
  return new Promise((resolve) => {
    void (async () => {
      const level = await getBatteryGuardLevel();
      if (level === 'ok') {
        resolve(true);
        return;
      }

      if (level === 'warn') {
        Alert.alert(
          'Low battery',
          `Battery is below 20%. ${options.activityLabel} uses more power. Plug in if you can.`,
          [
            { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
            { text: 'Continue', onPress: () => resolve(true) },
          ],
        );
        return;
      }

      const message = options.strictBlock
        ? `Battery is below 10%. Charge your device before ${options.activityLabel}.`
        : `Battery is below 10%. ${options.activityLabel} may stop early or fail to upload.`;

      Alert.alert('Battery too low', message, [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
        { text: 'Try anyway', onPress: () => resolve(true) },
      ]);
    })();
  });
}
