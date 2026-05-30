/** Formats tracing predictions to match dashboard actual columns. */
export function formatTracePrediction(
  predictions: Record<string, string>,
  attempt: 1 | 2 | 3,
): string {
  const acc = predictions[`trace${attempt}_accuracy_pred`]?.trim();
  const delay = predictions[`trace${attempt}_delay_pred`]?.trim();
  if (acc && delay) {
    return `${acc}% accuracy · ${delay} ms delay`;
  }

  const legacy = predictions[`trace${attempt}_pred`]?.trim();
  if (legacy) return legacy;

  return "—";
}
