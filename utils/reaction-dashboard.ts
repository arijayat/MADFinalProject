const REACTION_TIME_TOLERANCE_MS = 75;
const TRACE_ACCURACY_TOLERANCE_PCT = 15;
const TRACE_DELAY_TOLERANCE_MS = 75;

/** Formats tracing predictions to match dashboard actual columns. */
export function formatTracePrediction(
  predictions: Record<string, string>,
  attempt: 1 | 2 | 3,
): string {
  const acc = predictions[`trace${attempt}_accuracy_pred`]?.trim();
  const delay = predictions[`trace${attempt}_delay_pred`]?.trim();
  if (acc && delay) {
    return `${acc}% · ${delay} ms`;
  }

  const legacy = predictions[`trace${attempt}_pred`]?.trim();
  if (legacy) return legacy;

  return "—";
}

export function reactionTimeMatches(
  predictedMs: string | undefined,
  actualMs: number | null,
): string {
  const predicted = parseFloat(predictedMs ?? "");
  if (!Number.isFinite(predicted) || actualMs == null) return "—";
  return Math.abs(predicted - actualMs) <= REACTION_TIME_TOLERANCE_MS
    ? "Yes"
    : "No";
}

export function dominantFasterMatches(
  prediction: string | undefined,
  dominantAvgMs: number | null,
  nonDominantAvgMs: number | null,
): string {
  const pred = prediction?.trim();
  if (!pred || dominantAvgMs == null || nonDominantAvgMs == null) return "—";
  const diff = dominantAvgMs - nonDominantAvgMs;
  const actual =
    Math.abs(diff) <= REACTION_TIME_TOLERANCE_MS
      ? "About the same"
      : diff < 0
        ? "Yes"
        : "No";
  return pred === actual ? "Yes" : "No";
}

export function traceMetricMatches(
  predicted: string | undefined,
  actual: number | null,
  tolerance: number,
): string {
  const pred = parseFloat(predicted ?? "");
  if (!Number.isFinite(pred) || actual == null) return "—";
  return Math.abs(pred - actual) <= tolerance ? "Yes" : "No";
}

export function traceRowMatches(
  predictions: Record<string, string>,
  attempt: 1 | 2 | 3,
  accuracyPct: number,
  avgDelayMs: number,
): string {
  const acc = traceMetricMatches(
    predictions[`trace${attempt}_accuracy_pred`],
    accuracyPct,
    TRACE_ACCURACY_TOLERANCE_PCT,
  );
  const delay = traceMetricMatches(
    predictions[`trace${attempt}_delay_pred`],
    avgDelayMs,
    TRACE_DELAY_TOLERANCE_MS,
  );
  if (acc === "—" || delay === "—") return "—";
  return acc === "Yes" && delay === "Yes" ? "Yes" : "No";
}
