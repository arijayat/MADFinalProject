import { StyleSheet, Text, View } from 'react-native';

import { DropVideoReview } from '@/components/activity/DropVideoReview';
import { Panel } from '@/components/wireframe/Panel';
import { Wireframe } from '@/constants/wireframe-theme';
import {
  activeActivityMediaUrl,
  formatActivityMediaExpiry,
} from '@/lib/storage/activity-media-expiry';

type VideoEntry = {
  title: string;
  videoUrl: string | null | undefined;
  videoExpiresAtMs: number | null | undefined;
};

type Props = {
  title: string;
  entries: VideoEntry[];
  playbackRate?: number;
};

export function StoredActivityVideos({ title, entries, playbackRate = 0.25 }: Props) {
  const visible = entries
    .map((entry) => ({
      ...entry,
      activeUrl: activeActivityMediaUrl(entry.videoUrl, entry.videoExpiresAtMs),
    }))
    .filter((entry) => entry.activeUrl);

  const expiredCount = entries.filter(
    (entry) => entry.videoUrl && !activeActivityMediaUrl(entry.videoUrl, entry.videoExpiresAtMs),
  ).length;

  if (visible.length === 0 && expiredCount === 0) return null;

  return (
    <Panel>
      <Text style={styles.title}>{title}</Text>
      {visible.map((entry) => (
        <View key={entry.title} style={styles.block}>
          <Text style={styles.label}>{entry.title}</Text>
          {entry.videoExpiresAtMs ? (
            <Text style={styles.expiry}>
              Stored until {formatActivityMediaExpiry(entry.videoExpiresAtMs)}
            </Text>
          ) : null}
          {entry.activeUrl ? (
            <DropVideoReview uri={entry.activeUrl} playbackRate={playbackRate} />
          ) : null}
        </View>
      ))}
      {expiredCount > 0 ? (
        <Text style={styles.expiredNote}>
          {expiredCount} video{expiredCount === 1 ? '' : 's'} expired and were removed from cloud
          storage. Measurements above are still saved.
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
    marginBottom: 14,
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
