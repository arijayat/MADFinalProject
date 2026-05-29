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
              The app will not open the camera. Use your phone’s native camera
              app in slow motion to capture bend and recovery, or observe the
              motion directly.
            </Text>
            <Text style={styles.howLine}>
              1. Open your phone camera app and select slow‑motion mode if
              available.
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
              4. Play back the video in slow motion and pause at maximum bend to
              estimate the angle.
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
      {cfg.id === "surface-smoothness" ? (
        <>
          <Panel title="Discussion (plain language)">
            <Text style={styles.panelHint}>
              Muscles and joints work together to create movement. Faster
              movements often reduce control, while smoother movements show
              better coordination. Sensors in the phone measure how quickly and
              smoothly the body moves, helping students understand biomechanics
              and fatigue.
            </Text>
            <Text style={styles.howLine}>
              Curriculum links: ACPPS051 (Movement skills) · ACPPS054 (Physical
              performance) · ACSSU176 (Structure and function of body systems)
            </Text>
          </Panel>

          <Panel title="How to use phone sensors">
            <Text style={styles.panelHint}>
              The app uses your phone accelerometer as a vibration sensor and
              can provide haptic (buzz) feedback when movement is not smooth—no
              extra equipment needed.
            </Text>
            <Text style={styles.howLine}>
              1. Hold the phone firmly in one hand and unlock the vibration
              sensor in the capture screen.
            </Text>
            <Text style={styles.howLine}>
              2. Perform each guided movement slowly while the app records peak
              vibration (m/s²) and time.
            </Text>
            <Text style={styles.howLine}>
              3. After all three movements, the app will prompt Attempt 2 —
              repeat each movement while the phone buzzes when motion is not
              smooth.
            </Text>
            <Text style={styles.howLine}>
              4. Review speed, smoothness, and compare results to your
              predictions on the dashboard.
            </Text>
          </Panel>

          <Panel title="Human Performance Lab — Instructions">
            <Text style={styles.panelHint}>
              Students investigate how the human body moves by measuring speed,
              smoothness, and coordination during controlled stretching
              activities.
            </Text>
            <Text style={styles.howLine}>Steps:</Text>
            <Text style={styles.howLine}>
              • Movement 1: Rotate your hand in a circle, then in a figure-8,
              while holding the phone.
            </Text>
            <Text style={styles.howLine}>
              • Movement 2: Move your arm up and down steadily.
            </Text>
            <Text style={styles.howLine}>
              • Movement 3: Move your arm side to side steadily.
            </Text>
            <Text style={styles.howLine}>
              • Upload results and reflect: Which movement was hardest to keep
              vibration low? Were you right? Any surprises?
            </Text>

            <View style={styles.tableWrap}>
              <View style={styles.tableRowHead}>
                <Text style={styles.tableCellHead}>Attempt</Text>
                <Text style={styles.tableCellHead}>Predict vibration</Text>
                <Text style={styles.tableCellHead}>Outcome (time + movement)</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.tableCell}>Attempt 1</Text>
                <Text style={styles.tableCell}>e.g. ±1 cm</Text>
                <Text style={styles.tableCell}>(from app)</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.tableCell}>Attempt 2</Text>
                <Text style={styles.tableCell}>(your prediction)</Text>
                <Text style={styles.tableCell}>e.g. 5 mm in 20 s</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.tableCell}>Attempt 3</Text>
                <Text style={styles.tableCell}>(your prediction)</Text>
                <Text style={styles.tableCell}>e.g. 5 mm in 5 s</Text>
              </View>
            </View>
          </Panel>
        </>
      ) : null}
      {cfg.id === "vibration-analysis" ? (
        <>
          <Panel title="Discussion">
            <Text style={styles.panelHint}>
              Earthquakes cause ground vibrations that can collapse poorly
              designed structures. Engineers design buildings to absorb and
              distribute energy safely.
            </Text>
            <Text style={styles.howLine}>
              Curriculum links: ACSSU096 (Earth processes) · ACTDEP036 (Testing
              and improving designs)
            </Text>
          </Panel>

          <Panel title="How to use phone sensors">
            <Text style={styles.panelHint}>
              The app uses your phone accelerometer as a level tool and
              vibration sensor—no extra equipment needed.
            </Text>
            <Text style={styles.howLine}>
              1. Level check: place the phone screen-up on your platform. The
              green dot means the surface is stable enough to test.
            </Text>
            <Text style={styles.howLine}>
              2. Vibration mode: tap START, then gently shake the table to
              simulate an earthquake while the app records peak tilt (°) and
              vibration (m/s²).
            </Text>
            <Text style={styles.howLine}>
              3. Repeat for each design and compare which structure dampens
              movement best.
            </Text>
          </Panel>

          <Panel title="Earthquake-Resistant Structure — Instructions">
            <Text style={styles.panelHint}>
              Design and test structures that dampen vibrations, simulating an
              earthquake.
            </Text>
            <Text style={styles.howLine}>Steps:</Text>
            <Text style={styles.howLine}>
              • Build an anti-vibration layer by folding paper or cardboard into
              a zig-zag (accordion) shape.
            </Text>
            <Text style={styles.howLine}>
              • Create a platform: place cups as pillars, lay the folded paper
              across them, then add flat cardboard on top.
            </Text>
            <Text style={styles.howLine}>
              • Place the phone screen-up in the center of the platform and run
              the level check in the app.
            </Text>
            <Text style={styles.howLine}>
              • Shake the table gently and record results. Change folds or
              pillars and test again.
            </Text>

            <View style={styles.tableWrap}>
              <View style={styles.tableRowHead}>
                <Text style={styles.tableCellHead}>Design</Text>
                <Text style={styles.tableCellHead}>Phone moves</Text>
                <Text style={styles.tableCellHead}>Outcome (°)</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.tableCell}>Design 1: 4 folds + 4 pillars</Text>
                <Text style={styles.tableCell}>(from app)</Text>
                <Text style={styles.tableCell}>(peak tilt °)</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.tableCell}>Design 2: 10 folds + 4 pillars</Text>
                <Text style={styles.tableCell}>(from app)</Text>
                <Text style={styles.tableCell}>(peak tilt °)</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.tableCell}>Design 3: your design</Text>
                <Text style={styles.tableCell}>(from app)</Text>
                <Text style={styles.tableCell}>(peak tilt °)</Text>
              </View>
            </View>

            <Text style={styles.panelHint}>
              Write-up: Predict which design will move the least. Record results,
              compare to predictions, and note any surprises.
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
