import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/wireframe/PrimaryButton';
import { Wireframe } from '@/constants/wireframe-theme';
import type { VideoUploadState } from '@/hooks/useActivityVideoUpload';
import { formatActivityMediaExpiry } from '@/lib/storage/media-expiry';

type Props = {
  state: VideoUploadState;
  error: string | null;
  expiresAtMs?: number | null;
  onRetry?: () => void;
};

export function ActivityVideoUploadStatus({ state, error, expiresAtMs, onRetry }: Props) {
  if (state === 'idle') return null;

  if (state === 'uploading') {
    return (
      <View style={styles.row}>
        <ActivityIndicator color={Wireframe.text} />
        <Text style={styles.text}>Uploading video to cloud…</Text>
      </View>
    );
  }

  if (state === 'done') {
    return (
      <Text style={styles.done}>
        ✓ Video uploaded
        {expiresAtMs ? ` — available until ${formatActivityMediaExpiry(expiresAtMs)}` : ''}
      </Text>
    );
  }

  return (
    <View style={styles.failedBlock}>
      <Text style={styles.failed}>{error ?? 'Video upload failed.'}</Text>
      {onRetry ? (
        <PrimaryButton label="RETRY UPLOAD" onPress={onRetry} variant="light" style={styles.retry} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
    marginBottom: 4,
  },
  text: {
    color: Wireframe.textMuted,
    fontSize: 13,
  },
  done: {
    marginTop: 10,
    marginBottom: 4,
    color: Wireframe.text,
    fontSize: 13,
    fontWeight: '600',
  },
  failedBlock: {
    marginTop: 10,
    gap: 8,
  },
  failed: {
    color: Wireframe.accentYellow,
    fontSize: 13,
    lineHeight: 18,
  },
  retry: {
    alignSelf: 'flex-start',
  },
});
