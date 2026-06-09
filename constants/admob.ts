import { Platform } from 'react-native';

import { GOOGLE_TEST_BANNER_IDS } from '@/lib/ads/mobile-ads-module';

/** Google sample app IDs — baked into native builds via app.json. */
export const ADMOB_TEST_APP_IDS = {
  android: 'ca-app-pub-3940256099942544~3347511713',
  ios: 'ca-app-pub-3940256099942544~1458002511',
} as const;

function pickPlatformValue(android: string, ios: string): string {
  return Platform.OS === 'ios' ? ios : android;
}

/**
 * Banner unit ID from .env in production builds.
 * In development we prefer Google test banner IDs.
 */
export function getBannerAdUnitId(): string {
  if (__DEV__) {
    return pickPlatformValue(GOOGLE_TEST_BANNER_IDS.android, GOOGLE_TEST_BANNER_IDS.ios);
  }

  const android = process.env.EXPO_PUBLIC_ADMOB_BANNER_ANDROID?.trim();
  const ios = process.env.EXPO_PUBLIC_ADMOB_BANNER_IOS?.trim();

  if (Platform.OS === 'ios' && ios) return ios;
  if (Platform.OS === 'android' && android) return android;

  return pickPlatformValue(GOOGLE_TEST_BANNER_IDS.android, GOOGLE_TEST_BANNER_IDS.ios);
}

export function getAdMobAppId(): string {
  const android = process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID?.trim();
  const ios = process.env.EXPO_PUBLIC_ADMOB_IOS_APP_ID?.trim();

  if (__DEV__) {
    return pickPlatformValue(ADMOB_TEST_APP_IDS.android, ADMOB_TEST_APP_IDS.ios);
  }

  return pickPlatformValue(android ?? ADMOB_TEST_APP_IDS.android, ios ?? ADMOB_TEST_APP_IDS.ios);
}
