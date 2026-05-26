import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { ActivityCard } from '@/components/wireframe/ActivityCard';
import { WireScreen } from '@/components/wireframe/WireScreen';
import { ACTIVITIES, HUB_ACTIVITY_ORDER } from '@/constants/activities';
import { useTeam } from '@/contexts/TeamContext';
import { Wireframe } from '@/constants/wireframe-theme';

export default function RankingsListScreen() {
  const router = useRouter();
  const { teamName, teamId } = useTeam();

  return (
    <WireScreen>
      <View style={styles.header}>
        <Text style={styles.teamId}>
          {teamName}
          {teamId}
        </Text>
        <Text style={styles.sub}>Select an activity to view rankings</Text>
      </View>
      {HUB_ACTIVITY_ORDER.map((id) => {
        const a = ACTIVITIES[id];
        return (
          <ActivityCard
            key={id}
            title={a.title}
            description={a.hubDescription}
            requirements={a.requirements}
            onPress={() => router.push(`/activity/${id}/leaderboard`)}
          />
        );
      })}
    </WireScreen>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: 8 },
  teamId: {
    color: Wireframe.panelBg,
    fontSize: 18,
    fontWeight: '800',
  },
  sub: {
    color: '#cfcfcf',
    fontSize: 13,
    marginTop: 4,
  },
});
