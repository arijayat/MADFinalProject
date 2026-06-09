import { useLocalSearchParams, useRouter } from "expo-router";
import { Image } from "expo-image";
import { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { ScreenHeader } from "@/components/wireframe/BackNav";
import { ActivityRecordedVideosPanel } from "@/components/activity/ActivityRecordedVideosPanel";
import { Panel } from "@/components/wireframe/Panel";
import { PrimaryButton } from "@/components/wireframe/PrimaryButton";
import { WireScreen } from "@/components/wireframe/WireScreen";
import { useLocalizedActivity } from "@/constants/localized-activities";
import { Wireframe } from "@/constants/wireframe-theme";
import {
    useActivitySession,
    type BounceObservation,
} from "@/contexts/ActivitySessionContext";
import { useAppTheme } from "@/contexts/AppThemeContext";
import {
  formatParachuteDesignPhotoExpiry,
  isParachuteDesignPhotoExpired,
} from "@/lib/storage/parachute-design-expiry";
import {
  BREATHING_PHASE_SHORT,
  breathingRatePredictionMatches,
  formatRecordingDetail,
  higherAfterExerciseActual,
  higherAfterExerciseMatches,
} from "@/utils/breathing-dashboard";
import {
  getHearingRisk,
  predictionMatchesActual,
  QUIET_ROOM_REFERENCE_DB,
} from "@/utils/decibel-hearing-risk";
import {
  bendPredictionMatches,
  estimateForceN,
  formatForceN,
  getStiffnessK,
} from "@/utils/fan-force";
import {
  averagePeakVibration,
  formatPerformanceReading,
  getHardestMovementPrediction,
  hardestMovementMatches,
  MOVEMENT_SHORT,
} from "@/utils/performance-dashboard";
import {
  mostStablePredictionMatches,
  steadiestDesignLabel,
  tiltPredictionMatches,
  VIBRATION_DESIGN_SHORT,
} from "@/utils/vibration-dashboard";
import {
    computeFallPhysics,
    computeGForceBounce,
    computeGForceNoBounce,
    formatPhysics,
} from "@/utils/parachute-physics";
import {
  dominantFasterMatches,
  formatTracePrediction,
  reactionTimeMatches,
  traceRowMatches,
} from "@/utils/reaction-dashboard";

const PL_PRED = "123";
const PL_ACT = "127";

type DashboardRow = {
  variable: string;
  predicted: string;
  actual: string;
  hearingRisk?: string;
  actualVib?: string;
  wereRight?: string;
};

type ContextLine = { label: string; value: string };

type TableSection = { title: string; rows: DashboardRow[] };

type DashboardData = {
  contextLines: ContextLine[];
  rows: DashboardRow[];
  sections: TableSection[];
  designPhotoUrl?: string | null;
  designPhotoExpiresAtMs?: number | null;
  designPhotoExpired?: boolean;
};

const DECIBEL_ACTION_LABELS = [
  "Action 1 — drop object",
  "Action 2 — talking",
  "Action 3 — stamping",
];

const CELL_PADDING = 16;
const CHAR_WIDTH = 7;
const MIN_VARIABLE_COL = 100;
const MIN_VALUE_COL = 92;
const MIN_PREDICTED_HEADER_COL = 96;

function estimateColumnWidth(texts: string[], minWidth: number): number {
  const longest = texts.reduce((max, text) => Math.max(max, text.length), 0);
  return Math.max(minWidth, Math.ceil(longest * CHAR_WIDTH) + CELL_PADDING);
}

function formatFallTimePrediction(value: string | undefined): string {
  const v = value?.trim();
  if (!v) return "—";
  const n = parseFloat(v);
  return Number.isFinite(n) ? `${v} s` : v;
}

const PARACHUTE_ACTION_LABELS = [
  "Action 1 — fall time",
  "Action 2 — fall time",
  "Action 3 — fall time",
];

export default function ActivityDashboardScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { activityId } = useLocalSearchParams<{ activityId: string }>();
  const cfg = useLocalizedActivity(activityId ?? "");
  const { getSession } = useActivitySession();

  const dashboardData = useMemo((): DashboardData => {
    if (!cfg) return { contextLines: [], rows: [], sections: [] };
    const session = getSession(cfg.id);

    if (cfg.id === "surface-smoothness" && cfg.movementActions) {
      const predKeys = ["move1_pred", "move2_pred", "move3_pred"];
      const attempt1 = session.performanceReadings.filter((r) => r.attempt === 1);
      const attempt2 = session.performanceReadings.filter((r) => r.attempt === 2);

      const attempt1Rows: DashboardRow[] = cfg.movementActions.map((label, i) => {
        const a1 = attempt1.find((r) => r.label === label);
        return {
          variable: MOVEMENT_SHORT[i] ?? `Movement ${i + 1}`,
          predicted: session.predictions[predKeys[i]] ?? "—",
          actual: a1 != null ? formatPerformanceReading(a1) : "—",
          wereRight: "—",
        };
      });

      attempt1Rows.push({
        variable: "Hardest to keep vibration low",
        predicted: session.predictions.hardest_move ?? "—",
        actual: getHardestMovementPrediction(attempt1, 1),
        wereRight: hardestMovementMatches(
          session.predictions.hardest_move,
          attempt1,
          1,
        ),
      });

      const attempt2Preds: { key: string; label: string; index: number }[] = [
        {
          key: "attempt2_pred",
          label: "Movement 1 (with buzz)",
          index: 0,
        },
        {
          key: "attempt3_pred",
          label: "Movement 2 (with buzz)",
          index: 1,
        },
      ];
      const attempt2Rows: DashboardRow[] = attempt2Preds.map(
        ({ key, label, index }) => {
          const reading = attempt2[index];
          return {
            variable: label,
            predicted: session.predictions[key] ?? "—",
            actual: reading != null ? formatPerformanceReading(reading) : "—",
            wereRight: "—",
          };
        },
      );

      const attempt1Overall = session.predictions.attempt1_pred?.trim();
      const attempt1Measured = averagePeakVibration(attempt1, 1);
      const contextLines: ContextLine[] = [];

      if (attempt1Overall || attempt1Measured !== "—") {
        contextLines.push({
          label: "Attempt 1 overall smoothness",
          value: `${attempt1Overall || "—"} (predicted) · ${attempt1Measured} (measured avg)`,
        });
      }
      if (attempt2[2] != null) {
        contextLines.push({
          label: "Movement 3 (with buzz)",
          value: formatPerformanceReading(attempt2[2]),
        });
      }

      return {
        contextLines,
        rows: [],
        sections: [
          { title: "Attempt 1 — slow (no buzz)", rows: attempt1Rows },
          { title: "Attempt 2 — with buzz feedback", rows: attempt2Rows },
        ],
      };
    }

    if (cfg.id === "vibration-analysis" && cfg.vibrationDesignActions) {
      const predKeys = ["design1_pred", "design2_pred", "design3_pred"];
      const readings = session.vibrationReadings;
      const designRows: DashboardRow[] = cfg.vibrationDesignActions.map(
        (_, i) => {
          const reading = readings[i];
          const pred = session.predictions[predKeys[i]];
          const tilt = reading?.peakTiltDeg;
          return {
            variable: VIBRATION_DESIGN_SHORT[i] ?? `Design ${i + 1}`,
            predicted: pred ? `${pred}°` : "—",
            actual: tilt != null ? `${tilt.toFixed(1)}°` : "—",
            actualVib:
              reading != null
                ? `${reading.peakVibrationMs2.toFixed(2)} m/s²`
                : "—",
            wereRight:
              tilt != null && pred
                ? tiltPredictionMatches(pred, tilt)
                : "—",
          };
        },
      );
      designRows.push({
        variable: "Moves least (overall prediction)",
        predicted: session.predictions.mostStable ?? "—",
        actual: steadiestDesignLabel(readings),
        actualVib: "—",
        wereRight: mostStablePredictionMatches(
          session.predictions.mostStable,
          readings,
        ),
      });
      const design3Desc = session.predictions.design3_desc?.trim();
      return {
        contextLines: design3Desc
          ? [{ label: "Design 3 — your description", value: design3Desc }]
          : [],
        rows: designRows,
        sections: [],
      };
    }

    if (cfg.captureKind === "decibel" && cfg.decibelActions) {
      const readings = session.decibelReadings;
      const actionRows: DashboardRow[] = cfg.decibelActions.map((_, i) => {
        const reading = readings[i];
        const peakDb = reading?.peakDb;
        const predKey = `action${i + 1}_pred`;
        const prediction = session.predictions[predKey];
        let wereRight = "—";
        if (peakDb != null && prediction) {
          if (i === 0) {
            wereRight = predictionMatchesActual(
              prediction,
              peakDb,
              QUIET_ROOM_REFERENCE_DB,
            );
          } else if (readings[i - 1] != null) {
            wereRight = predictionMatchesActual(
              prediction,
              peakDb,
              readings[i - 1].peakDb,
            );
          }
        }
        return {
          variable: DECIBEL_ACTION_LABELS[i] ?? `Action ${i + 1}`,
          predicted: prediction ?? "—",
          actual: peakDb != null ? `${peakDb} dB` : "—",
          hearingRisk: peakDb != null ? getHearingRisk(peakDb) : "—",
          wereRight,
        };
      });
      const location = session.predictions.location?.trim();
      return {
        contextLines: location
          ? [{ label: "Location / zone", value: location }]
          : [],
        rows: actionRows,
        sections: [],
      };
    }

    if (cfg.id === "reaction-time") {
      const dominant = session.tapReactionReadings.filter(
        (r) => r.hand === "dominant" && !r.falseStart,
      );
      const nonDominant = session.tapReactionReadings.filter(
        (r) => r.hand === "non_dominant" && !r.falseStart,
      );

      const tapSummary = (hand: "dominant" | "non_dominant") => {
        const valid = session.tapReactionReadings.filter(
          (r) => r.hand === hand && !r.falseStart,
        );
        const all = session.tapReactionReadings.filter((r) => r.hand === hand);
        if (all.length === 0) return { text: "—", avg: null as number | null };
        if (valid.length === 0) return { text: "False start", avg: null };
        const avg = Math.round(
          valid.reduce((s, r) => s + r.reactionTimeMs, 0) / valid.length,
        );
        return { text: `${avg} ms`, avg };
      };

      const avgMs = (readings: typeof dominant) => {
        if (readings.length === 0) return null;
        return Math.round(
          readings.reduce((s, r) => s + r.reactionTimeMs, 0) / readings.length,
        );
      };

      const domResult = tapSummary("dominant");
      const nonDomResult = tapSummary("non_dominant");
      const domAvg = avgMs(dominant);
      const nonDomAvg = avgMs(nonDominant);

      const domAll = session.tapReactionReadings.filter(
        (r) => r.hand === "dominant",
      );
      const nonDomAll = session.tapReactionReadings.filter(
        (r) => r.hand === "non_dominant",
      );
      const domFalseOnly = domAll.length > 0 && dominant.length === 0;
      const nonDomFalseOnly =
        nonDomAll.length > 0 && nonDominant.length === 0;

      const dominantFasterActual = (): string => {
        if (domAvg != null && nonDomAvg != null) {
          if (domAvg < nonDomAvg) return "Yes — dominant faster";
          if (domAvg > nonDomAvg) return "No — other hand faster";
          return "About the same";
        }
        if (domAvg != null && nonDomFalseOnly) {
          return "Dominant only (false start other hand)";
        }
        if (nonDomAvg != null && domFalseOnly) {
          return "Other hand only (false start dominant)";
        }
        if (domFalseOnly && nonDomFalseOnly) {
          return "Cannot compare (false starts)";
        }
        if (domAvg != null && nonDomAll.length === 0) {
          return "Dominant only (phase 2 not done)";
        }
        if (nonDomAvg != null && domAll.length === 0) {
          return "Other hand only (phase 1 not done)";
        }
        return "—";
      };

      const rows: DashboardRow[] = [
        {
          variable: "Phase 1 — tap (dominant)",
          predicted: session.predictions.phase1_pred
            ? `${session.predictions.phase1_pred} ms`
            : "—",
          actual: domResult.text,
          actualVib: "—",
          wereRight: reactionTimeMatches(
            session.predictions.phase1_pred,
            domResult.avg,
          ),
        },
        {
          variable: "Phase 2 — tap (other hand)",
          predicted: session.predictions.phase2_pred
            ? `${session.predictions.phase2_pred} ms`
            : "—",
          actual: nonDomResult.text,
          actualVib: "—",
          wereRight: reactionTimeMatches(
            session.predictions.phase2_pred,
            nonDomResult.avg,
          ),
        },
        {
          variable: "Dominant hand faster?",
          predicted: session.predictions.dominant_faster ?? "—",
          actual: dominantFasterActual(),
          actualVib: "—",
          wereRight: dominantFasterMatches(
            session.predictions.dominant_faster,
            domAvg,
            nonDomAvg,
          ),
        },
      ];

      ([1, 2, 3] as const).forEach((attempt) => {
        const t = session.tracingReadings[attempt - 1];
        rows.push({
          variable: `Phase 3 — Trace ${attempt}`,
          predicted: formatTracePrediction(session.predictions, attempt),
          actual: t != null ? `${t.accuracyPct}%` : "—",
          actualVib: t != null ? `${t.avgDelayMs} ms` : "—",
          wereRight:
            t != null
              ? traceRowMatches(
                  session.predictions,
                  attempt,
                  t.accuracyPct,
                  t.avgDelayMs,
                )
              : "—",
        });
      });
      return { contextLines: [], rows, sections: [] };
    }

    if (cfg.id === "breathing-pattern" && cfg.breathingPhases) {
      const predKeys = ["rest_pred", "exercise1_pred", "exercise2_pred"];
      const readings = session.breathingReadings;

      const phaseRows: DashboardRow[] = cfg.breathingPhases.map((_, i) => {
        const reading = readings[i];
        const pred = session.predictions[predKeys[i]];
        return {
          variable: BREATHING_PHASE_SHORT[i] ?? cfg.breathingPhases![i],
          predicted: pred ? `${pred} breaths/min` : "—",
          actual:
            reading != null ? `${reading.breathsPerMinute} breaths/min` : "—",
          actualVib:
            reading != null ? formatRecordingDetail(reading) : "—",
          wereRight: breathingRatePredictionMatches(
            pred,
            reading?.breathsPerMinute,
          ),
        };
      });

      const contextLines: ContextLine[] = [];
      const ex1 = session.predictions.exercise1_type?.trim();
      const ex2 = session.predictions.exercise2_type?.trim();
      if (ex1) contextLines.push({ label: "Exercise 1", value: ex1 });
      if (ex2) contextLines.push({ label: "Exercise 2", value: ex2 });

      phaseRows.push({
        variable: "Higher breathing rate after exercise?",
        predicted: session.predictions.higher_after_exercise ?? "—",
        actual: higherAfterExerciseActual(readings),
        actualVib: "—",
        wereRight: higherAfterExerciseMatches(
          session.predictions.higher_after_exercise,
          readings,
        ),
      });
      return { contextLines, rows: phaseRows, sections: [] };
    }

    if (cfg.id === "hand-fan-challenge" && cfg.fanChallengeActions) {
      const material = session.predictions.material ?? "";
      const k = getStiffnessK(material);
      const predictedBend = session.predictions.predictedBend ?? "";
      const readings = session.fanAngleReadings;

      const contextLines: ContextLine[] = [];
      if (session.predictions.fanDesign?.trim()) {
        contextLines.push({
          label: "Fan design",
          value: session.predictions.fanDesign,
        });
      }
      if (material) {
        contextLines.push({
          label: "Material",
          value: k != null ? `${material} (k = ${k} N/rad)` : material,
        });
      }
      if (session.predictions.distance?.trim()) {
        contextLines.push({
          label: "Primary distance",
          value: `${session.predictions.distance} cm`,
        });
      }
      if (predictedBend) {
        contextLines.push({
          label: "Predicted max bend",
          value: `${predictedBend}°`,
        });
      }

      const rows: DashboardRow[] = [];
      cfg.fanChallengeActions.forEach((label, i) => {
        const reading = readings[i];
        const angle = reading?.angleDegrees;
        rows.push({
          variable: label,
          predicted: predictedBend ? `${predictedBend}°` : "—",
          actual: angle != null ? `${angle}°` : "—",
          wereRight:
            angle != null && predictedBend
              ? bendPredictionMatches(predictedBend, angle)
              : "—",
        });
      });

      if (readings.length > 0) {
        const maxAngle = Math.max(...readings.map((r) => r.angleDegrees));
        rows.push({
          variable: "Max bend (all trials)",
          predicted: predictedBend ? `${predictedBend}°` : "—",
          actual: `${maxAngle}°`,
          wereRight: predictedBend
            ? bendPredictionMatches(predictedBend, maxAngle)
            : "—",
        });
      }
      return { contextLines, rows, sections: [] };
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
      cfg.parachuteDropActions.forEach((_, i) => {
        const reading = session.parachuteReadings[i];
        rows.push({
          variable: PARACHUTE_ACTION_LABELS[i] ?? `Action ${i + 1}`,
          predicted: formatFallTimePrediction(session.predictions[predKeys[i]]),
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
      const designUrl = session.parachuteDesignPhotoUrl;
      const designExpiresAtMs = session.parachuteDesignPhotoExpiresAtMs;
      const designExpired = isParachuteDesignPhotoExpired(designExpiresAtMs);
      const activeDesignUrl = designExpired ? null : designUrl;
      const contextLines: ContextLine[] = [];
      if (activeDesignUrl && designExpiresAtMs) {
        contextLines.push({
          label: "Action 3 — design photo available until",
          value: formatParachuteDesignPhotoExpiry(designExpiresAtMs),
        });
      } else if (designUrl && designExpired) {
        contextLines.push({
          label: "Action 3 — design photo",
          value: "Expired (removed from storage after 30 days)",
        });
      }
      return {
        contextLines,
        rows,
        sections: [],
        designPhotoUrl: activeDesignUrl,
        designPhotoExpiresAtMs: designExpiresAtMs,
        designPhotoExpired: designExpired,
      };
    }

    return {
      contextLines: [],
      rows: cfg.dashboardVariables.map((v) => ({
        variable: v,
        predicted: PL_PRED,
        actual: PL_ACT,
      })),
      sections: [],
    };
  }, [cfg, getSession]);

  const rows = dashboardData.rows;
  const tableSections = dashboardData.sections;
  const contextLines = dashboardData.contextLines;
  const parachuteDesignPhotoUrl = dashboardData.designPhotoUrl;

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

  const isDecibel = cfg?.captureKind === "decibel";
  const isFan = cfg?.id === "hand-fan-challenge";
  const isVibration = cfg?.id === "vibration-analysis";
  const isPerformance = cfg?.id === "surface-smoothness";
  const isReaction = cfg?.id === "reaction-time";
  const isBreathing = cfg?.id === "breathing-pattern";
  const allTableRows = useMemo(
    () => [...rows, ...tableSections.flatMap((section) => section.rows)],
    [rows, tableSections],
  );
  const performanceUsesSections = tableSections.length > 0;
  const showExtraCol1 =
    isDecibel || isVibration || isBreathing || isReaction;
  const showExtraCol2 =
    showExtraCol1 || isFan || isPerformance;
  const hasExtraCols = showExtraCol1 || showExtraCol2;

  const fanForceResults = useMemo(() => {
    if (!cfg || cfg.id !== "hand-fan-challenge" || !session) return null;
    const material = session.predictions.material ?? "";
    const k = getStiffnessK(material);
    const readings = session.fanAngleReadings;
    if (k == null || readings.length === 0) return null;

    return readings.map((r) => {
      const force = estimateForceN(k, r.angleDegrees);
      return {
        label: r.label,
        angleDegrees: r.angleDegrees,
        stiffnessK: k,
        forceN: force,
      };
    });
  }, [cfg, session]);

  const columnWidths = useMemo(() => {
    const isParachute = cfg?.id === "parachute-drop";
    const actualHeader =
      isParachute
        ? "Actual"
        : isDecibel
          ? "Actual (dB)"
          : isFan
            ? "Actual (°)"
            : isVibration
              ? "Tilt (°)"
              : isPerformance
                ? performanceUsesSections
                  ? "Measured"
                  : "Attempt 1"
                : isReaction
                  ? "Measured"
                  : isBreathing
                    ? "Breaths/min"
                    : "Actual";

    const variableHeader = isDecibel
      ? "Action"
      : isFan
        ? "Trial"
        : isVibration
          ? "Design"
          : isPerformance || isReaction || isBreathing
            ? "Phase"
            : "Variable";
    const variableMin = isParachute || hasExtraCols ? 120 : MIN_VARIABLE_COL;
    const valueMin = MIN_VALUE_COL;

    const variable = estimateColumnWidth(
      [variableHeader, ...allTableRows.map((row) => row.variable)],
      variableMin,
    );
    const predicted = Math.max(
      MIN_PREDICTED_HEADER_COL,
      estimateColumnWidth(
        ["Predicted", ...allTableRows.map((row) => row.predicted)],
        valueMin,
      ),
    );
    const actual = estimateColumnWidth(
      [actualHeader, ...allTableRows.map((row) => row.actual)],
      valueMin,
    );
    const extraCol1Header = isDecibel
      ? "Hearing risk"
      : isVibration
        ? "Vibration"
        : isBreathing
          ? "Recording"
          : "Delay";
    const extraCol1 = showExtraCol1
      ? estimateColumnWidth(
          [
            extraCol1Header,
            ...allTableRows.map((row) =>
              isDecibel
                ? (row.hearingRisk ?? "—")
                : (row.actualVib ?? "—"),
            ),
          ],
          isDecibel
            ? 148
            : isBreathing
              ? 110
              : isReaction
                ? 72
                : 88,
        )
      : 0;
    const extraCol2Header = isFan ? "Close?" : "Right?";
    const extraCol2 = showExtraCol2
      ? estimateColumnWidth(
          [extraCol2Header, ...allTableRows.map((row) => row.wereRight ?? "—")],
          56,
        )
      : 0;
    return {
      actualHeader,
      variableHeader,
      extraCol1Header,
      extraCol2Header,
      variable,
      predicted,
      actual,
      extraCol1,
      extraCol2,
      table: variable + predicted + actual + extraCol1 + extraCol2,
    };
  }, [
    cfg,
    allTableRows,
    isDecibel,
    isFan,
    isVibration,
    isPerformance,
    performanceUsesSections,
    isReaction,
    isBreathing,
    showExtraCol1,
    showExtraCol2,
    hasExtraCols,
  ]);

  if (!cfg) {
    return (
      <WireScreen>
        <Text style={{ color: colors.text }}>Activity not found.</Text>
      </WireScreen>
    );
  }

  function renderDataTable(tableRows: DashboardRow[], panelTitle: string) {
    if (tableRows.length === 0) return null;

    return (
      <Panel title={panelTitle}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator
          nestedScrollEnabled
          contentContainerStyle={styles.tableScrollContent}
        >
          <View
            style={[
              styles.table,
              { width: columnWidths.table, borderColor: colors.border },
            ]}>
            <View style={[styles.row, { borderBottomColor: colors.border }]}>
              <Text
                numberOfLines={2}
                style={[
                  styles.cell,
                  styles.h,
                  {
                    width: columnWidths.variable,
                    color: colors.text,
                    borderRightColor: colors.border,
                    backgroundColor: colors.surfaceAlt,
                  },
                ]}
              >
                {columnWidths.variableHeader}
              </Text>
              <Text
                numberOfLines={1}
                style={[
                  styles.cell,
                  styles.h,
                  styles.center,
                  {
                    width: columnWidths.predicted,
                    color: colors.text,
                    borderRightColor: colors.border,
                    backgroundColor: colors.surfaceAlt,
                  },
                ]}
              >
                Predicted
              </Text>
              <Text
                numberOfLines={2}
                style={[
                  styles.cell,
                  styles.h,
                  styles.center,
                  ...(!showExtraCol1 && !showExtraCol2 ? [styles.lastCol] : []),
                  {
                    width: columnWidths.actual,
                    color: colors.text,
                    borderRightColor: colors.border,
                    backgroundColor: colors.surfaceAlt,
                  },
                ]}
              >
                {columnWidths.actualHeader}
              </Text>
              {showExtraCol1 ? (
                <Text
                  numberOfLines={2}
                  style={[
                    styles.cell,
                    styles.h,
                    ...(!showExtraCol2 ? [styles.lastCol] : []),
                    {
                      width: columnWidths.extraCol1,
                      color: colors.text,
                      borderRightColor: colors.border,
                      backgroundColor: colors.surfaceAlt,
                    },
                  ]}
                >
                  {columnWidths.extraCol1Header}
                </Text>
              ) : null}
              {showExtraCol2 ? (
                <Text
                  numberOfLines={1}
                  style={[
                    styles.cell,
                    styles.h,
                    styles.center,
                    styles.lastCol,
                    {
                      width: columnWidths.extraCol2,
                      color: colors.text,
                      borderRightColor: colors.border,
                      backgroundColor: colors.surfaceAlt,
                    },
                  ]}
                >
                  {columnWidths.extraCol2Header}
                </Text>
              ) : null}
            </View>
            {tableRows.map((row) => (
              <View
                key={`${panelTitle}-${row.variable}`}
                style={[styles.row, { borderBottomColor: colors.border }]}>
                <Text
                  style={[
                    styles.cell,
                    styles.var,
                    {
                      width: columnWidths.variable,
                      color: colors.text,
                      borderRightColor: colors.border,
                    },
                  ]}
                >
                  {row.variable}
                </Text>
                <Text
                  style={[
                    styles.cell,
                    styles.center,
                    {
                      width: columnWidths.predicted,
                      color: colors.text,
                      borderRightColor: colors.border,
                    },
                  ]}
                >
                  {row.predicted}
                </Text>
                <Text
                  style={[
                    styles.cell,
                    styles.center,
                    ...(!showExtraCol1 && !showExtraCol2 ? [styles.lastCol] : []),
                    {
                      width: columnWidths.actual,
                      color: colors.text,
                      borderRightColor: colors.border,
                    },
                  ]}
                >
                  {row.actual}
                </Text>
                {showExtraCol1 ? (
                  <Text
                    style={[
                      styles.cell,
                      ...(!showExtraCol2 ? [styles.lastCol] : []),
                      {
                        width: columnWidths.extraCol1,
                        color: colors.text,
                        borderRightColor: colors.border,
                      },
                    ]}
                  >
                    {isDecibel
                      ? (row.hearingRisk ?? "—")
                      : (row.actualVib ?? "—")}
                  </Text>
                ) : null}
                {showExtraCol2 ? (
                  <Text
                    style={[
                      styles.cell,
                      styles.center,
                      styles.lastCol,
                      {
                        width: columnWidths.extraCol2,
                        color: colors.text,
                        borderRightColor: colors.border,
                      },
                    ]}
                  >
                    {row.wereRight ?? "—"}
                  </Text>
                ) : null}
              </View>
            ))}
          </View>
        </ScrollView>
      </Panel>
    );
  }

  const mainPanelTitle =
    tableSections.length > 0 ? "Summary" : "Prediction vs. Actual";

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
      {contextLines.length > 0 ? (
        <Panel title="Your setup">
          {contextLines.map((line) => (
            <View key={line.label} style={styles.contextRow}>
              <Text style={[styles.contextLabel, { color: colors.text }]}>{line.label}</Text>
              <Text style={[styles.contextValue, { color: colors.text }]}>{line.value}</Text>
            </View>
          ))}
        </Panel>
      ) : null}
      {renderDataTable(rows, mainPanelTitle)}
      {tableSections.map((section) =>
        renderDataTable(section.rows, section.title),
      )}
      {cfg.captureKind === "decibel" ? (
        <Text style={[styles.note, { color: colors.textMuted }]}>
          Peak dB is measured with the app microphone (relative scale for
          classroom comparison). Hearing risk follows standard sound-level bands.
          “Right?” compares your louder/softer prediction to the previous action
          (Action 1 uses ~45 dB as a quiet-room reference).
        </Text>
      ) : null}
      {cfg.id === "vibration-analysis" ? (
        <Text style={[styles.note, { color: colors.textMuted }]}>
          Peak tilt (°) and vibration (m/s²) come from the app accelerometer
          during each shake test. Lower tilt means a more stable design. “Right?”
          compares your predicted tilt to measured (within 2°), or your “moves
          least” pick to the design with the smallest tilt.
        </Text>
      ) : null}
      {cfg.id === "breathing-pattern" ? (
        <Text style={[styles.note, { color: colors.textMuted }]}>
          Breathing rate is estimated from chest rise/fall while lying down with
          the phone on the chest. Recording shows duration, movement range, and
          gyroscope stability when available. “Right?” compares your breathing
          rate guess within 4 breaths/min, or your higher-after-exercise pick vs
          rest vs after-exercise readings.
        </Text>
      ) : null}
      {cfg.id === "surface-smoothness" ? (
        <Text style={[styles.note, { color: colors.textMuted }]}>
          Attempt 1 records all three movements slowly without buzz feedback.
          Attempt 2 repeats with buzz when motion is not smooth. Lower peak
          vibration (m/s²) means smoother movement. “Right?” on the hardest-move
          row checks your Movement 1/2/3 pick against Attempt 1 data.
        </Text>
      ) : null}
      {cfg.id === "reaction-time" ? (
        <Text style={[styles.note, { color: colors.textMuted }]}>
          Phase 1 and 2 use average tap reaction time (ms). Phase 3 tracing shows
          accuracy (%) and delay (ms). “Right?” compares predictions to measured
          values (within tolerance). The dominant-hand-faster row checks your
          Yes/No/About the same pick against both tap averages.
        </Text>
      ) : null}
      {cfg.id === "hand-fan-challenge" &&
      fanForceResults &&
      fanForceResults.length > 0 ? (
        <Panel title="Force estimate (F ≈ k × θ)">
          {fanForceResults.map(({ label, angleDegrees, stiffnessK, forceN }, i) =>
            forceN != null ? (
              <View key={label} style={styles.physicsBlock}>
                <Text style={[styles.physicsTitle, { color: colors.text }]}>{label}</Text>
                <Text style={[styles.physicsLine, { color: colors.text }]}>
                  Bend: {angleDegrees}° ({((angleDegrees * Math.PI) / 180).toFixed(3)}{" "}
                  rad) · k = {stiffnessK} N/rad
                </Text>
                <Text style={[styles.physicsLine, { color: colors.text }]}>
                  F ≈ k × θ = {formatForceN(forceN)}
                </Text>
                {i < fanForceResults.length - 1 ? (
                  <View style={[styles.physicsDivider, { backgroundColor: colors.border }]} />
                ) : null}
              </View>
            ) : null,
          )}
          <Text style={[styles.note, { color: colors.textMuted }]}>
            Stiffer materials have larger k, so the same bend angle needs more
            force. Compare 15 cm vs 45 cm — closer fans usually bend the strip
            more.
          </Text>
        </Panel>
      ) : null}
      {cfg.id === "parachute-drop" && session ? (
        <ActivityRecordedVideosPanel
          title="Recorded drop videos"
          entries={(cfg.parachuteDropActions ?? []).map((label, i) => ({
            label,
            video: session.parachuteReadings[i]?.video ?? null,
          }))}
        />
      ) : null}
      {cfg.id === "hand-fan-challenge" && session ? (
        <ActivityRecordedVideosPanel
          title="Recorded fan challenge videos"
          entries={(cfg.fanChallengeActions ?? []).map((label, i) => ({
            label,
            video: session.fanAngleReadings[i]?.video ?? null,
          }))}
        />
      ) : null}
      {cfg.id === "hand-fan-challenge" ? (
        <Text style={[styles.note, { color: colors.textMuted }]}>
          Bend angles come from slow-motion video review. “Close?” compares each
          measured angle to your predicted maximum (within 5°). Force uses
          classroom k values from your material choice.
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
                  <Text style={[styles.physicsTitle, { color: colors.text }]}>{label}</Text>
                  <Text style={[styles.physicsLine, { color: colors.text }]}>
                    Final speed: {formatPhysics(fall.finalVelocityMs)} m/s ·
                    Acceleration: {formatPhysics(fall.accelerationMs2)} m/s²
                  </Text>
                  <Text style={[styles.physicsLine, { color: colors.text }]}>
                    Net force: {formatPhysics(fall.netForceN)} N · Weight:{" "}
                    {formatPhysics(fall.weightN)} N · Drag:{" "}
                    {formatPhysics(fall.dragForceN)} N
                  </Text>
                  {gForce != null ? (
                    <Text style={[styles.physicsLine, { color: colors.text }]}>
                      G-force on landing: {formatPhysics(gForce, 1)} g
                    </Text>
                  ) : (
                    <Text style={[styles.physicsMuted, { color: colors.textMuted }]}>
                      {didBounce
                        ? "Add contact time and rebound time (to max height) from slow-motion."
                        : "Add contact time from slow-motion to calculate g-force."}
                    </Text>
                  )}
                  {arrIndex < parachutePhysics.length - 1 ? (
                    <View style={[styles.physicsDivider, { backgroundColor: colors.border }]} />
                  ) : null}
                </View>
              ) : null,
          )}
          <Text style={[styles.note, { color: colors.textMuted }]}>
            Drag = weight − net force. A parachute should increase drag, lower
            acceleration, and reduce g-force on landing. Compare Action 1
            (baseline) with your parachute designs.
          </Text>
        </Panel>
      ) : null}
      {cfg.id === "parachute-drop" && parachuteDesignPhotoUrl ? (
        <Panel>
          <Text style={[styles.designPhotoTitle, { color: colors.text }]}>Action 3 — revised parachute design</Text>
          {dashboardData.designPhotoExpiresAtMs ? (
            <Text style={[styles.designPhotoExpiry, { color: colors.textMuted }]}>
              Stored until {formatParachuteDesignPhotoExpiry(dashboardData.designPhotoExpiresAtMs)}
            </Text>
          ) : null}
          <Image
            source={{ uri: parachuteDesignPhotoUrl }}
            style={[styles.designPhoto, { backgroundColor: colors.surfaceAlt }]}
            contentFit="contain"
          />
        </Panel>
      ) : null}
      {cfg.id === "parachute-drop" && dashboardData.designPhotoExpired ? (
        <Text style={[styles.note, { color: colors.textMuted }]}>
          Your design photo has expired and was removed from cloud storage. Fall times and other
          results are still saved.
        </Text>
      ) : null}
      {cfg.id === "parachute-drop" ? (
        <Text style={[styles.note, { color: colors.textMuted }]}>
          Fall times and bounce on landing come from what you entered after
          reviewing each drop video. Use slow-motion on landing to measure
          contact time.
        </Text>
      ) : null}
    </WireScreen>
  );
}

const styles = StyleSheet.create({
  center: { textAlign: "center" },
  tableScrollContent: {
    flexGrow: 1,
  },
  table: {
    borderWidth: 1,
    borderColor: Wireframe.border,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Wireframe.border,
  },
  cell: {
    flexShrink: 0,
    padding: 8,
    fontSize: 12,
    color: Wireframe.text,
    lineHeight: 17,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: Wireframe.border,
  },
  h: {
    fontWeight: "800",
    backgroundColor: "#f0f0f0",
  },
  lastCol: {
    borderRightWidth: 0,
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
  contextRow: {
    marginBottom: 8,
  },
  contextLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: Wireframe.text,
    marginBottom: 2,
  },
  contextValue: {
    fontSize: 13,
    color: Wireframe.text,
    lineHeight: 18,
  },
  designPhotoTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Wireframe.text,
    marginBottom: 10,
  },
  designPhotoExpiry: {
    fontSize: 12,
    color: Wireframe.textMuted,
    marginBottom: 8,
  },
  designPhoto: {
    width: "100%",
    height: 240,
    backgroundColor: "#eee",
  },
});
