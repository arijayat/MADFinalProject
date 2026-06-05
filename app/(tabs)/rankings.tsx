import { useRouter } from 'expo-router';

import { ActivityCard } from '@/components/wireframe/ActivityCard';
import { TabScreenHeader } from '@/components/wireframe/TabScreenHeader';
import { WireScreen } from '@/components/wireframe/WireScreen';
import { ACTIVITIES, HUB_ACTIVITY_ORDER } from '@/constants/activities';
import { useTeam } from '@/contexts/TeamContext';

export default function RankingsListScreen() {
  const router = useRouter();
  const { teamName, teamId } = useTeam();

  return (
    <WireScreen>
      <TabScreenHeader
        title={`${teamName}${teamId}`}
        subtitle="Select an activity to view rankings"
      />
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
