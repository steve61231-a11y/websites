import { z } from "zod";
import {
  consentField,
  messages,
  metaSchema,
  optionalEmail,
  otherValue,
  phoneField,
  requiredChoice,
  requiredText,
} from "./common";

/** Demonstration request and register-interest form (PRD 8.1). */

export const contactRoles = [
  "School director",
  "Owner",
  "Principal / head teacher",
  "Deputy",
  "Games or activities coordinator",
  "Teacher",
  otherValue,
] as const;

export const requestStep1 = z
  .object({
    name: requiredText("name", 2, 80),
    role: requiredChoice("role"),
    roleOther: z.string().trim().max(80).optional(),
    school: requiredText("school or institution", 2, 120),
    county: requiredChoice("county"),
    countyOther: z.string().trim().max(80).optional(),
    phone: phoneField,
    email: optionalEmail,
    activities: z.array(z.string().max(60)).min(1, { error: messages.activity }).max(12),
    consent: consentField,
  })
  .superRefine((v, ctx) => {
    if (v.role === otherValue && !v.roleOther) {
      ctx.addIssue({ code: "custom", path: ["roleOther"], message: messages.required("role") });
    }
    if (v.county === otherValue && !v.countyOther) {
      ctx.addIssue({ code: "custom", path: ["countyOther"], message: messages.required("county") });
    }
  });
export type RequestStep1 = z.infer<typeof requestStep1>;

export const requestPayload = z.object({
  fields: requestStep1,
  meta: metaSchema,
  type: z.enum(["demo", "interest"]),
});
export type RequestPayload = z.infer<typeof requestPayload>;

export const institutionTypes = [
  "Primary",
  "Junior school",
  "Senior school / high school",
  "College",
  "University",
] as const;
export const sectors = ["Public", "Private", "International"] as const;
export const learnerBands = ["Under 50", "50–100", "100–300", "Over 300"] as const;
export const gradeOptions = [
  "Pre-primary",
  "Grades 1–3",
  "Grades 4–6",
  "Grades 7–9",
  "Grades 10–12",
  "Forms 3–4",
  "College or university",
] as const;
export const dayOptions = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
export const timeOptions = ["Morning", "Afternoon", "After classes", "Weekend"] as const;
export const contactPrefs = ["Call", "WhatsApp", "Email"] as const;

const optionalChoice = (options: readonly string[]) =>
  z
    .string()
    .optional()
    .refine((v) => !v || options.includes(v), { error: "Please choose one of the options." });

export const requestStep2 = z.object({
  institutionType: optionalChoice(institutionTypes),
  sector: optionalChoice(sectors),
  learnersBand: optionalChoice(learnerBands),
  grades: z.array(z.enum(gradeOptions)).max(gradeOptions.length).optional(),
  preferredDays: z.array(z.enum(dayOptions)).max(6).optional(),
  preferredTime: optionalChoice(timeOptions),
  startTerm: z.string().trim().max(60).optional(),
  contactPref: optionalChoice(contactPrefs),
  message: z.string().trim().max(1000, { error: "Please keep this under 1,000 characters." }).optional(),
});
export type RequestStep2 = z.infer<typeof requestStep2>;

export const detailsPayload = z.object({
  ref: z.string().regex(/^KK-\d{4,}$/),
  idempotencyKey: z.uuid(),
  fields: requestStep2,
});
