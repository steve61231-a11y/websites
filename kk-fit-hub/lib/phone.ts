/**
 * Kenyan phone number helpers (PRD 8.1, 8.6).
 * Accepts 07…, 01…, +254… and 254… and stores E.164 (+2547XXXXXXXX).
 */

const KENYAN_MOBILE = /^(?:\+?254|0)?([17]\d{8})$/;

/** Returns +254XXXXXXXXX, or null when the input is not a Kenyan mobile number. */
export function normaliseKenyanPhone(input: string): string | null {
  const digits = input.replace(/[\s\-().]/g, "");
  const match = KENYAN_MOBILE.exec(digits);
  if (!match) return null;
  return `+254${match[1]}`;
}

export function isKenyanPhone(input: string): boolean {
  return normaliseKenyanPhone(input) !== null;
}

/** +254722524438 → "0722 524 438" (display format, section 2). */
export function formatLocalPhone(e164: string): string {
  const n = normaliseKenyanPhone(e164);
  if (!n) return e164;
  const local = `0${n.slice(4)}`;
  return `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}`;
}

/** tel: link with the +254 form. */
export function telHref(e164: string): string {
  return `tel:${normaliseKenyanPhone(e164) ?? e164}`;
}

/** wa.me link: digits only, no plus (section 8.6). */
export function whatsappHref(e164: string, text?: string): string {
  const digits = (normaliseKenyanPhone(e164) ?? e164).replace(/\D/g, "");
  return text
    ? `https://wa.me/${digits}?text=${encodeURIComponent(text)}`
    : `https://wa.me/${digits}`;
}
