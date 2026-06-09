import { getMobileAdsModule } from '@/lib/ads/mobile-ads-module';

let initPromise: Promise<void> | null = null;

export function initializeAdMob(): Promise<void> {
  const mobileAds = getMobileAdsModule()?.default;
  if (!mobileAds) {
    return Promise.resolve();
  }

  if (initPromise) return initPromise;

  initPromise = mobileAds()
    .initialize()
    .then(() => undefined)
    .catch((error) => {
      initPromise = null;
      console.warn('AdMob initialization failed', error);
      throw error;
    });

  return initPromise;
}
