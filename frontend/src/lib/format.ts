// en-US grouping gives the same "1,190" output on every server/browser ICU build.
const rupees = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

/** Formats integer rupees as `Rs 1,190` (Constitution I). */
export function formatRs(amount: number): string {
  return `Rs ${rupees.format(Math.round(amount))}`;
}

/** Formats a normalised `+923001234567` mobile number as `0300 1234567`. */
export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const local = digits.startsWith("92") ? `0${digits.slice(2)}` : digits;
  return local.length === 11 ? `${local.slice(0, 4)} ${local.slice(4)}` : phone;
}
