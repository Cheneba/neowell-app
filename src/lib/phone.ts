/**
 * Normalises what a Cameroonian user types into E.164.
 * Accepts "6 70 00 00 00", "670000000", "237670000000" or "+237 670 00 00 00".
 * Returns null when it cannot be a valid number.
 */
export function toE164(input: string, defaultCountryCode = '237'): string | null {
  const trimmed = input.trim();
  const digits = trimmed.replace(/\D/g, '');
  if (!digits) return null;

  let e164: string;
  if (trimmed.startsWith('+')) e164 = `+${digits}`;
  else if (trimmed.startsWith('00')) e164 = `+${digits.slice(2)}`;
  else if (digits.startsWith(defaultCountryCode) && digits.length > 9) e164 = `+${digits}`;
  else e164 = `+${defaultCountryCode}${digits}`;

  if (!/^\+[1-9]\d{7,14}$/.test(e164)) return null;
  // Cameroon numbers: +237 followed by exactly 9 digits.
  if (e164.startsWith('+237') && e164.length !== 13) return null;
  return e164;
}

/** "+237670000000" → "+237 6 70 00 00 00" */
export function formatPhone(e164: string): string {
  const m = /^\+237(\d)(\d{2})(\d{2})(\d{2})(\d{2})$/.exec(e164);
  return m ? `+237 ${m.slice(1).join(' ')}` : e164;
}
