import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { ScreenHeader } from '@/components/wireframe/BackNav';
import { PrimaryButton } from '@/components/wireframe/PrimaryButton';
import { Panel } from '@/components/wireframe/Panel';
import { WireScreen } from '@/components/wireframe/WireScreen';
import { getActivity } from '@/constants/activities';
import { Wireframe } from '@/constants/wireframe-theme';

export default function ActivityReflectionScreen() {
  const router = useRouter();
  const { activityId } = useLocalSearchParams<{ activityId: string }>();
  const cfg = activityId ? getActivity(activityId) : undefined;
  const [stars, setStars] = useState(0);
  const [insights, setInsights] = useState('');

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
        <PrimaryButton label="SAVE & CONTINUE" onPress={() => router.push(`/activity/${cfg.id}/leaderboard`)} />
      }>
      <ScreenHeader
        backLabel="BACK"
        onBack={() => router.back()}
        title="Reflection & Upload"
        subtitle="Document your findings and thoughts."
      />
      <Panel>
        <Text style={styles.q}>How much did you enjoy this activity?</Text>
        <View style={styles.stars}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Pressable key={n} onPress={() => setStars(n)} hitSlop={6}>
              <MaterialIcons
                name={n <= stars ? 'star' : 'star-border'}
                size={32}
                color={Wireframe.text}
              />
            </Pressable>
          ))}
        </View>
        <Text style={[styles.q, { marginTop: 16 }]}>Any surprises or insights?</Text>
        <TextInput
          style={styles.area}
          multiline
          placeholder="What did you learn? Were the results what you expected? ..."
          placeholderTextColor={Wireframe.placeholder}
          value={insights}
          onChangeText={setInsights}
        />
        <View style={styles.note}>
          <MaterialIcons name="info-outline" size={18} color={Wireframe.textMuted} />
          <Text style={styles.noteText}>Video and data will be saved to the cloud.</Text>
        </View>
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
});
