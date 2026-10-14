"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm, type FieldPath } from "react-hook-form";
import type { z } from "zod";
import type { Activity } from "@/content/activities";
import { firstName } from "@/content/whatsapp";
import { submitApplication } from "@/actions/public";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/cn";
import { formatLocalPhone, normaliseKenyanPhone } from "@/lib/phone";
import { uuid } from "@/lib/uuid";
import { messages, otherValue } from "@/lib/validation/common";
import {
  applicationFields,
  availabilityOptions,
  firstAidOptions,
  goodConductOptions,
  MAX_CERTIFICATES,
  workPreferences,
} from "@/lib/validation/application";
import { Button } from "@/components/ui/Button";
import {
  CheckboxField,
  ChipGroup,
  describedBy,
  ErrorSummary,
  Field,
  flattenErrors,
  Select,
  TextArea,
  TextInput,
} from "./fields";
import { FileUpload } from "./FileUpload";
import { SuccessScreen } from "./SuccessScreen";
import { Turnstile, type TurnstileHandle } from "./Turnstile";
import { useFormMeta } from "./useFormMeta";
import { useHydrated } from "./useHydrated";

type Values = z.input<typeof applicationFields>;
type Output = z.output<typeof applicationFields>;

const DRAFT_KEY = "kk-apply-draft-v1";
const stepNames = ["About you", "Your discipline", "Proof and checks", "Availability"] as const;
const stepKeys = ["step1", "step2", "step3", "step4"] as const;

type Draft = { draftId: string; step: number; values: Values; savedAt: string };

const emptyValues = (mainActivity: string): Values => ({
  step1: { fullName: "", phone: "", email: "", county: "", isAdult: false, heardFrom: "" },
  step2: {
    mainActivity,
    mainActivityOther: "",
    otherActivities: [],
    yearsPractising: "",
    yearsCoaching: "",
    highestRank: "",
    experience: "",
  },
  step3: {
    certificates: [],
    videoUrl: "",
    firstAid: undefined as unknown as "none",
    firstAidFile: undefined,
    goodConduct: undefined as unknown as "current",
    referees: [
      { name: "", phone: "", relationship: "" },
      { name: "", phone: "", relationship: "" },
    ],
  },
  step4: { availability: [], workPreference: undefined as unknown as "Either", counties: [], extraNotes: "" },
  consent: false,
});

function readDraft(): Draft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw) as Draft;
    return d && typeof d.draftId === "string" && d.values ? d : null;
  } catch {
    return null;
  }
}
function writeDraft(d: Draft) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(d));
  } catch {
    // Storage can be full or blocked; the form still works without drafts.
  }
}
function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    // ignore
  }
}

export type OpenRoleOption = { id: string; title: string; activitySlug: string | null };

/** Coach application: four steps, then review (PRD 8.2). */
export function ApplicationForm({
  activities,
  servedCounties,
  allCounties,
  roles,
}: {
  activities: Activity[];
  servedCounties: string[];
  allCounties: string[];
  roles: OpenRoleOption[];
}) {
  const params = useSearchParams();
  const meta = useFormMeta(params);
  const role = roles.find((r) => r.id === params.get("role")) ?? null;
  const preselect = params.get("activity") ?? role?.activitySlug ?? "";
  const initialMain = activities.some((a) => a.slug === preselect) ? preselect : "";

  const [draftId, setDraftId] = useState(() => uuid());
  const [step, setStep] = useState(0); // 0-3 steps, 4 review
  const [direction, setDirection] = useState<1 | -1>(1);
  const [savedDraft, setSavedDraft] = useState<Draft | null>(null);
  const [sentRef, setSentRef] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const turnstile = useRef<TurnstileHandle>(null);
  const honeypot = useRef<HTMLInputElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const started = useRef(false);

  const form = useForm<Values, unknown, Output>({
    resolver: zodResolver(applicationFields),
    mode: "onTouched",
    shouldFocusError: true,
    defaultValues: emptyValues(initialMain),
  });
  const { register, control, watch, trigger, formState, getValues, reset, setError, handleSubmit, getFieldState } = form;
  const attempted = useRef(false);
  const errors = formState.errors;
  const hydrated = useHydrated();

  // Offer a saved draft from this device.
  useEffect(() => {
    const d = readDraft();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reading browser storage after mount
    if (d) setSavedDraft(d);
  }, []);

  // Once a step has been attempted, errors clear as soon as a field is fixed
  // (rather than on blur), so the layout settles before the next tap.
  useEffect(() => {
    const sub = watch((_, { name }) => {
      if (name && attempted.current && getFieldState(name as FieldPath<Values>).invalid) {
        void trigger(name as FieldPath<Values>);
      }
    });
    return () => sub.unsubscribe();
  }, [watch, trigger, getFieldState]);

  // Save text answers on every change (PRD 8.2: kk-apply-draft-v1).
  useEffect(() => {
    const sub = watch((values) => {
      if (savedDraft || sentRef) return;
      writeDraft({ draftId, step, values: values as Values, savedAt: new Date().toISOString() });
    });
    return () => sub.unsubscribe();
  }, [watch, draftId, step, savedDraft, sentRef]);

  const goTo = (next: number) => {
    setDirection(next > step ? 1 : -1);
    setStep(next);
    setShowSummary(false);
    writeDraft({ draftId, step: next, values: getValues(), savedAt: new Date().toISOString() });
    requestAnimationFrame(() => {
      headingRef.current?.focus();
      headingRef.current?.scrollIntoView({ block: "start", behavior: "auto" });
    });
  };

  const next = async () => {
    const key = stepKeys[step];
    const ok = await trigger(key, { shouldFocus: true });
    if (!ok) {
      attempted.current = true;
      setShowSummary(true);
      for (const [field] of flattenErrors(errors)) track("form_error", { form: "apply", field });
      return;
    }
    track("form_step", { form: "apply", step: step + 1 });
    goTo(step + 1);
  };

  const onSubmit = async (values: Output) => {
    setServerError(null);
    let token = "";
    try {
      token = (await turnstile.current?.getToken()) ?? "";
    } catch {
      setServerError(messages.botCheck);
      return;
    }
    try {
      const res = await submitApplication({
        fields: values,
        draftId,
        openRoleId: role?.id,
        meta: {
          idempotencyKey: meta.idempotencyKey,
          source: meta.source,
          utm: meta.utm,
          turnstileToken: token || undefined,
          website: honeypot.current?.value || undefined,
        },
      });
      if (!res.ok) {
        for (const [name, message] of Object.entries(res.fieldErrors ?? {})) {
          setError(name as FieldPath<Values>, { type: "server", message });
        }
        setServerError(res.error);
        return;
      }
      track("form_submit", { form: "apply", activity: values.step2.mainActivity, county: values.step1.county });
      clearDraft();
      setSentRef(res.ref);
    } catch {
      setServerError(messages.network);
    }
  };

  if (sentRef) {
    return (
      <SuccessScreen title="Application received.">
        <p className="type-lead text-text-2">
          Thank you, {firstName(getValues("step1.fullName"))}. Your reference is{" "}
          <strong className="text-text tabular">{sentRef}</strong>. We review every application. If you&apos;re
          shortlisted, we&apos;ll contact you to arrange an interview and a live demonstration.
        </p>
      </SuccessScreen>
    );
  }

  if (savedDraft) {
    return (
      <div role="region" aria-labelledby="draft-title" className="rounded-[24px] border border-hairline bg-paper p-6 lg:p-8">
        <h1 id="draft-title" className="type-h3">
          Welcome back. We saved your answers on this device.
        </h1>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button
            variant="coach"
            onClick={() => {
              setDraftId(savedDraft.draftId);
              reset({ ...emptyValues(initialMain), ...savedDraft.values });
              setStep(Math.min(Math.max(savedDraft.step, 0), 4));
              setSavedDraft(null);
            }}
            cta="draft-continue"
          >
            Continue
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              clearDraft();
              setSavedDraft(null);
            }}
            cta="draft-restart"
          >
            Start again
          </Button>
        </div>
      </div>
    );
  }

  const values = watch();
  const summary = showSummary ? flattenErrors(errors) : [];
  const mainActivity = values.step2.mainActivity;
  const activityName = (slug: string) => activities.find((a) => a.slug === slug)?.name ?? slug;

  return (
    <form
      noValidate
      onSubmit={(e) => void handleSubmit(onSubmit, () => setShowSummary(true))(e)}
      onFocus={() => {
        if (!started.current) {
          started.current = true;
          track("form_start", { form: "apply" });
        }
      }}
      className="pb-28 lg:pb-0"
    >
      <h1 className="type-display-l">Apply to join the team</h1>
      {role && (
        <p className="mt-3 text-text-2">
          Applying for: <strong className="text-text">{role.title}</strong>
        </p>
      )}

      {/* Progress */}
      <div className="mt-8">
        <p className="type-small font-semibold text-text-2" aria-live="polite">
          {step < 4 ? `Step ${step + 1} of 4: ${stepNames[step]}` : "Review your application"}
        </p>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-paper" aria-hidden="true">
          <div
            className="h-full origin-left rounded-full bg-orange-600 transition-transform duration-(--dur-medium) ease-(--ease-out)"
            style={{ transform: `scaleX(${Math.min(step + 1, 4) / 4})` }}
          />
        </div>
      </div>

      <div
        key={step}
        className={cn(
          "mt-10",
          direction === 1
            ? "animate-[kk-step-in_var(--dur-medium)_var(--ease-out)_both]"
            : "animate-[kk-step-back_var(--dur-medium)_var(--ease-out)_both]",
        )}
      >
        <h2 ref={headingRef} tabIndex={-1} className="type-h3 outline-none">
          {step < 4 ? stepNames[step] : "Review"}
        </h2>
        <div className="mt-6">
          <ErrorSummary errors={summary} />
          {serverError && (
            <div role="alert" className="mb-8 rounded-[14px] border border-orange-700 bg-orange-100 p-5 font-semibold text-orange-700">
              {serverError}
            </div>
          )}
        </div>

        {step === 0 && (
          <div className="grid gap-6">
            <Field name="step1.fullName" label="Full name" error={errors.step1?.fullName?.message}>
              <TextInput
                {...register("step1.fullName")}
                {...describedBy("step1.fullName", { error: errors.step1?.fullName?.message })}
                autoComplete="name"
                maxLength={80}
              />
            </Field>
            <div className="grid gap-6 sm:grid-cols-2">
              <Field name="step1.phone" label="Phone" error={errors.step1?.phone?.message}>
                <TextInput
                  {...register("step1.phone")}
                  {...describedBy("step1.phone", { error: errors.step1?.phone?.message })}
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="0722 524 438"
                  maxLength={20}
                />
              </Field>
              <Field name="step1.email" label="Email" error={errors.step1?.email?.message}>
                <TextInput
                  {...register("step1.email")}
                  {...describedBy("step1.email", { error: errors.step1?.email?.message })}
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  maxLength={160}
                />
              </Field>
            </div>
            <Field name="step1.county" label="County where you live" error={errors.step1?.county?.message}>
              <Select {...register("step1.county")} {...describedBy("step1.county", { error: errors.step1?.county?.message })}>
                {allCounties.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </Field>
            <CheckboxField {...register("step1.isAdult")} error={errors.step1?.isAdult?.message} label="I am 18 or older" />
            <Field name="step1.heardFrom" label="How did you hear about us?" optional>
              <TextInput {...register("step1.heardFrom")} {...describedBy("step1.heardFrom", {})} maxLength={80} />
            </Field>
          </div>
        )}

        {step === 1 && (
          <div className="grid gap-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <Field name="step2.mainActivity" label="Main discipline" error={errors.step2?.mainActivity?.message}>
                <Select
                  {...register("step2.mainActivity")}
                  {...describedBy("step2.mainActivity", { error: errors.step2?.mainActivity?.message })}
                >
                  {activities.map((a) => (
                    <option key={a.slug} value={a.slug}>
                      {a.name}
                    </option>
                  ))}
                  <option value={otherValue}>Other</option>
                </Select>
              </Field>
              {mainActivity === otherValue && (
                <Field name="step2.mainActivityOther" label="Main discipline (other)" error={errors.step2?.mainActivityOther?.message}>
                  <TextInput
                    {...register("step2.mainActivityOther")}
                    {...describedBy("step2.mainActivityOther", { error: errors.step2?.mainActivityOther?.message })}
                    maxLength={80}
                  />
                </Field>
              )}
            </div>
            <Controller
              control={control}
              name="step2.otherActivities"
              render={({ field }) => (
                <ChipGroup
                  name="step2.otherActivities"
                  legend="Other disciplines"
                  optional
                  options={activities.filter((a) => a.slug !== mainActivity).map((a) => ({ value: a.slug, label: a.name }))}
                  value={field.value ?? []}
                  onChange={(v) => field.onChange(v)}
                />
              )}
            />
            <div className="grid grid-cols-2 gap-6">
              <Field name="step2.yearsPractising" label="Years practising" error={errors.step2?.yearsPractising?.message}>
                <TextInput
                  {...register("step2.yearsPractising")}
                  {...describedBy("step2.yearsPractising", { error: errors.step2?.yearsPractising?.message })}
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={80}
                />
              </Field>
              <Field name="step2.yearsCoaching" label="Years coaching" error={errors.step2?.yearsCoaching?.message}>
                <TextInput
                  {...register("step2.yearsCoaching")}
                  {...describedBy("step2.yearsCoaching", { error: errors.step2?.yearsCoaching?.message })}
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={80}
                />
              </Field>
            </div>
            <Field
              name="step2.highestRank"
              label="Highest rank, grade or qualification"
              error={errors.step2?.highestRank?.message}
            >
              <TextInput
                {...register("step2.highestRank")}
                {...describedBy("step2.highestRank", { error: errors.step2?.highestRank?.message })}
                placeholder="e.g. 2nd-degree black belt"
                maxLength={120}
              />
            </Field>
            <Field
              name="step2.experience"
              label="Experience coaching young people"
              hint="Where have you coached, which ages, and for how long?"
              error={errors.step2?.experience?.message}
            >
              <TextArea
                {...register("step2.experience")}
                {...describedBy("step2.experience", { error: errors.step2?.experience?.message, hint: true })}
                maxLength={1500}
              />
            </Field>
          </div>
        )}

        {step === 2 && (
          <div className="grid gap-8">
            <Controller
              control={control}
              name="step3.certificates"
              render={({ field }) => (
                <FileUpload
                  name="step3.certificates"
                  label="Certificates"
                  optional
                  multiple
                  max={MAX_CERTIFICATES}
                  draftId={draftId}
                  value={field.value ?? []}
                  onChange={field.onChange}
                  turnstile={turnstile}
                  error={errors.step3?.certificates?.message}
                />
              )}
            />
            <Field
              name="step3.videoUrl"
              label="Link to a short video of you coaching"
              optional
              error={errors.step3?.videoUrl?.message}
            >
              <TextInput
                {...register("step3.videoUrl")}
                {...describedBy("step3.videoUrl", { error: errors.step3?.videoUrl?.message })}
                type="url"
                inputMode="url"
                placeholder="https://"
                maxLength={500}
              />
            </Field>
            <Controller
              control={control}
              name="step3.firstAid"
              render={({ field }) => (
                <ChipGroup
                  name="step3.firstAid"
                  legend="First aid certificate"
                  type="radio"
                  options={firstAidOptions.map((o) => ({ value: o.value, label: o.label }))}
                  value={field.value}
                  onChange={(v) => field.onChange(v)}
                  onBlur={field.onBlur}
                  error={errors.step3?.firstAid?.message}
                />
              )}
            />
            {values.step3.firstAid === "current" && (
              <Controller
                control={control}
                name="step3.firstAidFile"
                render={({ field }) => (
                  <FileUpload
                    name="step3.firstAidFile"
                    label="Upload your first aid certificate"
                    optional
                    max={1}
                    draftId={draftId}
                    value={field.value ? [field.value] : []}
                    onChange={(files) => field.onChange(files[0])}
                    turnstile={turnstile}
                  />
                )}
              />
            )}
            <Controller
              control={control}
              name="step3.goodConduct"
              render={({ field }) => (
                <ChipGroup
                  name="step3.goodConduct"
                  legend="Certificate of Good Conduct"
                  type="radio"
                  options={goodConductOptions.map((o) => ({ value: o.value, label: o.label }))}
                  value={field.value}
                  onChange={(v) => field.onChange(v)}
                  onBlur={field.onBlur}
                  error={errors.step3?.goodConduct?.message}
                />
              )}
            />
            {[0, 1].map((i) => (
              <fieldset key={i} className="grid gap-4 rounded-[24px] border border-hairline p-5">
                <legend className="px-1 text-[16px] font-semibold">
                  Referee {i + 1} <span className="font-normal text-text-2">(optional)</span>
                </legend>
                <Field name={`step3.referees.${i}.name`} label="Name" error={errors.step3?.referees?.[i]?.name?.message}>
                  <TextInput
                    {...register(`step3.referees.${i}.name`)}
                    {...describedBy(`step3.referees.${i}.name`, { error: errors.step3?.referees?.[i]?.name?.message })}
                    maxLength={80}
                  />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field name={`step3.referees.${i}.phone`} label="Phone" error={errors.step3?.referees?.[i]?.phone?.message}>
                    <TextInput
                      {...register(`step3.referees.${i}.phone`)}
                      {...describedBy(`step3.referees.${i}.phone`, { error: errors.step3?.referees?.[i]?.phone?.message })}
                      type="tel"
                      inputMode="tel"
                      maxLength={20}
                    />
                  </Field>
                  <Field name={`step3.referees.${i}.relationship`} label="Relationship">
                    <TextInput
                      {...register(`step3.referees.${i}.relationship`)}
                      {...describedBy(`step3.referees.${i}.relationship`, {})}
                      maxLength={80}
                    />
                  </Field>
                </div>
              </fieldset>
            ))}
          </div>
        )}

        {step === 3 && (
          <div className="grid gap-8">
            <Controller
              control={control}
              name="step4.availability"
              render={({ field }) => (
                <ChipGroup
                  name="step4.availability"
                  legend="When you can work"
                  options={availabilityOptions.map((o) => ({ value: o, label: o }))}
                  value={field.value}
                  onChange={(v) => field.onChange(v)}
                  onBlur={field.onBlur}
                  error={errors.step4?.availability?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="step4.workPreference"
              render={({ field }) => (
                <ChipGroup
                  name="step4.workPreference"
                  legend="Work preference"
                  type="radio"
                  options={workPreferences.map((o) => ({ value: o, label: o }))}
                  value={field.value}
                  onChange={(v) => field.onChange(v)}
                  onBlur={field.onBlur}
                  error={errors.step4?.workPreference?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="step4.counties"
              render={({ field }) => (
                <ChipGroup
                  name="step4.counties"
                  legend="Counties you can work in"
                  options={servedCounties.map((c) => ({ value: c, label: c }))}
                  value={field.value}
                  onChange={(v) => field.onChange(v)}
                  onBlur={field.onBlur}
                  error={errors.step4?.counties?.message}
                />
              )}
            />
            <Field name="step4.extraNotes" label="Anything else" optional error={errors.step4?.extraNotes?.message}>
              <TextArea
                {...register("step4.extraNotes")}
                {...describedBy("step4.extraNotes", { error: errors.step4?.extraNotes?.message })}
                maxLength={1000}
              />
            </Field>
          </div>
        )}

        {step === 4 && (
          <div className="grid gap-4">
            <ReviewCard title="About you" onEdit={() => goTo(0)}>
              <Row label="Full name" value={values.step1.fullName} />
              <Row label="Phone" value={values.step1.phone ? formatLocalPhone(normaliseKenyanPhone(values.step1.phone) ?? values.step1.phone) : ""} />
              <Row label="Email" value={values.step1.email} />
              <Row label="County" value={values.step1.county} />
              <Row label="How you heard" value={values.step1.heardFrom} />
            </ReviewCard>
            <ReviewCard title="Your discipline" onEdit={() => goTo(1)}>
              <Row
                label="Main discipline"
                value={mainActivity === otherValue ? values.step2.mainActivityOther : activityName(mainActivity)}
              />
              <Row label="Other disciplines" value={(values.step2.otherActivities ?? []).map(activityName).join(", ")} />
              <Row label="Years practising" value={String(values.step2.yearsPractising ?? "")} />
              <Row label="Years coaching" value={String(values.step2.yearsCoaching ?? "")} />
              <Row label="Highest rank" value={values.step2.highestRank} />
              <Row label="Experience" value={values.step2.experience} />
            </ReviewCard>
            <ReviewCard title="Proof and checks" onEdit={() => goTo(2)}>
              <Row label="Certificates" value={(values.step3.certificates ?? []).map((f) => f.name).join(", ") || "None"} />
              <Row label="Video" value={values.step3.videoUrl} />
              <Row
                label="First aid"
                value={[
                  firstAidOptions.find((o) => o.value === values.step3.firstAid)?.label,
                  values.step3.firstAidFile?.name,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              />
              <Row label="Good Conduct" value={goodConductOptions.find((o) => o.value === values.step3.goodConduct)?.label} />
              <Row
                label="Referees"
                value={(values.step3.referees ?? [])
                  .filter((r) => r.name)
                  .map((r) => [r.name, r.relationship].filter(Boolean).join(", "))
                  .join("; ") || "None"}
              />
            </ReviewCard>
            <ReviewCard title="Availability" onEdit={() => goTo(3)}>
              <Row label="When" value={(values.step4.availability ?? []).join(", ")} />
              <Row label="Preference" value={values.step4.workPreference} />
              <Row label="Counties" value={(values.step4.counties ?? []).join(", ")} />
              <Row label="Anything else" value={values.step4.extraNotes} />
            </ReviewCard>
            <div className="mt-4">
              <CheckboxField
                {...register("consent")}
                error={errors.consent?.message}
                label={
                  <>
                    I confirm this information is true. I agree that KK Fit Hub may store my application and documents,
                    and verify them with the referees and authorities I&apos;ve named, as described in the{" "}
                    <Link href="/privacy" className="font-semibold text-green-700 underline" target="_blank">
                      Privacy notice
                    </Link>
                    .
                  </>
                }
              />
            </div>
            <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
              <label htmlFor="apply-website">Website</label>
              <input ref={honeypot} id="apply-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
            </div>
          </div>
        )}
      </div>

      <Turnstile ref={turnstile} />

      {/* Back and Continue stay fixed at the bottom on mobile (PRD 8.2). */}
      <div
        data-theme="light"
        data-apply-bar
        className="glass fixed inset-x-0 bottom-0 z-30 flex gap-3 border-t border-hairline border-b-0! px-(--gutter) pt-3 pb-[max(12px,env(safe-area-inset-bottom))] lg:static lg:mt-10 lg:border-0 lg:bg-transparent! lg:p-0 lg:backdrop-blur-none"
      >
        {step > 0 && (
          <Button variant="secondary" onClick={() => goTo(step - 1)} className="flex-1 lg:flex-none" cta="apply-back">
            Back
          </Button>
        )}
        {step < 4 ? (
          <Button variant="coach" onClick={next} holdFocus className="flex-1 lg:flex-none" cta="apply-continue">
            Continue
          </Button>
        ) : (
          <Button
            type="submit"
            variant="coach"
            className="flex-1 lg:flex-none"
            disabled={!hydrated || formState.isSubmitting}
            aria-busy={formState.isSubmitting}
            cta="apply-submit"
          >
            {formState.isSubmitting && <Loader2 aria-hidden="true" size={20} className="animate-spin" />}
            Submit application
          </Button>
        )}
      </div>
    </form>
  );
}

function ReviewCard({ title, onEdit, children }: { title: string; onEdit: () => void; children: React.ReactNode }) {
  return (
    <section className="rounded-[24px] border border-hairline bg-paper p-5 lg:p-6" aria-label={title}>
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-[19px] font-semibold">{title}</h3>
        <button
          type="button"
          onClick={onEdit}
          className="min-h-11 px-2 font-semibold text-orange-700 underline-offset-4 hover:underline"
          aria-label={`Edit ${title}`}
        >
          Edit
        </button>
      </div>
      <dl className="mt-3 grid gap-2">{children}</dl>
    </section>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="grid gap-1 sm:grid-cols-[160px_1fr]">
      <dt className="text-text-2">{label}</dt>
      <dd className="break-words whitespace-pre-line">{value}</dd>
    </div>
  );
}
