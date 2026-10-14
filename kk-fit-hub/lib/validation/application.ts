import { z } from "zod";
import { consentField, messages, metaSchema, otherValue, phoneField, requiredChoice, requiredText } from "./common";

/** Coach application (PRD 8.2): four steps, then review. */

export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const MAX_CERTIFICATES = 5;
export const allowedMimes = ["application/pdf", "image/jpeg", "image/png", "image/heic", "image/heif"] as const;
const allowedExtensions = [".pdf", ".jpg", ".jpeg", ".png", ".heic", ".heif"];

export function isAllowedFile(name: string, mime: string, size: number): boolean {
  const lower = name.toLowerCase();
  const extOk = allowedExtensions.some((e) => lower.endsWith(e));
  // Some phones report HEIC with an empty type; fall back to the extension.
  const mimeOk = (allowedMimes as readonly string[]).includes(mime) || (mime === "" && extOk);
  return extOk && mimeOk && size > 0 && size <= MAX_FILE_BYTES;
}

export const availabilityOptions = ["Weekday mornings", "Weekday afternoons", "After school", "Saturdays"] as const;
// CONFIRM: work preference options against the employment model (open item 7).
export const workPreferences = ["Full-time", "Part-time", "Either"] as const;
export const firstAidOptions = [
  { value: "current", label: "Current" },
  { value: "expired", label: "Expired" },
  { value: "none", label: "None" },
] as const;
export const goodConductOptions = [
  { value: "current", label: "I have a current one" },
  { value: "can_get", label: "I can get one" },
  { value: "need_help", label: "I'd need help with this" },
] as const;

const yearsField = (field: string) =>
  z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
    z
      .number({ error: messages.required(field) })
      .int({ error: "Please enter a whole number of years." })
      .min(0, { error: "Please enter a whole number of years." })
      .max(80, { error: "Please enter a whole number of years." }),
  );

export const uploadedFile = z.object({
  path: z.string().regex(/^pending\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.(pdf|jpg|jpeg|png|heic|heif)$/),
  name: z.string().max(200),
  mime: z.string().max(100),
  size: z.number().int().positive().max(MAX_FILE_BYTES),
});
export type UploadedFile = z.infer<typeof uploadedFile>;

export const applyStep1 = z.object({
  fullName: requiredText("full name", 2, 80),
  phone: phoneField,
  email: z.string({ error: messages.required("email") }).trim().min(1, { error: messages.required("email") }).pipe(z.email({ error: messages.email })),
  county: requiredChoice("county"),
  isAdult: z.boolean().refine((v) => v, { error: "You need to be 18 or older to apply." }),
  heardFrom: z.string().trim().max(80).optional(),
});

export const applyStep2 = z
  .object({
    mainActivity: requiredChoice("main discipline"),
    mainActivityOther: z.string().trim().max(80).optional(),
    otherActivities: z.array(z.string().max(60)).max(12).optional(),
    yearsPractising: yearsField("years practising"),
    yearsCoaching: yearsField("years coaching"),
    highestRank: requiredText("highest rank, grade or qualification", 2, 120),
    experience: requiredText("experience coaching young people", 50, 1500),
  })
  .superRefine((v, ctx) => {
    if (v.mainActivity === otherValue && !v.mainActivityOther) {
      ctx.addIssue({ code: "custom", path: ["mainActivityOther"], message: messages.required("main discipline") });
    }
  });

const referee = z.object({
  name: z.string().trim().max(80),
  phone: z.string().trim().max(30),
  relationship: z.string().trim().max(80),
});

export const applyStep3 = z
  .object({
    certificates: z.array(uploadedFile).max(MAX_CERTIFICATES, { error: `You can upload up to ${MAX_CERTIFICATES} certificates.` }),
    videoUrl: z
      .string()
      .trim()
      .max(500)
      .refine((v) => v === "" || /^https?:\/\/\S+\.\S+/.test(v), { error: "Please enter a full link, starting with https://" })
      .optional(),
    firstAid: z.enum(["current", "expired", "none"], { error: "Please choose one option for your first aid certificate." }),
    firstAidFile: uploadedFile.optional(),
    goodConduct: z.enum(["current", "can_get", "need_help"], {
      error: "Please choose one option for the Certificate of Good Conduct.",
    }),
    referees: z.array(referee).max(2),
  })
  .superRefine((v, ctx) => {
    v.referees.forEach((r, i) => {
      const any = r.name || r.phone || r.relationship;
      if (!any) return;
      if (!r.name) ctx.addIssue({ code: "custom", path: ["referees", i, "name"], message: "Please enter the referee's name." });
      if (!phoneField.safeParse(r.phone).success)
        ctx.addIssue({ code: "custom", path: ["referees", i, "phone"], message: messages.phone });
    });
  });

export const applyStep4 = z.object({
  availability: z.array(z.enum(availabilityOptions)).min(1, { error: "Choose at least one time you can work." }),
  workPreference: z.enum(workPreferences, { error: messages.required("work preference") }),
  counties: z.array(z.string().max(60)).min(1, { error: "Choose at least one county." }).max(47),
  extraNotes: z.string().trim().max(1000, { error: "Please keep this under 1,000 characters." }).optional(),
});

export const applySteps = [applyStep1, applyStep2, applyStep3, applyStep4] as const;

export const applicationFields = z.object({
  step1: applyStep1,
  step2: applyStep2,
  step3: applyStep3,
  step4: applyStep4,
  consent: consentField,
});
export type ApplicationFields = z.infer<typeof applicationFields>;

export const applicationPayload = z.object({
  fields: applicationFields,
  draftId: z.uuid(),
  openRoleId: z.uuid().optional(),
  meta: metaSchema,
});
export type ApplicationPayload = z.infer<typeof applicationPayload>;

export const uploadRequest = z.object({
  draftId: z.uuid(),
  name: z.string().min(1).max(200),
  mime: z.string().max(100),
  size: z.number().int(),
  turnstileToken: z.string().max(4096).optional(),
});
