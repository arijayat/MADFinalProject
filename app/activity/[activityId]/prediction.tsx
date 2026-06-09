import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ScreenHeader } from '@/components/wireframe/BackNav';
import { FieldBlock } from '@/components/wireframe/FormFields';
import { PrimaryButton } from '@/components/wireframe/PrimaryButton';
import { Panel } from '@/components/wireframe/Panel';
import { WireScreen } from '@/components/wireframe/WireScreen';
import { useLocalizedActivity } from '@/constants/localized-activities';
import { Wireframe } from '@/constants/wireframe-theme';
import { useAppTheme } from '@/contexts/AppThemeContext';
import { isActivityId } from '@/lib/activity-snapshot';
import { useActivitySession } from '@/contexts/ActivitySessionContext';

export default function ActivityPredictionScreen() {
  const router = useRouter();
  const { activityId } = useLocalSearchParams<{ activityId: string }>();
  const cfg = useLocalizedActivity(activityId ?? "");
  const { colors } = useAppTheme();
  const { getSession, setPredictions } = useActivitySession();
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!activityId || !isActivityId(activityId)) return;
    const saved = getSession(activityId).predictions;
    if (Object.keys(saved).length === 0) return;
    setValues((prev) => (Object.keys(prev).length === 0 ? saved : prev));
  }, [activityId, getSession]);

  const complete = useMemo(() => {
    if (!cfg) return false;
    return cfg.predictionFields.every((f) => (values[f.key] ?? '').trim().length > 0);
  }, [cfg, values]);

  if (!cfg) {
    return (
      <WireScreen>
        <Text style={styles.err}>Activity not found.</Text>
      </WireScreen>
    );
  }

  return (
    <WireScreen
      footer={
        <PrimaryButton
          label="UNLOCK SENSOR"
          disabled={!complete}
          onPress={() => {
            setPredictions(cfg.id, values);
            router.push(`/activity/${cfg.id}/capture`);
          }}
        />
      }>
      <ScreenHeader
        backLabel="BACK"
        onBack={() => router.back()}
        title="Prediction & Input"
        subtitle="Enter your hypothesis and experimental variables."
      />

      <View
        style={[
          styles.callout,
          {
            backgroundColor: colors.panelBg,
            borderColor: colors.border,
          },
        ]}>
        <MaterialIcons name="notifications" size={18} color={colors.text} />
        <Text style={[styles.calloutText, { color: colors.text }]}>
          Scientific Method: Before collecting data, make a prediction based on your understanding of the
          science involved.
        </Text>
      </View>

      {cfg.id === "parachute-drop" ? (
        <Panel title="What you are predicting">
          <Text style={[styles.hint, { color: colors.text }]}>
            For each drop (baseline, plastic parachute, then your best design), guess how many seconds
            pass until the toy first touches the ground. A parachute should usually increase fall time
            compared with no parachute.
          </Text>
          <Text style={[styles.hint, { color: colors.text }]}>
            Also predict whether the toy will bounce after Action 3 — that choice is compared with what
            you observe when reviewing the landing video. Drop height and mass are not guesses; they are
            measurements used later to calculate speed, drag, and g-force.
          </Text>
        </Panel>
      ) : null}

      {cfg.id === "hand-fan-challenge" ? (
        <Panel title="What you are predicting">
          <Text style={[styles.hint, { color: colors.text }]}>
            Describe the fan design you think will move the paper the most, then
            guess the largest bend angle (in degrees) you expect to see when you
            review slow-motion video at 15 cm, 30 cm, and 45 cm.
          </Text>
          <Text style={[styles.hint, { color: colors.text }]}>
            Choose the vertical strip material — it sets stiffness k for the force
            estimate F ≈ k × θ on the results page. Distance (cm) is a note for your
            main trial setup; you will still record all three distances in capture.
          </Text>
        </Panel>
      ) : null}

      {cfg.id === "surface-smoothness" ? (
        <Panel title="What you are predicting">
          <Text style={[styles.hint, { color: colors.text }]}>
            For each movement, guess how shaky it will feel (low / medium / high
            or an approximate m/s²) during Attempt 1 — slow moves with no buzz.
          </Text>
          <Text style={[styles.hint, { color: colors.text }]}>
            Pick which movement will be hardest to keep vibration low. Also
            predict Attempt 1 overall smoothness (e.g. ±1 cm), then predict
            Attempt 2 outcomes for Movement 1 and 2 when buzz feedback is on
            (peak vibration + time, e.g. 5 mm in 20 s).
          </Text>
        </Panel>
      ) : null}

      {cfg.id === "vibration-analysis" ? (
        <Panel title="What you are predicting">
          <Text style={[styles.hint, { color: colors.text }]}>
            For each structure, guess the peak tilt (in degrees) when you gently
            shake the table — how far the platform tilts from level. Lower tilt
            means less movement and a more earthquake-resistant design.
          </Text>
          <Text style={[styles.hint, { color: colors.text }]}>
            Also pick which design (1, 2, or your own Design 3) you think will
            move the least overall. After testing, the app compares your degree
            guesses and your “moves least” choice to measured tilt and vibration.
          </Text>
        </Panel>
      ) : null}

      {cfg.id === "breathing-pattern" ? (
        <Panel title="What you are predicting">
          <Text style={[styles.hint, { color: colors.text }]}>
            Guess breaths per minute (BPM) at rest, then immediately after
            Exercise 1 and Exercise 2 (light jog or star jumps, then lie down and
            record on your chest).
          </Text>
          <Text style={[styles.hint, { color: colors.text }]}>
            Note what each exercise will be. Also predict whether your BPM will
            be higher after exercise than at rest — the dashboard compares your
            numbers to the sensor recording.
          </Text>
        </Panel>
      ) : null}

      {cfg.id === "reaction-time" ? (
        <Panel title="What you are predicting">
          <Text style={[styles.hint, { color: colors.text }]}>
            Phase 1 & 2: guess your average tap reaction time in milliseconds (ms) —
            how fast you tap after the color changes, for dominant hand then your other hand.
          </Text>
          <Text style={[styles.hint, { color: colors.text }]}>
            Say whether your dominant hand will be faster. Phase 3: for each tracing
            attempt, predict accuracy (%) and average delay (ms) while following the
            moving shape.
          </Text>
        </Panel>
      ) : null}

      {cfg.id === "decibel-detector" ? (
        <Panel title="What you are predicting">
          <Text style={[styles.hint, { color: colors.text }]}>
            You are not guessing decibel numbers yet — you are ranking how loud each action will be
            compared with a reference:
          </Text>
          <Text style={[styles.hint, { color: colors.text }]}>
            • Action 1 (e.g. drop a book): louder, softer, or about the same as a quiet room (~45 dB).
          </Text>
          <Text style={styles.hint}>
            • Action 2 (e.g. talking): louder, softer, or about the same than Action 1’s sound.
          </Text>
          <Text style={styles.hint}>
            • Action 3 (e.g. stamping): louder, softer, or about the same than Action 2’s sound.
          </Text>
          <Text style={styles.hint}>
            After measuring, the dashboard compares your choices to the recorded peaks and shows hearing
            risk from the sound-level table.
          </Text>
        </Panel>
      ) : null}

      <Panel>
        {cfg.id === 'reaction-time' ? (
          <>
            {cfg.predictionFields
              .filter((f) => !f.key.startsWith('trace'))
              .map((f) => (
                <FieldBlock
                  key={f.key}
                  field={f}
                  value={values[f.key] ?? ''}
                  onChange={(v) => setValues((s) => ({ ...s, [f.key]: v }))}
                />
              ))}
            {([1, 2, 3] as const).map((traceNum) => (
              <View key={traceNum} style={styles.traceGroup}>
                <Text style={[styles.traceHeading, { color: colors.text }]}>
                  Phase 3 — Trace {traceNum}
                </Text>
                {cfg.predictionFields
                  .filter((f) => f.key.startsWith(`trace${traceNum}_`))
                  .map((f) => (
                    <FieldBlock
                      key={f.key}
                      field={{
                        ...f,
                        label: f.label.replace(/^Phase 3 — Trace \d+: /, ''),
                      }}
                      value={values[f.key] ?? ''}
                      onChange={(v) => setValues((s) => ({ ...s, [f.key]: v }))}
                    />
                  ))}
              </View>
            ))}
          </>
        ) : (
          cfg.predictionFields.map((f) => (
            <FieldBlock
              key={f.key}
              field={f}
              value={values[f.key] ?? ''}
              onChange={(v) => setValues((s) => ({ ...s, [f.key]: v }))}
            />
          ))
        )}
        <View style={styles.warnRow}>
          <MaterialIcons name="warning" size={18} color={Wireframe.accentYellow} />
          <Text style={[styles.warn, { color: colors.textMuted }]}>
            You must complete all predictions before the sensor unlocks.
          </Text>
        </View>
      </Panel>
    </WireScreen>
  );
}

const styles = StyleSheet.create({
  err: { color: Wireframe.panelBg },
  callout: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: Wireframe.panelBg,
    borderWidth: 1,
    borderColor: Wireframe.border,
    padding: 10,
    borderRadius: 4,
  },
  calloutText: { flex: 1, fontSize: 12, color: Wireframe.text, lineHeight: 17 },
  warnRow: { flexDirection: 'row', gap: 8, marginTop: 8, alignItems: 'center' },
  warn: { flex: 1, fontSize: 12, color: Wireframe.textMuted },
  hint: {
    fontSize: 13,
    color: Wireframe.text,
    lineHeight: 19,
    marginBottom: 8,
  },
  traceGroup: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Wireframe.border,
  },
  traceHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: Wireframe.text,
    marginBottom: 8,
  },
});
