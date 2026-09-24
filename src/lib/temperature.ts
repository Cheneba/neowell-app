/** Parses a typed temperature ("36,8" or "36.8"); null unless it is a plausible 30–43 °C reading. */
export function parseTemperature(text: string): number | null {
  const n = Number(text.replace(',', '.'));
  if (!text.trim() || !Number.isFinite(n) || n < 30 || n > 43) return null;
  return Math.round(n * 10) / 10;
}
