"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { sendContact } from "@/actions/public";
import { track } from "@/lib/analytics";
import { messages } from "@/lib/validation/common";
import { contactFields, contactKinds, type ContactFields } from "@/lib/validation/contact";
import { Button } from "@/components/ui/Button";
import {
  CheckboxField,
  ChipGroup,
  describedBy,
  ErrorSummary,
  Field,
  flattenErrors,
  TextArea,
  TextInput,
} from "./fields";
import { SuccessScreen } from "./SuccessScreen";
import { Turnstile, type TurnstileHandle } from "./Turnstile";
import { useFormMeta } from "./useFormMeta";
import { useHydrated } from "./useHydrated";

/** Contact form (PRD 8.3): creates an inquiry of type `general`. */
export function ContactForm({ responseTime }: { responseTime: string }) {
  const params = useSearchParams();
  const meta = useFormMeta(params);
  const turnstile = useRef<TurnstileHandle>(null);
  const honeypot = useRef<HTMLInputElement>(null);
  const started = useRef(false);
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(false);

  const { register, handleSubmit, control, formState, setError } = useForm<ContactFields>({
    resolver: zodResolver(contactFields),
    mode: "onTouched",
    defaultValues: { name: "", phone: "", email: "", kind: "", message: "", consent: false },
  });
  const errors = formState.errors;
  const hydrated = useHydrated();

  if (sent) {
    return (
      <SuccessScreen title="Message sent.">
        {/* CONFIRM: response time (from settings). */}
        <p className="type-lead text-text-2">We&apos;ll get back to you within {responseTime}.</p>
      </SuccessScreen>
    );
  }

  const onValid = async (values: ContactFields) => {
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
      const res = await sendContact({
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
        for (const [name, message] of Object.entries(res.fieldErrors ?? {})) {
          setError(name as keyof ContactFields, { type: "server", message });
        }
        if (res.fieldErrors) setShowSummary(true);
        setServerError(res.error);
        return;
      }
      track("form_submit", { form: "contact" });
      setSent(true);
    } catch {
      setServerError(messages.network);
    }
  };

  const summary = showSummary ? flattenErrors(errors) : [];

  return (
    <form
      noValidate
      aria-label="Send a message"
      onSubmit={(e) =>
        void handleSubmit(onValid, (errs) => {
          setShowSummary(true);
          for (const [field] of flattenErrors(errs)) track("form_error", { form: "contact", field });
        })(e)
      }
      onFocus={() => {
        if (!started.current) {
          started.current = true;
          track("form_start", { form: "contact" });
        }
      }}
    >
      <ErrorSummary errors={summary} />
      {serverError && summary.length === 0 && (
        <div role="alert" className="mb-8 rounded-[14px] border border-orange-700 bg-orange-100 p-5 font-semibold text-orange-700">
          {serverError}
        </div>
      )}
      <div className="grid gap-6">
        <Field name="name" label="Name" error={errors.name?.message}>
          <TextInput {...register("name")} {...describedBy("name", { error: errors.name?.message })} autoComplete="name" maxLength={80} />
        </Field>
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
          name="kind"
          render={({ field }) => (
            <ChipGroup
              name="kind"
              legend="I am a…"
              type="radio"
              options={contactKinds.map((k) => ({ value: k, label: k }))}
              value={field.value}
              onChange={(v) => field.onChange(v)}
              onBlur={field.onBlur}
              error={errors.kind?.message}
            />
          )}
        />
        <Field name="message" label="Message" error={errors.message?.message}>
          <TextArea {...register("message")} {...describedBy("message", { error: errors.message?.message })} maxLength={1500} />
        </Field>
        <CheckboxField
          {...register("consent")}
          error={errors.consent?.message}
          label={
            <>
              I agree that KK Fit Hub may contact me about this message and store my details as described in the{" "}
              <Link href="/privacy" className="font-semibold text-green-700 underline" target="_blank">
                Privacy notice
              </Link>
              .
            </>
          }
        />
        <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
          <label htmlFor="contact-website">Website</label>
          <input ref={honeypot} id="contact-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
        </div>
      </div>
      <Turnstile ref={turnstile} />
      <Button
        type="submit"
        size="lg"
        className="mt-8 w-full sm:w-auto"
        disabled={!hydrated || formState.isSubmitting}
        aria-busy={formState.isSubmitting}
        cta="contact-submit"
      >
        {formState.isSubmitting && <Loader2 aria-hidden="true" size={20} className="animate-spin" />}
        Send message
      </Button>
    </form>
  );
}
