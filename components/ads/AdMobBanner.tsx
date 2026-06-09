import { useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { getBannerAdUnitId } from '@/constants/admob';
import { initializeAdMob } from '@/lib/ads/admob';
import { getMobileAdsModule, isAdMobSupported } from '@/lib/ads/mobile-ads-module';

type Props = {
  /** Hide on web — AdMob is mobile-only. */
  visible?: boolean;
};

export function AdMobBanner({ visible = true }: Props) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web' || !visible || !isAdMobSupported()) return;

    const mobileAds = getMobileAdsModule();
    if (!mobileAds) return;

    let cancelled = false;

    initializeAdMob()
      .then(() => {
        if (!cancelled) setReady(true);
      })
      .catch(() => {
        if (!cancelled) setReady(false);
      });

    return () => {
      cancelled = true;
    };
  }, [visible]);

  if (Platform.OS === 'web' || !visible || !ready) {
    return null;
  }

  const mobileAds = getMobileAdsModule();
  if (!mobileAds) return null;

  const { BannerAd, BannerAdSize } = mobileAds;

  return (
    <View style={styles.wrap}>
      <BannerAd unitId={getBannerAdUnitId()} size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    width: '100%',
  },
});
