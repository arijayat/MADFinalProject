import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { ScreenHeader } from "@/components/wireframe/BackNav";
import { Panel } from "@/components/wireframe/Panel";
import { PrimaryButton } from "@/components/wireframe/PrimaryButton";
import { WireScreen } from "@/components/wireframe/WireScreen";
import { getActivity } from "@/constants/activities";
import { Wireframe } from "@/constants/wireframe-theme";
import {
    useActivitySession,
    type BounceObservation,
} from "@/contexts/ActivitySessionContext";
import {
    computeFallPhysics,
    computeGForceBounce,
    computeGForceNoBounce,
    formatPhysics,
} from "@/utils/parachute-physics";

const PL_PRED = "123";
const PL_ACT = "127";

type DashboardRow = {
  variable: string;
  predicted: string;
  actual: string;
};

export default function ActivityDashboardScreen() {
  const router = useRouter();
  const { activityId } = useLocalSearchParams<{ activityId: string }>();
  const cfg = activityId ? getActivity(activityId) : undefined;
  const { getSession } = useActivitySession();

  const rows = useMemo((): DashboardRow[] => {
    if (!cfg) return [];
    const session = getSession(cfg.id);

    if (cfg.id === "surface-smoothness" && cfg.movementActions) {
      const predKeys = ["move1_pred", "move2_pred", "move3_pred"];
      const attempt1 = session.performanceReadings.filter((r) => r.attempt === 1);
      const attempt2 = session.performanceReadings.filter((r) => r.attempt === 2);

      const fmt = (r: (typeof attempt1)[0] | undefined) =>
        r != null
          ? `${r.peakVibrationMs2.toFixed(2)} m/s² · ${r.durationS}s`
          : "—";

      const moveRows: DashboardRow[] = cfg.movementActions.map((label, i) => ({
        variable: label,
        predicted: session.predictions[predKeys[i]] ?? "—",
        actual:
          attempt1[i] != null && attempt2[i] != null
            ? `A1: ${fmt(attempt1[i])} · A2: ${fmt(attempt2[i])}`
            : attempt1[i] != null
              ? `A1: ${fmt(attempt1[i])}`
              : attempt2[i] != null
                ? `A2: ${fmt(attempt2[i])}`
                : "—",
      }));
      moveRows.push({
        variable: "Hardest to keep vibration low (prediction)",
        predicted: session.predictions.hardest_move ?? "—",
        actual:
          attempt1.length > 0
            ? (() => {
                const roughest = attempt1.reduce((a, b) =>
                  b.peakVibrationMs2 > a.peakVibrationMs2 ? b : a,
                );
                return roughest.label.split(":")[0] ?? roughest.label;
              })()
            : "—",
      });
      const attemptKeys = [
        "attempt1_pred",
        "attempt2_pred",
        "attempt3_pred",
      ];
      const attemptLabels = [
        "Attempt 1 smoothness (all movements, no buzz)",
        "Attempt 2 (time + movement, with buzz)",
        "Attempt 3 (time + movement, with buzz)",
      ];
      const attemptActuals = [
        attempt1.length > 0
          ? `Avg ${(attempt1.reduce((s, r) => s + r.peakVibrationMs2, 0) / attempt1.length).toFixed(2)} m/s²`
          : "—",
        attempt2[0] != null ? fmt(attempt2[0]) : "—",
        attempt2[1] != null ? fmt(attempt2[1]) : attempt2[2] != null ? fmt(attempt2[2]) : "—",
      ];
      attemptLabels.forEach((label, i) => {
        moveRows.push({
          variable: label,
          predicted: session.predictions[attemptKeys[i]] ?? "—",
          actual: attemptActuals[i],
        });
      });
      return moveRows;
    }

    if (cfg.id === "vibration-analysis" && cfg.vibrationDesignActions) {
      const predKeys = ["design1_pred", "design2_pred", "design3_pred"];
      const designRows: DashboardRow[] = cfg.vibrationDesignActions.map(
        (label, i) => ({
          variable: label,
          predicted: session.predictions[predKeys[i]] ?? "—",
          actual:
            session.vibrationReadings[i] != null
              ? `${session.vibrationReadings[i].peakTiltDeg.toFixed(1)}° tilt · ${session.vibrationReadings[i].peakVibrationMs2.toFixed(2)} m/s²`
              : "—",
        }),
      );
      designRows.push({
        variable: "Most stable design (prediction)",
        predicted: session.predictions.mostStable ?? "—",
        actual:
          session.vibrationReadings.length > 0
            ? (() => {
                const steadiest = session.vibrationReadings.reduce((a, b) =>
                  b.peakTiltDeg < a.peakTiltDeg ? b : a,
                );
                return steadiest.label.split(":")[0] ?? steadiest.label;
              })()
            : "—",
      });
      return designRows;
    }

    if (cfg.captureKind === "decibel" && cfg.decibelActions) {
      const actionRows: DashboardRow[] = cfg.decibelActions.map((label, i) => ({
        variable: label,
        predicted: session.predictions[`action${i + 1}_pred`] ?? "—",
        actual:
          session.decibelReadings[i] != null
            ? `${session.decibelReadings[i].peakDb}`
            : "—",
      }));
      actionRows.push({
        variable: "Location / zone",
        predicted: session.predictions.location ?? "—",
        actual: "—",
      });
      return actionRows;
    }

    if (cfg.id === "parachute-drop" && cfg.parachuteDropActions) {
      const rows: DashboardRow[] = [
        {
          variable: "Drop height (m)",
          predicted: session.predictions.dropHeight ?? "—",
          actual: session.predictions.dropHeight ?? "—",
        },
        {
          variable: "Mass of toy (g)",
          predicted: session.predictions.mass ?? "—",
          actual: session.predictions.mass ?? "—",
        },
      ];
      const predKeys = ["action1_pred", "action2_pred", "action3_pred"];
      cfg.parachuteDropActions.forEach((label, i) => {
        const reading = session.parachuteReadings[i];
        rows.push({
          variable: label,
          predicted: session.predictions[predKeys[i]] ?? "—",
          actual: reading != null ? `${reading.fallTimeS} s` : "—",
        });
      });
      const bounceActual =
        session.bounceActual ??
        session.parachuteReadings[2]?.observedBounce ??
        null;
      rows.push({
        variable: "Bounce on landing?",
        predicted: session.predictions.bounce ?? "—",
        actual: bounceActual ?? "—",
      });
      return rows;
    }

    return cfg.dashboardVariables.map((v) => ({
      variable: v,
      predicted: PL_PRED,
      actual: PL_ACT,
    }));
  }, [cfg, getSession]);

  const session = cfg ? getSession(cfg.id) : null;
  const parachutePhysics = useMemo(() => {
    if (!cfg || cfg.id !== "parachute-drop" || !session) return null;
    const height = parseFloat(session.predictions.dropHeight ?? "");
    const mass = parseFloat(session.predictions.mass ?? "");
    const readings = session.parachuteReadings;
    if (
      !Number.isFinite(height) ||
      !Number.isFinite(mass) ||
      readings.length === 0
    )
      return null;

    return readings.map((r, i) => {
      const fall = computeFallPhysics(height, r.fallTimeS, mass);
      const observedBounce: BounceObservation | null =
        r.observedBounce ??
        (i === readings.length - 1 ? session.bounceActual : null);
      const didBounce = observedBounce === "Bounce";
      let gForce: number | null = null;
      if (fall && r.contactTimeS != null && r.contactTimeS > 0) {
        if (didBounce && r.reboundTimeS != null && r.reboundTimeS > 0) {
          gForce = computeGForceBounce(
            fall.finalVelocityMs,
            r.contactTimeS,
            r.reboundTimeS,
          );
        } else if (!didBounce) {
          gForce = computeGForceNoBounce(fall.finalVelocityMs, r.contactTimeS);
        }
      }
      return { label: r.label, fall, gForce, didBounce };
    });
  }, [cfg, session]);

  const tableWidth =
    cfg?.captureKind === "decibel" ||
    cfg?.id === "parachute-drop" ||
    cfg?.id === "vibration-analysis" ||
    cfg?.id === "surface-smoothness"
      ? 280 + 110 + 110
      : 240 + 100 + 100;

  if (!cfg) {
    return (
      <WireScreen>
        <Text style={{ color: Wireframe.panelBg }}>Activity not found.</Text>
      </WireScreen>
    );
  }

  const wideTable =
    cfg.captureKind === "decibel" ||
    cfg.id === "parachute-drop" ||
    cfg.id === "vibration-analysis" ||
    cfg.id === "surface-smoothness";
  const cVariable = wideTable ? styles.cVariableWide : styles.cVariable;
  const cValue = wideTable ? styles.cValueWide : styles.cValue;
  const actualHeader =
    cfg.id === "parachute-drop"
      ? "Actual"
      : cfg.captureKind === "decibel"
        ? "Actual (dB)"
        : cfg.id === "vibration-analysis" || cfg.id === "surface-smoothness"
          ? "Actual (sensor)"
          : "Actual";

  return (
    <WireScreen
      footer={
        <PrimaryButton
          label="CONTINUE TO REFLECTION"
          onPress={() => router.push(`/activity/${cfg.id}/reflection`)}
        />
      }
    >
      <ScreenHeader
        backLabel="BACK"
        onBack={() => router.back()}
        title="Analytical Dashboard"
        subtitle="Compare your predictions with actual results."
      />
      <Panel title="Prediction vs. Actual">
        <ScrollView horizontal>
          <View style={[styles.table, { width: tableWidth }]}>
            <View style={styles.row}>
              <Text
                style={[styles.cell, styles.h, cVariable]}
                numberOfLines={1}
              >
                Variable
              </Text>
              <Text
                style={[styles.cell, styles.h, cValue, styles.center]}
                numberOfLines={1}
              >
                Predicted
              </Text>
              <Text
                style={[styles.cell, styles.h, cValue, styles.center]}
                numberOfLines={1}
              >
                {actualHeader}
              </Text>
            </View>
            {rows.map((row) => (
              <View key={row.variable} style={styles.row}>
                <Text
                  style={[styles.cell, styles.var, cVariable]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {row.variable}
                </Text>
                <Text
                  style={[styles.cell, cValue, styles.center]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {row.predicted}
                </Text>
                <Text
                  style={[styles.cell, cValue, styles.center]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {row.actual}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </Panel>
      {cfg.captureKind === "decibel" ? (
        <Text style={styles.note}>
          Actual dB values come from your phone microphone. Compare which action
          was loudest and whether your louder/softer predictions were correct.
        </Text>
      ) : null}
      {cfg.id === "vibration-analysis" ? (
        <Text style={styles.note}>
          Actual values come from your phone accelerometer (level + vibration).
          Lower peak tilt (°) means a more stable, earthquake-resistant design.
        </Text>
      ) : null}
      {cfg.id === "surface-smoothness" ? (
        <Text style={styles.note}>
          Actual values come from your phone accelerometer (vibration sensor).
          Lower peak vibration (m/s²) means smoother, more coordinated movement.
          Compare which movement was hardest to keep vibration low—were you
          right?
        </Text>
      ) : null}
      {cfg.id === "parachute-drop" &&
      parachutePhysics &&
      parachutePhysics.length > 0 ? (
        <Panel title="Forces & landing (from your video times)">
          {parachutePhysics.map(
            ({ label, fall, gForce, didBounce }, arrIndex) =>
              fall ? (
                <View key={label} style={styles.physicsBlock}>
                  <Text style={styles.physicsTitle}>{label}</Text>
                  <Text style={styles.physicsLine}>
                    Final speed: {formatPhysics(fall.finalVelocityMs)} m/s ·
                    Acceleration: {formatPhysics(fall.accelerationMs2)} m/s²
                  </Text>
                  <Text style={styles.physicsLine}>
                    Net force: {formatPhysics(fall.netForceN)} N · Weight:{" "}
                    {formatPhysics(fall.weightN)} N · Drag:{" "}
                    {formatPhysics(fall.dragForceN)} N
                  </Text>
                  {gForce != null ? (
                    <Text style={styles.physicsLine}>
                      G-force on landing: {formatPhysics(gForce, 1)} g
                    </Text>
                  ) : (
                    <Text style={styles.physicsMuted}>
                      {didBounce
                        ? "Add contact time and rebound time (to max height) from slow-motion."
                        : "Add contact time from slow-motion to calculate g-force."}
                    </Text>
                  )}
                  {arrIndex < parachutePhysics.length - 1 ? (
                    <View style={styles.physicsDivider} />
                  ) : null}
                </View>
              ) : null,
          )}
          <Text style={styles.note}>
            Drag = weight − net force. A parachute should increase drag, lower
            acceleration, and reduce g-force on landing. Compare Action 1
            (baseline) with your parachute designs.
          </Text>
        </Panel>
      ) : null}
      {cfg.id === "parachute-drop" ? (
        <Text style={styles.note}>
          Fall times and bounce on landing come from what you entered after
          reviewing each drop video. Use slow-motion on landing to measure
          contact time.
        </Text>
      ) : null}
    </WireScreen>
  );
}

const styles = StyleSheet.create({
  cVariable: { width: 240 },
  cVariableWide: { width: 280 },
  cValue: { width: 100 },
  cValueWide: { width: 110 },
  center: { textAlign: "center" },
  table: {
    borderWidth: 1,
    borderColor: Wireframe.border,
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Wireframe.border,
  },
  cell: {
    padding: 8,
    fontSize: 12,
    color: Wireframe.text,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: Wireframe.border,
  },
  h: {
    fontWeight: "800",
    backgroundColor: "#f0f0f0",
  },
  var: { fontWeight: "600" },
  note: {
    marginTop: 10,
    fontSize: 12,
    color: "#aaa",
    lineHeight: 17,
  },
  physicsBlock: { marginBottom: 4 },
  physicsTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: Wireframe.text,
    marginBottom: 4,
  },
  physicsLine: {
    fontSize: 12,
    color: Wireframe.text,
    lineHeight: 18,
    marginBottom: 2,
  },
  physicsMuted: {
    fontSize: 11,
    color: Wireframe.textMuted,
    fontStyle: "italic",
    marginBottom: 4,
  },
  physicsDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Wireframe.border,
    marginVertical: 10,
  },
});
