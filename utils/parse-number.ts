/** Parse a positive duration in seconds; accepts comma or dot as decimal separator. */
export function parsePositiveSeconds(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const normalized = trimmed.replace(',', '.');
  const value = Number.parseFloat(normalized);
  if (!Number.isFinite(value) || value <= 0) return null;
  return value;
}
