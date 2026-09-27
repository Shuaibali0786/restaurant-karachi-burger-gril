/**
 * Pakistani mobile numbers: 03XX-XXXXXXX, +92 3XX XXXXXXX, 0092…, or 92…
 * (spaces and dashes allowed). Plain function so it can be used without the
 * validation library (e.g. inside lib/api on the client).
 */
const PK_MOBILE = /^(?:\+92|0092|92|0)3\d{9}$/;

/** Returns the number as +923XXXXXXXXX, or null if it isn't a Pakistani mobile. */
export function normalizePkMobile(value: string): string | null {
  const compact = value.trim().replace(/[\s-]/g, "");
  return PK_MOBILE.test(compact) ? `+92${compact.slice(-10)}` : null;
}
