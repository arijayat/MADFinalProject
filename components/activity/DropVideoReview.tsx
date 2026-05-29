import { useVideoPlayer, VideoView } from 'expo-video';
import { StyleSheet, Text, View } from 'react-native';

import { Wireframe } from '@/constants/wireframe-theme';

type Props = {
  uri: string;
  /** Playback speed; values below 1 play in slow motion (e.g. 0.25 = quarter speed). */
  playbackRate?: number;
};

export function DropVideoReview({ uri, playbackRate = 1 }: Props) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = false;
    p.playbackRate = playbackRate;
  });

  const showSlowMoBadge = playbackRate > 0 && playbackRate < 1;

  return (
    <View style={styles.wrap}>
      <VideoView style={styles.video} player={player} nativeControls contentFit="contain" />
      {showSlowMoBadge ? (
        <View style={styles.slowMoBadge}>
          <Text style={styles.slowMoText}>
            Slow motion ({playbackRate < 1 ? `${Math.round(1 / playbackRate)}×` : `${playbackRate}×`})
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    minHeight: 280,
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#555',
    overflow: 'hidden',
  },
  video: {
    width: '100%',
    height: 280,
  },
  slowMoBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  slowMoText: {
    color: Wireframe.panelBg,
    fontSize: 11,
    fontWeight: '700',
  },
});
