import { StyleSheet, Text, View } from 'react-native';

import { Panel } from '@/components/wireframe/Panel';
import { WireScreen } from '@/components/wireframe/WireScreen';
import { useTeam } from '@/contexts/TeamContext';
import { Wireframe } from '@/constants/wireframe-theme';

export default function TeamTabScreen() {
  const { teamName, teamId, members } = useTeam();
  const displayMembers =
    members.length > 0
      ? members
      : [{ id: 'placeholder', name: 'Student A', email: 'studenta@mail.edu' }];

  return (
    <WireScreen>
      <View style={styles.header}>
        <Text style={styles.teamId}>
          {teamName}
          {teamId}
        </Text>
        <Text style={styles.sub}>Team members information</Text>
      </View>
      {displayMembers.map((m) => (
        <Panel key={m.id}>
          <Text style={styles.memberName}>{m.name}</Text>
          {m.email ? <Text style={styles.email}>{m.email}</Text> : null}
        </Panel>
      ))}
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
  memberName: {
    fontSize: 16,
    fontWeight: '700',
    color: Wireframe.text,
  },
  email: {
    fontSize: 13,
    color: Wireframe.textMuted,
    marginTop: 4,
  },
});
