import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ScreenHeader } from "@/components/wireframe/BackNav";
import { Panel } from "@/components/wireframe/Panel";
import { PrimaryButton } from "@/components/wireframe/PrimaryButton";
import { WireScreen } from "@/components/wireframe/WireScreen";
import { getActivity } from "@/constants/activities";
import { Wireframe } from "@/constants/wireframe-theme";

export default function ActivityIntroScreen() {
  const router = useRouter();
  const { activityId } = useLocalSearchParams<{ activityId: string }>();
  const cfg = activityId ? getActivity(activityId) : undefined;
  const [gear, setGear] = useState<Record<string, boolean>>({});

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

      <Panel title="Gear Check">
        <Text style={styles.panelHint}>
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
              color={Wireframe.text}
            />
            <Text style={styles.checkLabel}>{item.label}</Text>
          </Pressable>
        ))}
      </Panel>

      <Panel title="Safety Instructions">
        {cfg.safety.map((line, i) => (
          <View key={i} style={styles.safeRow}>
            <MaterialIcons
              name="notifications-active"
              size={18}
              color={Wireframe.textMuted}
            />
            <Text style={styles.safeText}>{line}</Text>
          </View>
        ))}
      </Panel>
      {cfg.id === "hand-fan-challenge" ? (
        <>
          <Panel title="How to record (phone camera)">
            <Text style={styles.panelHint}>
              Use your phone camera in slow‑motion to capture bend and recovery.
              Position the phone so the paper edge is visible from the side and
              the fan is perpendicular to the sheet.
            </Text>
            <Text style={styles.howLine}>
              1. Set your camera to slow‑motion (Slo‑mo on iOS; high‑fps mode on
              Android).
            </Text>
            <Text style={styles.howLine}>
              2. Mount or tape the phone on a stable surface at the same height
              as the paper edge.
            </Text>
            <Text style={styles.howLine}>
              3. Record each trial from the side at 15cm, 30cm, and 45cm
              distances.
            </Text>
            <Text style={styles.howLine}>
              4. After recording, play back in slow‑mo and pause at maximum bend
              to estimate angle.
            </Text>
            <Text style={styles.howLine}>
              Tip: use a protractor app or mark a reference line on the
              background for angle estimation.
            </Text>
          </Panel>

          <Panel title="Hand Fan Challenge — Instructions">
            <Text style={styles.panelHint}>
              Build 2–3 fan designs and test how they move paper or cardboard
              samples. Record observations and estimate bend angles.
            </Text>
            <Text style={styles.howLine}>Steps:</Text>
            <Text style={styles.howLine}>
              • Stand a sheet of paper upright on a table.
            </Text>
            <Text style={styles.howLine}>
              • Fan air from 15 cm, 30 cm, then 45 cm for each design.
            </Text>
            <Text style={styles.howLine}>
              • Repeat with stiffer cardboard and compare bend angles.
            </Text>
            <Text style={styles.howLine}>
              • Record results in the table below and answer the write‑up
              questions.
            </Text>

            <View style={styles.tableWrap}>
              <View style={styles.tableRowHead}>
                <Text style={styles.tableCellHead}>Design</Text>
                <Text style={styles.tableCellHead}>Bend (°)</Text>
                <Text style={styles.tableCellHead}>Outcome</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.tableCell}>Design 1</Text>
                <Text style={styles.tableCell}>30°</Text>
                <Text style={styles.tableCell}>(record observations)</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.tableCell}>Design 2</Text>
                <Text style={styles.tableCell}>(e.g. no folds)</Text>
                <Text style={styles.tableCell}>(record observations)</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.tableCell}>Design 3</Text>
                <Text style={styles.tableCell}>(your design)</Text>
                <Text style={styles.tableCell}>(record observations)</Text>
              </View>
            </View>

            <Text style={styles.panelHint}>
              Write‑up: Predict which fan makes the paper move the most. How
              does material stiffness affect bend? How does distance change
              bending?
            </Text>
          </Panel>
        </>
      ) : null}
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
});
