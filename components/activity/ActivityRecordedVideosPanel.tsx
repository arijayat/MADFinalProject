import { StyleSheet, Text, View } from 'react-native';

import { DropVideoReview } from '@/components/activity/DropVideoReview';
import { Panel } from '@/components/wireframe/Panel';
import { Wireframe } from '@/constants/wireframe-theme';
import {
  activeStoredMediaUrl,
  formatActivityMediaExpiry,
  isActivityMediaExpired,
  type StoredActivityMedia,
} from '@/lib/storage/media-expiry';

type VideoEntry = {
  label: string;
  video: StoredActivityMedia | null | undefined;
};

type Props = {
  title: string;
  entries: VideoEntry[];
};

export function ActivityRecordedVideosPanel({ title, entries }: Props) {
  const visible = entries.filter((entry) => activeStoredMediaUrl(entry.video));
  const expiredCount = entries.filter(
    (entry) => entry.video?.url && isActivityMediaExpired(entry.video.expiresAtMs),
  ).length;

  if (visible.length === 0 && expiredCount === 0) return null;

  return (
    <Panel>
      <Text style={styles.title}>{title}</Text>
      {visible.map((entry, entryIndex) => {
        const url = activeStoredMediaUrl(entry.video);
        if (!url || !entry.video) return null;
        return (
          <View key={`${entry.label}-${entryIndex}`} style={styles.block}>
            <Text style={styles.label}>{entry.label}</Text>
            <Text style={styles.expiry}>
              Stored until {formatActivityMediaExpiry(entry.video.expiresAtMs)}
            </Text>
            <DropVideoReview uri={url} />
          </View>
        );
      })}
      {expiredCount > 0 ? (
        <Text style={styles.expiredNote}>
          {expiredCount} video{expiredCount > 1 ? 's were' : ' was'} removed from cloud storage
          after 30 days. Your measured results are still saved.
        </Text>
      ) : null}
    </Panel>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: Wireframe.text,
    marginBottom: 10,
  },
  block: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: Wireframe.text,
    marginBottom: 4,
  },
  expiry: {
    fontSize: 12,
    color: Wireframe.textMuted,
    marginBottom: 8,
  },
  expiredNote: {
    fontSize: 12,
    color: Wireframe.textMuted,
    lineHeight: 17,
  },
});
