import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ScreenHeader } from "@/components/wireframe/BackNav";
import { Panel } from "@/components/wireframe/Panel";
import { PrimaryButton } from "@/components/wireframe/PrimaryButton";
import { WireScreen } from "@/components/wireframe/WireScreen";
import { getActivity } from "@/constants/activities";
import { DECIBEL_DESCRIPTION_SECTIONS } from "@/constants/decibel-description";
import { FAN_DESCRIPTION_SECTIONS } from "@/constants/fan-description";
import { PARACHUTE_DESCRIPTION_SECTIONS } from "@/constants/parachute-description";
import { PERFORMANCE_DESCRIPTION_SECTIONS } from "@/constants/performance-description";
import { BREATHING_DESCRIPTION_SECTIONS } from "@/constants/breathing-description";
import { REACTION_DESCRIPTION_SECTIONS } from "@/constants/reaction-description";
import { VIBRATION_DESCRIPTION_SECTIONS } from "@/constants/vibration-description";
import { Wireframe } from "@/constants/wireframe-theme";
import { useAppTheme } from "@/contexts/AppThemeContext";

export default function ActivityIntroScreen() {
  const router = useRouter();
  const { activityId } = useLocalSearchParams<{ activityId: string }>();
  const cfg = activityId ? getActivity(activityId) : undefined;
  const { colors } = useAppTheme();
  const [gear, setGear] = useState<Record<string, boolean>>({});
  const [showDescription, setShowDescription] = useState(false);

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

  const gearState = cfg.gear.map((g) => ({
    label: g,
    checked: gear[g] ?? true,
  }));

  return (
    <WireScreen
      footer={
        <PrimaryButton
          label="START ACTIVITY"
          onPress={() => router.push(`/activity/${cfg.id}/prediction`)}
        />
      }
    >
      <ScreenHeader
        backLabel="BACK TO HUB"
        onBack={() => router.replace("/(tabs)")}
        title={cfg.title}
        subtitle={cfg.subtitle}
      />

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
});
