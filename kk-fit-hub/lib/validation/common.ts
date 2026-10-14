import { z } from "zod";
import { isKenyanPhone } from "@/lib/phone";

/** Error copy (PRD 8.4). */
export const messages = {
  required: (field: string) => `Please enter your ${field}.`,
  phone: "Enter a Kenyan phone number, for example 0722 524 438.",
  activity: "Choose at least one activity.",
  file: "That file is too large or isn't a PDF or image. Try one under 10 MB.",
  network: "We couldn't send that. Check your connection and try again. Nothing you typed has been lost.",
  rateLimited: "You've sent a few of these already. Please wait a few minutes, or WhatsApp us.",
  botCheck: "We couldn't verify the form. Refresh the page and try again.",
  email: "Please enter a valid email address.",
  consent: "Please tick the box to agree.",
};

/** Required text with length limits; the message names the field. */
export function requiredText(field: string, min: number, max: number) {
  return z
    .string({ error: messages.required(field) })
    .trim()
    .min(1, { error: messages.required(field), abort: true })
    .min(min, { error: `Please enter your ${field} (at least ${min} characters).` })
    .max(max, { error: `Please keep your ${field} under ${max} characters.` });
}

export function requiredChoice(field: string) {
  return z.string({ error: messages.required(field) }).trim().min(1, { error: messages.required(field) });
}

export const phoneField = z
  .string({ error: messages.phone })
  .trim()
  .min(1, { error: messages.phone })
  .refine(isKenyanPhone, { error: messages.phone });

export const optionalEmail = z
  .string()
  .trim()
  .max(160)
  .refine((v) => v === "" || z.email().safeParse(v).success, { error: messages.email })
  .optional();

export const consentField = z.boolean().refine((v) => v === true, { error: messages.consent });

/** Hidden attribution and protection fields carried by every public form. */
export const metaSchema = z.object({
  idempotencyKey: z.uuid(),
  source: z.string().trim().max(60).optional(),
  utm: z.record(z.string(), z.string().max(120)).optional(),
  turnstileToken: z.string().max(4096).optional(),
  /** Honeypot: must stay empty. Checked on the server, silently. */
  website: z.string().max(500).optional(),
});
export type FormMeta = z.infer<typeof metaSchema>;

/** Server action result (PRD 13: `{ ok, ref }` or field errors). */
export type ActionResult =
  | { ok: true; ref: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export const otherValue = "Other";
