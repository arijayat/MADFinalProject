import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Wireframe } from '@/constants/wireframe-theme';
import { formatActivityMediaExpiry } from '@/lib/storage/activity-media-expiry';
import type { StoredActivityMedia } from '@/lib/storage/activity-media-expiry';

type Props = {
  canUpload: boolean;
  uploading: boolean;
  uploaded: StoredActivityMedia | null;
  uploadError: string | null;
  onRetry?: () => void;
};

export function VideoUploadBanner({
  canUpload,
  uploading,
  uploaded,
  uploadError,
  onRetry,
}: Props) {
  if (!canUpload) {
    return (
      <View style={styles.banner}>
        <Text style={styles.muted}>
          Sign in and join a team to save drop videos to the cloud (compressed, kept 30 days).
        </Text>
      </View>
    );
  }

  if (uploading) {
    return (
      <View style={styles.banner}>
        <ActivityIndicator color={Wireframe.text} />
        <Text style={styles.text}>Compressing and uploading video…</Text>
      </View>
    );
  }

  if (uploaded) {
    return (
      <View style={[styles.banner, styles.success]}>
        <Text style={styles.text}>
          ✓ Video saved to cloud until {formatActivityMediaExpiry(uploaded.expiresAtMs)}
        </Text>
      </View>
    );
  }

  if (uploadError) {
    return (
      <View style={[styles.banner, styles.error]}>
        <Text style={styles.text}>{uploadError}</Text>
        {onRetry ? (
          <Pressable onPress={onRetry} hitSlop={8}>
            <Text style={styles.retry}>Tap to retry upload</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  banner: {
    marginTop: 10,
    marginBottom: 4,
    padding: 10,
    borderWidth: 1,
    borderColor: Wireframe.border,
    backgroundColor: Wireframe.panelBg,
    gap: 6,
  },
  success: {
    borderColor: Wireframe.text,
  },
  error: {
    borderColor: Wireframe.accentRed,
  },
  text: {
    fontSize: 12,
    color: Wireframe.text,
    lineHeight: 17,
  },
  muted: {
    fontSize: 12,
    color: Wireframe.textMuted,
    lineHeight: 17,
  },
  retry: {
    fontSize: 12,
    fontWeight: '700',
    color: Wireframe.accentYellow,
    textDecorationLine: 'underline',
  },
});
