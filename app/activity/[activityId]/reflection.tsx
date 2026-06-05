import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { ScreenHeader } from '@/components/wireframe/BackNav';
import { PrimaryButton } from '@/components/wireframe/PrimaryButton';
import { Panel } from '@/components/wireframe/Panel';
import { WireScreen } from '@/components/wireframe/WireScreen';
import { getActivity } from '@/constants/activities';
import { Wireframe } from '@/constants/wireframe-theme';
import { useAppTheme } from '@/contexts/AppThemeContext';
import { useActivitySession } from '@/contexts/ActivitySessionContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTeam } from '@/contexts/TeamContext';
import { isActivityId, toActivitySessionSnapshot } from '@/lib/activity-snapshot';
import { deleteActivityDraft } from '@/lib/db/activity-drafts';
import { saveActivityResult } from '@/lib/firestore/results';

export default function ActivityReflectionScreen() {
  const router = useRouter();
  const { activityId } = useLocalSearchParams<{ activityId: string }>();
  const { user } = useAuth();
  const { teamDocId } = useTeam();
  const { getSession } = useActivitySession();
  const { colors } = useAppTheme();
  const [stars, setStars] = useState(0);
  const [insights, setInsights] = useState('');
  const [saving, setSaving] = useState(false);

  const cfg = activityId ? getActivity(activityId) : undefined;

  async function handleSave() {
    if (!cfg || !activityId || !isActivityId(activityId)) return;

    if (!user) {
      Alert.alert('Not signed in', 'Log in to save results to the cloud.');
      return;
    }
    if (!teamDocId) {
      Alert.alert('No team', 'Register or join a team before saving activity results.');
      return;
    }

    setSaving(true);
    try {
      const session = getSession(activityId);
      await saveActivityResult({
        teamId: teamDocId,
        activityId,
        savedByUid: user.uid,
        session: toActivitySessionSnapshot(session),
        reflection: {
          stars,
          insights: insights.trim(),
        },
      });
      await deleteActivityDraft(teamDocId, activityId);
      router.push(`/activity/${cfg.id}/leaderboard`);
    } catch (error) {
      Alert.alert(
        'Save failed',
        error instanceof Error
          ? error.message
          : 'Could not save to Firestore. Check rules and your connection.',
      );
    } finally {
      setSaving(false);
    }
  }

  if (!cfg) {
    return (
      <WireScreen>
        <Text style={{ color: Wireframe.panelBg }}>Activity not found.</Text>
      </WireScreen>
    );
  }

  return (
    <WireScreen
      footer={
        <PrimaryButton
          label={saving ? 'SAVING…' : 'SAVE & CONTINUE'}
          disabled={saving}
          onPress={handleSave}
        />
      }>
      <ScreenHeader
        backLabel="BACK"
        onBack={() => router.back()}
        title="Reflection & Upload"
        subtitle="Document your findings and thoughts."
      />
      <Panel>
        <Text style={[styles.q, { color: colors.text }]}>
          How much did you enjoy this activity?
        </Text>
        <View style={styles.stars}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Pressable key={n} onPress={() => setStars(n)} hitSlop={6} disabled={saving}>
              <MaterialIcons
                name={n <= stars ? 'star' : 'star-border'}
                size={32}
                color={colors.text}
              />
            </Pressable>
          ))}
        </View>
        <Text style={[styles.q, { color: colors.text, marginTop: 16 }]}>
          Any surprises or insights?
        </Text>
        <TextInput
          style={[
            styles.area,
            {
              color: colors.text,
              backgroundColor: colors.surfaceAlt,
              borderColor: colors.border,
            },
          ]}
          multiline
          placeholder="What did you learn? Were the results what you expected? ..."
          placeholderTextColor={Wireframe.placeholder}
          value={insights}
          onChangeText={setInsights}
          editable={!saving}
        />
        <View style={styles.note}>
          <MaterialIcons name="cloud-upload" size={18} color={colors.textMuted} />
          <Text style={[styles.noteText, { color: colors.textMuted }]}>
            Activity data is saved to Firebase. Your local SQLite draft is cleared after a successful save.
          </Text>
        </View>
        {saving ? <ActivityIndicator style={styles.spinner} color={colors.text} /> : null}
      </Panel>
    </WireScreen>
  );
}

const styles = StyleSheet.create({
  q: { fontSize: 14, fontWeight: '700', color: Wireframe.text, marginBottom: 8 },
  stars: { flexDirection: 'row', gap: 8 },
  area: {
    minHeight: 120,
    borderWidth: 1,
    borderColor: Wireframe.border,
    padding: 10,
    fontSize: 14,
    color: Wireframe.text,
    textAlignVertical: 'top',
  },
  note: { flexDirection: 'row', gap: 8, marginTop: 12, alignItems: 'center' },
  noteText: { flex: 1, fontSize: 12, color: Wireframe.textMuted },
  spinner: { marginTop: 16 },
});
