import { z } from "zod";
import { consentField, metaSchema, optionalEmail, phoneField, requiredChoice, requiredText } from "./common";

/** Contact form (PRD 8.3). */
export const contactKinds = ["School", "Coach", "Parent", "Organisation", "Other"] as const;

export const contactFields = z.object({
  name: requiredText("name", 2, 80),
  phone: phoneField,
  email: optionalEmail,
  kind: requiredChoice("answer to “I am a…”").refine((v) => (contactKinds as readonly string[]).includes(v), {
    error: "Please choose one of the options.",
  }),
  message: requiredText("message", 10, 1500),
  consent: consentField,
});
export type ContactFields = z.infer<typeof contactFields>;

export const contactPayload = z.object({ fields: contactFields, meta: metaSchema });
