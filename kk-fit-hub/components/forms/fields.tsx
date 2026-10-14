"use client";

import { AlertCircle, Check } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { forwardRef, useId } from "react";
import { cn } from "@/lib/cn";

/**
 * Form controls (PRD 8.5, 10.7): labels above inputs, 52px tall, 16px+ text,
 * errors in --orange-700 with an icon and linked to the field.
 */

export const inputClass =
  "block w-full min-h-[52px] rounded-[14px] border border-input-border bg-paper px-4 text-[17px] text-text " +
  "placeholder:text-text-3 focus:border-green-600 focus:outline-2 focus:outline-offset-0 focus:outline-green-600 " +
  "aria-invalid:border-orange-700 disabled:opacity-60";

export function fieldIds(name: string) {
  const safe = name.replace(/[^a-zA-Z0-9_-]/g, "-");
  return { input: `f-${safe}`, error: `f-${safe}-error`, hint: `f-${safe}-hint` };
}

export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-2 flex items-start gap-1.5 text-[15px] font-medium text-orange-700">
      <AlertCircle aria-hidden="true" size={18} strokeWidth={1.75} className="mt-px shrink-0" />
      {message}
    </p>
  );
}

export function Field({
  name,
  label,
  optional,
  hint,
  error,
  children,
  className,
}: {
  name: string;
  label: ReactNode;
  optional?: boolean;
  hint?: ReactNode;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  const ids = fieldIds(name);
  return (
    <div className={cn("flex flex-col", className)}>
      <label htmlFor={ids.input} className="mb-2 text-[16px] font-semibold text-text">
        {label}
        {optional && <span className="font-normal text-text-2"> (optional)</span>}
      </label>
      {hint && (
        <p id={ids.hint} className="-mt-1 mb-2 text-[15px] text-text-2">
          {hint}
        </p>
      )}
      {children}
      <FieldError id={ids.error} message={error} />
    </div>
  );
}

/** aria wiring for an input inside <Field>. */
export function describedBy(name: string, opts: { error?: string; hint?: boolean }) {
  const ids = fieldIds(name);
  return {
    id: ids.input,
    "aria-invalid": opts.error ? true : undefined,
    "aria-describedby": [opts.hint ? ids.hint : null, opts.error ? ids.error : null].filter(Boolean).join(" ") || undefined,
  } as const;
}

export const TextInput = forwardRef<HTMLInputElement, ComponentProps<"input">>(function TextInput(
  { className, ...props },
  ref,
) {
  return <input ref={ref} className={cn(inputClass, className)} {...props} />;
});

export const TextArea = forwardRef<HTMLTextAreaElement, ComponentProps<"textarea">>(function TextArea(
  { className, ...props },
  ref,
) {
  return <textarea ref={ref} className={cn(inputClass, "min-h-36 py-3 leading-normal", className)} {...props} />;
});

export const Select = forwardRef<HTMLSelectElement, ComponentProps<"select"> & { placeholder?: string }>(
  function Select({ className, children, placeholder = "Choose…", ...props }, ref) {
    return (
      <select
        ref={ref}
        className={cn(
          inputClass,
          "appearance-none bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%23424245' stroke-width='1.5'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")] bg-[right_14px_center] bg-no-repeat pr-11",
          className,
        )}
        {...props}
      >
        <option value="">{placeholder}</option>
        {children}
      </select>
    );
  },
);

/**
 * Chips: real checkboxes or radios underneath, fully keyboard accessible
 * (PRD 8.5). Rendered inside a fieldset with a legend.
 */
export function ChipGroup({
  name,
  legend,
  optional,
  hint,
  error,
  type = "checkbox",
  options,
  value,
  onChange,
  onBlur,
  className,
}: {
  name: string;
  legend: ReactNode;
  optional?: boolean;
  hint?: ReactNode;
  error?: string;
  type?: "checkbox" | "radio";
  options: { value: string; label: ReactNode; badge?: ReactNode }[];
  value: string[] | string | undefined;
  onChange: (next: string[] | string) => void;
  onBlur?: () => void;
  className?: string;
}) {
  const ids = fieldIds(name);
  const groupId = useId();
  const selected = Array.isArray(value) ? value : value ? [value] : [];
  const toggle = (v: string) => {
    if (type === "radio") onChange(v);
    else onChange(selected.includes(v) ? selected.filter((s) => s !== v) : [...selected, v]);
  };
  return (
    <fieldset
      id={ids.input}
      tabIndex={-1}
      className={cn("min-w-0", className)}
      aria-describedby={[hint ? ids.hint : null, error ? ids.error : null].filter(Boolean).join(" ") || undefined}
    >
      <legend className="mb-2 text-[16px] font-semibold text-text">
        {legend}
        {optional && <span className="font-normal text-text-2"> (optional)</span>}
      </legend>
      {hint && (
        <p id={ids.hint} className="-mt-1 mb-3 text-[15px] text-text-2">
          {hint}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const checked = selected.includes(o.value);
          return (
            <label key={o.value} className="relative">
              <input
                type={type}
                name={`${groupId}-${name}`}
                value={o.value}
                checked={checked}
                onChange={() => toggle(o.value)}
                onBlur={onBlur}
                aria-invalid={error ? true : undefined}
                className="peer absolute inset-0 size-full cursor-pointer opacity-0"
              />
              <span
                className={cn(
                  "press pointer-events-none inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-[16px] font-medium",
                  "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-green-600",
                  checked ? "border-green-600 bg-green-600 text-white" : "border-input-border bg-paper text-text",
                )}
              >
                {checked && <Check aria-hidden="true" size={16} strokeWidth={2} />}
                {o.label}
                {o.badge}
              </span>
            </label>
          );
        })}
      </div>
      <FieldError id={ids.error} message={error} />
    </fieldset>
  );
}

export const CheckboxField = forwardRef<
  HTMLInputElement,
  Omit<ComponentProps<"input">, "type"> & { label: ReactNode; error?: string; name: string }
>(function CheckboxField({ label, error, name, ...props }, ref) {
  const ids = fieldIds(name);
  return (
    <div>
      <label htmlFor={ids.input} className="flex cursor-pointer items-start gap-3 text-[16px] leading-snug text-text">
        <input
          ref={ref}
          type="checkbox"
          id={ids.input}
          name={name}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? ids.error : undefined}
          className="mt-0.5 size-6 shrink-0 cursor-pointer rounded-md accent-green-600"
          {...props}
        />
        <span>{label}</span>
      </label>
      <FieldError id={ids.error} message={error} />
    </div>
  );
});

/** Error summary shown at the top on submit, linking to each field (PRD 8.5). */
export function ErrorSummary({ errors, title = "Please check the following:" }: { errors: [string, string][]; title?: string }) {
  if (errors.length === 0) return null;
  return (
    <div role="alert" className="mb-8 rounded-[14px] border border-orange-700 bg-orange-100 p-5" tabIndex={-1} data-error-summary>
      <p className="font-semibold text-orange-700">{title}</p>
      <ul className="mt-2 list-disc pl-5 text-text">
        {errors.map(([name, message]) => (
          <li key={name}>
            <a
              href={`#${fieldIds(name).input}`}
              className="underline"
              onClick={(e) => {
                e.preventDefault();
                const el = document.getElementById(fieldIds(name).input);
                el?.focus();
                el?.scrollIntoView({ block: "center" });
              }}
            >
              {message}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Flattens react-hook-form errors to [dotted.name, message] pairs. */
export function flattenErrors(errors: object, prefix = ""): [string, string][] {
  const out: [string, string][] = [];
  for (const [key, value] of Object.entries(errors)) {
    if (!value || typeof value !== "object") continue;
    const path = prefix ? `${prefix}.${key}` : key;
    const v = value as { message?: unknown; ref?: unknown; type?: unknown };
    if (typeof v.message === "string" && (v.type !== undefined || v.ref !== undefined)) out.push([path, v.message]);
    else out.push(...flattenErrors(value as object, path));
  }
  return out;
}
