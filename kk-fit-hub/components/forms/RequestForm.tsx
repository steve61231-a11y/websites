"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import type { Activity } from "@/content/activities";
import { firstName, whatsappMessages } from "@/content/whatsapp";
import { addInquiryDetails, submitInquiry } from "@/actions/public";
import { track } from "@/lib/analytics";
import { whatsappHref } from "@/lib/phone";
import { messages, otherValue } from "@/lib/validation/common";
import {
  contactPrefs,
  contactRoles,
  dayOptions,
  gradeOptions,
  institutionTypes,
  learnerBands,
  requestStep1,
  requestStep2,
  sectors,
  timeOptions,
  type RequestStep1,
  type RequestStep2,
} from "@/lib/validation/request";
import { Button, ButtonLink } from "@/components/ui/Button";
import { WhatsAppIcon } from "@/components/site/icons";
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
import { SuccessScreen } from "./SuccessScreen";
import { Turnstile, type TurnstileHandle } from "./Turnstile";
import { useFormMeta } from "./useFormMeta";
import { useHydrated } from "./useHydrated";

type Props = {
  activities: Activity[];
  counties: string[];
  whatsappE164: string;
  responseTimeText: string;
  startTermOptions: string[];
};

type Sent = { ref: string; name: string; school: string; activityNames: string; county: string };

/** Demonstration request (two steps) and register-interest mode (PRD 8.1). */
export function RequestForm(props: Props) {
  const params = useSearchParams();
  const interest = params.get("type") === "interest";
  const preselect = params.get("activity");
  const meta = useFormMeta(params);
  const [sent, setSent] = useState<Sent | null>(null);
  const [stage, setStage] = useState<"form" | "success" | "details" | "saved">("form");
  const formKind = interest ? "interest" : "request";

  const known = props.activities.map((a) => a.slug);
  const initialActivities = preselect && known.includes(preselect) ? [preselect] : [];

  if (stage === "form" || !sent) {
    return (
      <Step1
        {...props}
        interest={interest}
        formKind={formKind}
        initialActivities={initialActivities}
        meta={meta}
        onSent={(s) => {
          setSent(s);
          setStage("success");
        }}
      />
    );
  }

  const first = firstName(sent.name);
  const wa = whatsappHref(props.whatsappE164, whatsappMessages.afterRequest(sent.school, sent.ref));

  if (stage === "details") {
    return (
      <Step2
        refCode={sent.ref}
        idempotencyKey={meta.idempotencyKey}
        startTermOptions={props.startTermOptions}
        onSaved={() => setStage("saved")}
        onCancel={() => setStage("success")}
      />
    );
  }

  if (stage === "saved") {
    return (
      <SuccessScreen title="Details saved.">
        <p className="type-lead text-text-2">We&apos;ll be in touch soon.</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <ButtonLink href={wa} variant="secondary" size="lg" cta="success-whatsapp">
            <WhatsAppIcon size={20} /> WhatsApp us your reference
          </ButtonLink>
          <ButtonLink href="/" size="lg" cta="success-home">
            Back to home
          </ButtonLink>
        </div>
      </SuccessScreen>
    );
  }

  return (
    <SuccessScreen title={interest ? "Interest registered." : "Request received."} knot={!interest}>
      {interest ? (
        <p className="type-lead text-text-2">
          Thank you, {first}. We&apos;ll contact {sent.school} first when {sent.activityNames} launches. Your reference
          is <strong className="text-text tabular">{sent.ref}</strong>.
        </p>
      ) : (
        <p className="type-lead text-text-2">
          Thank you, {first}. Your reference is <strong className="text-text tabular">{sent.ref}</strong>.
          Kennedy&apos;s team will contact you within {props.responseTimeText} to arrange the next step.
          {/* CONFIRM: response time (from settings). */}
        </p>
      )}
      <div className="mt-8 rounded-[24px] border border-hairline bg-paper p-6">
        <p className="text-[19px] font-semibold">Help us prepare (optional, 1 minute)</p>
        <Button className="mt-4" variant="primary" onClick={() => setStage("details")} cta="success-details">
          Add details (1 minute)
        </Button>
      </div>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <ButtonLink href={wa} variant="secondary" size="lg" cta="success-whatsapp">
          <WhatsAppIcon size={20} /> WhatsApp us your reference
        </ButtonLink>
        <ButtonLink href="/" variant="secondary" size="lg" cta="success-home">
          Back to home
        </ButtonLink>
      </div>
    </SuccessScreen>
  );
}

function Step1({
  activities,
  counties,
  interest,
  formKind,
  initialActivities,
  meta,
  onSent,
}: Props & {
  interest: boolean;
  formKind: string;
  initialActivities: string[];
  meta: ReturnType<typeof useFormMeta>;
  onSent: (s: Sent) => void;
}) {
  const turnstile = useRef<TurnstileHandle>(null);
  const honeypot = useRef<HTMLInputElement>(null);
  const started = useRef(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(false);

  const form = useForm<RequestStep1>({
    resolver: zodResolver(requestStep1),
    mode: "onTouched",
    shouldFocusError: true,
    defaultValues: {
      name: "",
      role: "",
      roleOther: "",
      school: "",
      county: "",
      countyOther: "",
      phone: "",
      email: "",
      activities: initialActivities,
      consent: false,
    },
  });
  const { register, handleSubmit, control, watch, formState, setError } = form;
  const errors = formState.errors;
  const hydrated = useHydrated();
  const role = watch("role");
  const county = watch("county");

  const onFirstFocus = () => {
    if (started.current) return;
    started.current = true;
    track("form_start", { form: formKind });
  };

  const onValid = async (values: RequestStep1) => {
    setServerError(null);
    setShowSummary(false);
    let token = "";
    try {
      token = (await turnstile.current?.getToken()) ?? "";
    } catch {
      setServerError(messages.botCheck);
      return;
    }
    try {
      const res = await submitInquiry({
        type: interest ? "interest" : "demo",
        fields: values,
        meta: {
          idempotencyKey: meta.idempotencyKey,
          source: meta.source,
          utm: meta.utm,
          turnstileToken: token || undefined,
          website: honeypot.current?.value || undefined,
        },
      });
      if (!res.ok) {
        if (res.fieldErrors) {
          for (const [name, message] of Object.entries(res.fieldErrors)) {
            setError(name as keyof RequestStep1, { type: "server", message });
          }
          setShowSummary(true);
        }
        setServerError(res.error);
        track("form_error", { form: formKind, field: "server" });
        return;
      }
      const chosen = activities.filter((a) => values.activities.includes(a.slug));
      track("form_submit", {
        form: formKind,
        activity: values.activities.join(","),
        county: values.county === otherValue ? "Other" : values.county,
      });
      onSent({
        ref: res.ref,
        name: values.name,
        school: values.school,
        activityNames: chosen.map((a) => a.name).join(" and ") || "it",
        county: values.county,
      });
    } catch {
      setServerError(messages.network);
    }
  };

  const onInvalid = (errs: object) => {
    setShowSummary(true);
    for (const [field] of flattenErrors(errs)) track("form_error", { form: formKind, field });
  };

  const summary = showSummary ? flattenErrors(errors) : [];

  return (
    <form noValidate onSubmit={(e) => void handleSubmit(onValid, onInvalid)(e)} onFocus={onFirstFocus} aria-labelledby="request-title">
      <h1 id="request-title" className="type-display-l">
        {interest ? "Register your school's interest" : "Request a demonstration"}
      </h1>
      <p className="type-lead mt-4 mb-10 text-text-2">
        {interest
          ? "Register your school's interest and we'll contact you first."
          : "Tell us about your learners. We'll bring the demonstration."}
      </p>

      <ErrorSummary errors={summary} />
      {serverError && summary.length === 0 && (
        <div role="alert" className="mb-8 rounded-[14px] border border-orange-700 bg-orange-100 p-5 font-semibold text-orange-700">
          {serverError}
        </div>
      )}

      <div className="grid gap-6">
        <Field name="name" label="Your name" error={errors.name?.message}>
          <TextInput
            {...register("name")}
            {...describedBy("name", { error: errors.name?.message })}
            autoComplete="name"
            maxLength={80}
          />
        </Field>

        <div className="grid gap-6 sm:grid-cols-2">
          <Field name="role" label="Your role" error={errors.role?.message}>
            <Select {...register("role")} {...describedBy("role", { error: errors.role?.message })} autoComplete="organization-title">
              {contactRoles.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Select>
          </Field>
          {role === otherValue && (
            <Field name="roleOther" label="Your role (other)" error={errors.roleOther?.message}>
              <TextInput
                {...register("roleOther")}
                {...describedBy("roleOther", { error: errors.roleOther?.message })}
                maxLength={80}
              />
            </Field>
          )}
        </div>

        <Field name="school" label="School or institution" error={errors.school?.message}>
          <TextInput
            {...register("school")}
            {...describedBy("school", { error: errors.school?.message })}
            autoComplete="organization"
            maxLength={120}
          />
        </Field>

        <div className="grid gap-6 sm:grid-cols-2">
          <Field name="county" label="County" error={errors.county?.message}>
            <Select {...register("county")} {...describedBy("county", { error: errors.county?.message })}>
              {counties.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
              <option value={otherValue}>Other</option>
            </Select>
          </Field>
          {county === otherValue && (
            <Field name="countyOther" label="County (other)" error={errors.countyOther?.message}>
              <TextInput
                {...register("countyOther")}
                {...describedBy("countyOther", { error: errors.countyOther?.message })}
                maxLength={80}
              />
            </Field>
          )}
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <Field name="phone" label="Phone" error={errors.phone?.message}>
            <TextInput
              {...register("phone")}
              {...describedBy("phone", { error: errors.phone?.message })}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="0722 524 438"
              maxLength={20}
            />
          </Field>
          <Field name="email" label="Email" optional error={errors.email?.message}>
            <TextInput
              {...register("email")}
              {...describedBy("email", { error: errors.email?.message })}
              type="email"
              inputMode="email"
              autoComplete="email"
              maxLength={160}
            />
          </Field>
        </div>

        <Controller
          control={control}
          name="activities"
          render={({ field }) => (
            <ChipGroup
              name="activities"
              legend="Activities"
              error={errors.activities?.message}
              options={activities.map((a) => ({
                value: a.slug,
                label: a.name,
                badge:
                  a.status === "available" ? (
                    <span className="text-[13px] font-semibold opacity-80">· Available now</span>
                  ) : undefined,
              }))}
              value={field.value}
              onChange={(v) => field.onChange(v)}
              onBlur={field.onBlur}
            />
          )}
        />

        <CheckboxField
          {...register("consent")}
          error={errors.consent?.message}
          label={
            <>
              I agree that KK Fit Hub may contact me about this request and store my details as described in the{" "}
              <Link href="/privacy" className="font-semibold text-green-700 underline" target="_blank">
                Privacy notice
              </Link>
              .
            </>
          }
        />

        {/* Honeypot: hidden from people, tempting to bots. */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
          <label htmlFor="website">Website</label>
          <input ref={honeypot} id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
        </div>
      </div>

      <Turnstile ref={turnstile} />

      <Button
        type="submit"
        size="lg"
        className="mt-10 w-full sm:w-auto"
        disabled={!hydrated || formState.isSubmitting}
        aria-busy={formState.isSubmitting}
        cta={interest ? "interest-submit" : "request-submit"}
      >
        {formState.isSubmitting && <Loader2 aria-hidden="true" size={20} className="animate-spin" />}
        {interest ? "Register interest" : "Send request"}
      </Button>
    </form>
  );
}

function Step2({
  refCode,
  idempotencyKey,
  startTermOptions,
  onSaved,
  onCancel,
}: {
  refCode: string;
  idempotencyKey: string;
  startTermOptions: string[];
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const { register, handleSubmit, control, formState } = useForm<RequestStep2>({
    resolver: zodResolver(requestStep2),
    mode: "onTouched",
    defaultValues: { grades: [], preferredDays: [], message: "" },
  });
  const errors = formState.errors;
  const hydrated = useHydrated();

  const onValid = async (values: RequestStep2) => {
    setServerError(null);
    try {
      const res = await addInquiryDetails({ ref: refCode, idempotencyKey, fields: values });
      if (!res.ok) {
        setServerError(res.error);
        return;
      }
      track("request_details_added");
      onSaved();
    } catch {
      setServerError(messages.network);
    }
  };

  const radios = (name: keyof RequestStep2, legend: string, options: readonly string[]) => (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <ChipGroup
          name={name}
          legend={legend}
          optional
          type="radio"
          options={options.map((o) => ({ value: o, label: o }))}
          value={field.value as string | undefined}
          onChange={(v) => field.onChange(v)}
          error={errors[name]?.message as string | undefined}
        />
      )}
    />
  );
  const checks = (name: "grades" | "preferredDays", legend: string, options: readonly string[]) => (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <ChipGroup
          name={name}
          legend={legend}
          optional
          options={options.map((o) => ({ value: o, label: o }))}
          value={field.value}
          onChange={(v) => field.onChange(v)}
        />
      )}
    />
  );

  return (
    <form noValidate onSubmit={(e) => void handleSubmit(onValid)(e)} aria-labelledby="details-title" className="animate-[kk-fade_var(--dur-medium)_var(--ease-out)_both]">
      <h2 id="details-title" className="type-display-l">
        Help us prepare
      </h2>
      <p className="type-lead mt-4 mb-10 text-text-2">
        Optional, about a minute. Reference <span className="font-semibold text-text tabular">{refCode}</span>.
      </p>
      {serverError && (
        <div role="alert" className="mb-8 rounded-[14px] border border-orange-700 bg-orange-100 p-5 font-semibold text-orange-700">
          {serverError}
        </div>
      )}
      <div className="grid gap-8">
        {radios("institutionType", "Type of institution", institutionTypes)}
        {radios("sector", "Sector", sectors)}
        {radios("learnersBand", "Learners likely to take part", learnerBands)}
        {checks("grades", "Grades", gradeOptions)}
        {checks("preferredDays", "Preferred days", dayOptions)}
        {radios("preferredTime", "Preferred time", timeOptions)}
        {radios("startTerm", "When to start", startTermOptions)}
        {radios("contactPref", "Best way to reach you", contactPrefs)}
        <Field name="message" label="Anything else" optional error={errors.message?.message}>
          <TextArea {...register("message")} {...describedBy("message", { error: errors.message?.message })} maxLength={1000} />
        </Field>
      </div>
      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <Button type="submit" size="lg" disabled={!hydrated || formState.isSubmitting} aria-busy={formState.isSubmitting} cta="details-submit">
          {formState.isSubmitting && <Loader2 aria-hidden="true" size={20} className="animate-spin" />}
          Save details
        </Button>
        <Button variant="secondary" size="lg" onClick={onCancel} cta="details-back">
          Back
        </Button>
      </div>
    </form>
  );
}
