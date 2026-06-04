import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { Panel } from '@/components/wireframe/Panel';
import { WireScreen } from '@/components/wireframe/WireScreen';
import { useAuth } from '@/contexts/AuthContext';
import { useTeam, type TeamMember } from '@/contexts/TeamContext';
import { Wireframe } from '@/constants/wireframe-theme';

/** Hide legacy placeholder emails generated before accounts were linked. */
function memberDisplayEmail(member: TeamMember, authUid?: string, authEmail?: string | null): string | null {
  if (member.uid && authUid && member.uid === authUid && authEmail?.trim()) {
    return authEmail.trim();
  }

  const email = member.email?.trim();
  if (!email) return null;
  if (!member.uid && email.endsWith('@mail.edu')) return null;
  return email;
}

export default function TeamTabScreen() {
  const { user } = useAuth();
  const { teamName, teamId, members, isLoadingTeam, teamDocId } = useTeam();

  if (isLoadingTeam) {
    return (
      <WireScreen>
        <ActivityIndicator color={Wireframe.panelBg} size="large" />
        <Text style={styles.loading}>Loading team from cloud…</Text>
      </WireScreen>
    );
  }

  if (!teamDocId) {
    return (
      <WireScreen>
        <Text style={styles.teamId}>No team yet</Text>
        <Text style={styles.sub}>Register or join a team from the onboarding flow.</Text>
      </WireScreen>
    );
  }

  return (
    <WireScreen>
      <View style={styles.header}>
        <Text style={styles.teamId}>
          {teamName} {teamId}
        </Text>
        <Text style={styles.sub}>Team members</Text>
      </View>
      {members.length === 0 ? (
        <Panel>
          <Text style={styles.memberName}>No members listed yet</Text>
        </Panel>
      ) : (
        members.map((m) => {
          const email = memberDisplayEmail(m, user?.uid, user?.email);
          return (
            <Panel key={m.id}>
              <Text style={styles.memberName}>{m.name}</Text>
              {email ? <Text style={styles.email}>{email}</Text> : null}
            </Panel>
          );
        })
      )}
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
  loading: {
    marginTop: 12,
    color: '#cfcfcf',
    textAlign: 'center',
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
