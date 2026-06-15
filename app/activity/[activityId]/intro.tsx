import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ScreenHeader } from "@/components/wireframe/BackNav";
import { Panel } from "@/components/wireframe/Panel";
import { PrimaryButton } from "@/components/wireframe/PrimaryButton";
import { WireScreen } from "@/components/wireframe/WireScreen";
import { isIndividualActivity } from "@/constants/activities";
import { useLocalizedActivity } from "@/constants/localized-activities";
import { DECIBEL_DESCRIPTION_SECTIONS } from "@/constants/decibel-description";
import { FAN_DESCRIPTION_SECTIONS } from "@/constants/fan-description";
import { PARACHUTE_DESCRIPTION_SECTIONS } from "@/constants/parachute-description";
import { PERFORMANCE_DESCRIPTION_SECTIONS } from "@/constants/performance-description";
import { BREATHING_DESCRIPTION_SECTIONS } from "@/constants/breathing-description";
import { REACTION_DESCRIPTION_SECTIONS } from "@/constants/reaction-description";
import { VIBRATION_DESCRIPTION_SECTIONS } from "@/constants/vibration-description";
import { Wireframe } from "@/constants/wireframe-theme";
import { useActivitySession } from "@/contexts/ActivitySessionContext";
import { useAppTheme } from "@/contexts/AppThemeContext";
import { useTeam } from "@/contexts/TeamContext";

export default function ActivityIntroScreen() {
  const router = useRouter();
  const { activityId } = useLocalSearchParams<{ activityId: string }>();
  const cfg = useLocalizedActivity(activityId ?? "");
  const { colors } = useAppTheme();
  const { members } = useTeam();
  const {
    getSession,
    isActivityCompleted,
    resetActivityForRedo,
    setActivityPerformer,
  } = useActivitySession();
  const [gear, setGear] = useState<Record<string, boolean>>({});
  const [showDescription, setShowDescription] = useState(false);
  const selectableMembers = useMemo(
    () => members.filter((member) => member.name.trim()),
    [members],
  );
  const individualActivity = cfg ? isIndividualActivity(cfg.id) : false;
  const selectedPerformer = cfg ? getSession(cfg.id).performer : null;

  useEffect(() => {
    if (!cfg || !isIndividualActivity(cfg.id)) return;
    if (getSession(cfg.id).performer) return;
    if (selectableMembers.length !== 1) return;

    const onlyMember = selectableMembers[0];
    setActivityPerformer(cfg.id, {
      memberId: onlyMember.id,
      name: onlyMember.name.trim(),
      uid: onlyMember.uid,
    });
  }, [cfg, getSession, selectableMembers, setActivityPerformer]);

  if (!cfg) {
    return (
      <WireScreen>
        <Text style={styles.err}>Activity not found.</Text>
        <PrimaryButton
          label="BACK TO HUB"
          onPress={() => router.replace("/(tabs)")}
        />
      </WireScreen>
    );
  }

  const activity = cfg;
  const gearState = cfg.gear.map((g) => ({
    label: g,
    checked: gear[g] ?? true,
  }));
  const completed = isActivityCompleted(cfg.id);
  const canStartActivity = !individualActivity || selectedPerformer != null;

  function handleRedoActivity() {
    resetActivityForRedo(activity.id);
    if (individualActivity) {
      if (!selectedPerformer) return;
      setActivityPerformer(activity.id, selectedPerformer);
    }
    router.push(`/activity/${activity.id}/prediction`);
  }

  function handleStartActivity() {
    if (!canStartActivity) return;
    router.push(`/activity/${activity.id}/prediction`);
  }

  return (
    <WireScreen
      footer={
        completed ? undefined : (
          <PrimaryButton
            label={individualActivity && !selectedPerformer ? "SELECT A MEMBER TO START" : "START ACTIVITY"}
            disabled={!canStartActivity}
            onPress={handleStartActivity}
          />
        )
      }
    >
      <ScreenHeader
        backLabel="BACK TO HUB"
        onBack={() => router.back()}
        title={cfg.title}
        subtitle={cfg.subtitle}
      />

      {individualActivity ? (
        <Panel title="Individual ranking">
          <Text style={[styles.panelHint, { color: colors.textMuted }]}>
            Select the team member who will perform this activity. Their saved
            result will appear on the individual leaderboard.
          </Text>
          {selectableMembers.length === 0 ? (
            <Text style={[styles.panelHint, { color: colors.textMuted }]}>
              Add team members on the Team tab before starting an individual-ranked activity.
            </Text>
          ) : (
            <View style={styles.memberGrid}>
              {selectableMembers.map((member) => {
                const selected = selectedPerformer?.memberId === member.id;
                return (
                  <Pressable
                    key={member.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() =>
                      setActivityPerformer(cfg.id, {
                        memberId: member.id,
                        name: member.name.trim(),
                        uid: member.uid,
                      })
                    }
                    style={[
                      styles.memberChoice,
                      {
                        backgroundColor: selected ? colors.accentSoft : colors.surfaceAlt,
                        borderColor: selected ? Wireframe.accent : colors.border,
                      },
                    ]}
                  >
                    <MaterialIcons
                      name={selected ? "radio-button-checked" : "radio-button-unchecked"}
                      size={18}
                      color={selected ? Wireframe.accent : colors.textMuted}
                    />
                    <Text style={[styles.memberChoiceText, { color: colors.text }]}>
                      {member.name.trim()}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </Panel>
      ) : null}

      {completed ? (
        <Panel>
          <View style={styles.completedHeader}>
            <View
              style={[
                styles.completedIcon,
                { backgroundColor: colors.accentSoft },
              ]}
            >
              <MaterialIcons
                name="check-circle"
                size={24}
                color={Wireframe.accent}
              />
            </View>
            <View style={styles.completedTextWrap}>
              <Text style={[styles.completedTitle, { color: colors.text }]}>
                Activity completed
              </Text>
              <Text style={[styles.completedCopy, { color: colors.textMuted }]}>
                View your saved dashboard results or start again with fresh
                predictions and measurements.
              </Text>
            </View>
          </View>
          <View style={styles.completedActions}>
            <PrimaryButton
              label="VIEW PREVIOUS RESULTS"
              onPress={() => router.push(`/activity/${cfg.id}/dashboard`)}
            />
            <PrimaryButton
              label="REDO ACTIVITY"
              variant="light"
              disabled={individualActivity && !selectedPerformer}
              onPress={handleRedoActivity}
            />
          </View>
        </Panel>
      ) : null}

      {cfg.id === "parachute-drop" ||
      cfg.id === "decibel-detector" ||
      cfg.id === "hand-fan-challenge" ||
      cfg.id === "vibration-analysis" ||
      cfg.id === "surface-smoothness" ||
      cfg.id === "reaction-time" ||
      cfg.id === "breathing-pattern" ? (
        <>
          <PrimaryButton
            label={showDescription ? "HIDE DESCRIPTION" : "SEE DESCRIPTION"}
            variant="light"
            onPress={() => setShowDescription((v) => !v)}
          />
          {showDescription ? (
            <Panel title="Activity description">
              {(cfg.id === "parachute-drop"
                ? PARACHUTE_DESCRIPTION_SECTIONS
                : cfg.id === "decibel-detector"
                  ? DECIBEL_DESCRIPTION_SECTIONS
                  : cfg.id === "hand-fan-challenge"
                    ? FAN_DESCRIPTION_SECTIONS
                    : cfg.id === "vibration-analysis"
                      ? VIBRATION_DESCRIPTION_SECTIONS
                      : cfg.id === "surface-smoothness"
                        ? PERFORMANCE_DESCRIPTION_SECTIONS
                        : cfg.id === "reaction-time"
                          ? REACTION_DESCRIPTION_SECTIONS
                          : BREATHING_DESCRIPTION_SECTIONS
              ).map((section) => (
                <View key={section.title} style={styles.descSection}>
                  <Text style={[styles.descHeading, { color: colors.text }]}>
                    {section.title}
                  </Text>
                  {section.body.map((line, i) => (
                    <Text key={i} style={[styles.howLine, { color: colors.text }]}>
                      {line}
                    </Text>
                  ))}
                </View>
              ))}
            </Panel>
          ) : null}
        </>
      ) : null}

      <Panel title="Gear Check">
        <Text style={[styles.panelHint, { color: colors.textMuted }]}>
          Make sure you have all the equipment before starting.
        </Text>
        {gearState.map((item) => (
          <Pressable
            key={item.label}
            style={styles.checkRow}
            onPress={() =>
              setGear((s) => ({ ...s, [item.label]: !item.checked }))
            }
          >
            <MaterialIcons
              name={item.checked ? "check-box" : "check-box-outline-blank"}
              size={22}
              color={colors.text}
            />
            <Text style={[styles.checkLabel, { color: colors.text }]}>{item.label}</Text>
          </Pressable>
        ))}
      </Panel>

      <Panel title="Safety Instructions">
        {cfg.safety.map((line, i) => (
          <View key={i} style={styles.safeRow}>
            <MaterialIcons
              name="notifications-active"
              size={18}
              color={colors.textMuted}
            />
            <Text style={[styles.safeText, { color: colors.text }]}>{line}</Text>
          </View>
        ))}
      </Panel>
    </WireScreen>
  );
}

const styles = StyleSheet.create({
  err: { color: Wireframe.panelBg, marginBottom: 16 },
  panelHint: {
    fontSize: 13,
    color: Wireframe.textMuted,
    marginBottom: 8,
  },
  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  checkLabel: { fontSize: 14, color: Wireframe.text },
  safeRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
    alignItems: "flex-start",
  },
  safeText: { flex: 1, fontSize: 13, color: Wireframe.text, lineHeight: 18 },
  howLine: { fontSize: 13, color: Wireframe.text, marginBottom: 6 },
  tableWrap: { marginTop: 8, borderWidth: 1, borderColor: Wireframe.border },
  tableRowHead: { flexDirection: "row", backgroundColor: "#f6f6f6" },
  tableCellHead: {
    flex: 1,
    padding: 8,
    fontWeight: "700",
    color: Wireframe.text,
  },
  tableRow: {
    flexDirection: "row",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Wireframe.border,
  },
  tableCell: { flex: 1, padding: 8, color: Wireframe.text },
  descSection: { marginBottom: 12 },
  descHeading: {
    fontSize: 14,
    fontWeight: "700",
    color: Wireframe.text,
    marginBottom: 4,
  },
  completedHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  completedIcon: {
    width: 44,
    height: 44,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Wireframe.accentSoft,
  },
  completedTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  completedTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: Wireframe.text,
  },
  completedCopy: {
    fontSize: 13,
    color: Wireframe.textMuted,
    lineHeight: 18,
    marginTop: 4,
  },
  completedActions: {
    gap: 8,
    marginTop: 14,
  },
  memberGrid: {
    gap: 8,
  },
  memberChoice: {
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  memberChoiceText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: Wireframe.text,
  },
});
