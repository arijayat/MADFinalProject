import { useVideoPlayer, VideoView } from 'expo-video';
import { StyleSheet, View } from 'react-native';

type Props = {
  uri: string;
};

export function DropVideoReview({ uri }: Props) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = false;
  });

  return (
    <View style={styles.wrap}>
      <VideoView style={styles.video} player={player} nativeControls contentFit="contain" />
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
});
