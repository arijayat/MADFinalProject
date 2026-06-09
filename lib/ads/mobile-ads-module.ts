import Constants from 'expo-constants';

/** Google sample banner IDs — used when the native AdMob module is unavailable. */
export const GOOGLE_TEST_BANNER_IDS = {
  android: 'ca-app-pub-3940256099942544/6300978111',
  ios: 'ca-app-pub-3940256099942544/2934735716',
} as const;

type MobileAdsModule = typeof import('react-native-google-mobile-ads');

/**
 * AdMob uses custom native code and is not included in Expo Go.
 * Lazy-load the module so the rest of the app still runs in Expo Go.
 */
export function isAdMobSupported(): boolean {
  return Constants.appOwnership !== 'expo';
}

export function getMobileAdsModule(): MobileAdsModule | null {
  if (!isAdMobSupported()) return null;

  try {
    return require('react-native-google-mobile-ads') as MobileAdsModule;
  } catch {
    return null;
  }
}
