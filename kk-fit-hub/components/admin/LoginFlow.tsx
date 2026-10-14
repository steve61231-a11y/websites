"use client";

import { Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { signIn, startEnrol, verifyCode, type SignInResult } from "@/actions/auth";
import { Button } from "@/components/ui/Button";
import { Field, TextInput } from "@/components/forms/fields";

type Stage = { kind: "password" } | { kind: "mfa" } | { kind: "enrol"; factorId?: string; qr?: string; secret?: string };

const errorCopy: Record<string, string> = {
  "not-staff": "This account doesn't have access to the admin. Ask the owner for an invite.",
};

/** Sign in: email and password, then the authenticator code (PRD 15). */
export function LoginFlow() {
  const params = useSearchParams();
  const router = useRouter();
  const initial = params.get("step");
  const [stage, setStage] = useState<Stage>(
    initial === "mfa" ? { kind: "mfa" } : initial === "enrol" ? { kind: "enrol" } : { kind: "password" },
  );
  const [error, setError] = useState<string | null>(errorCopy[params.get("error") ?? ""] ?? null);
  const [pending, start] = useTransition();
  const nextPath = (() => {
    const n = params.get("next");
    return n && n.startsWith("/admin") && !n.startsWith("/admin/login") ? n : "/admin";
  })();

  const follow = (res: SignInResult) => {
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setError(null);
    if (res.next === "done") {
      router.replace(nextPath);
      router.refresh();
    } else if (res.next === "mfa") setStage({ kind: "mfa" });
    else setStage({ kind: "enrol" });
  };

  const beginEnrol = () =>
    start(async () => {
      const res = await startEnrol();
      if (!res.ok) setError(res.error);
      else setStage({ kind: "enrol", factorId: res.factorId, qr: res.qr, secret: res.secret });
    });

  return (
    <div>
      {stage.kind === "password" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const data = new FormData(e.currentTarget);
            start(async () => follow(await signIn({ email: data.get("email"), password: data.get("password") })));
          }}
        >
          <h1 className="type-h3">Sign in</h1>
          <div className="mt-6 grid gap-5">
            <Field name="email" label="Email">
              <TextInput id="f-email" name="email" type="email" autoComplete="username" required />
            </Field>
            <Field name="password" label="Password">
              <TextInput id="f-password" name="password" type="password" autoComplete="current-password" required />
            </Field>
          </div>
          {error && (
            <p role="alert" className="mt-4 font-medium text-orange-700">
              {error}
            </p>
          )}
          <Button type="submit" className="mt-6 w-full" disabled={pending}>
            {pending && <Loader2 aria-hidden="true" size={20} className="animate-spin" />}
            Sign in
          </Button>
        </form>
      )}

      {stage.kind === "mfa" && (
        <CodeForm
          title="Enter your code"
          body="Open your authenticator app and enter the 6-digit code for KK Fit Hub."
          pending={pending}
          error={error}
          onSubmit={(code) => start(async () => follow(await verifyCode({ code })))}
        />
      )}

      {stage.kind === "enrol" && !stage.factorId && (
        <div>
          <h1 className="type-h3">Set up two-factor sign-in</h1>
          <p className="mt-3 text-text-2">
            The owner account needs an authenticator app, such as Google Authenticator or Microsoft Authenticator.
          </p>
          {error && (
            <p role="alert" className="mt-4 font-medium text-orange-700">
              {error}
            </p>
          )}
          <Button className="mt-6 w-full" onClick={beginEnrol} disabled={pending}>
            {pending && <Loader2 aria-hidden="true" size={20} className="animate-spin" />}
            Set up authenticator
          </Button>
        </div>
      )}

      {stage.kind === "enrol" && stage.factorId && (
        <div>
          <h1 className="type-h3">Scan this code</h1>
          <p className="mt-3 text-text-2">Scan it with your authenticator app, then enter the 6-digit code it shows.</p>
          {stage.qr && (
            // eslint-disable-next-line @next/next/no-img-element -- data URI from Supabase Auth
            <img src={stage.qr} alt="QR code for your authenticator app" width={200} height={200} className="mx-auto mt-6 rounded-xl bg-white p-2" />
          )}
          <p className="mt-4 text-center type-small text-text-2">
            Can&apos;t scan? Enter this key: <code className="font-mono break-all text-text" data-totp-secret>{stage.secret}</code>
          </p>
          <CodeForm
            pending={pending}
            error={error}
            onSubmit={(code) => start(async () => follow(await verifyCode({ factorId: stage.factorId, code })))}
          />
        </div>
      )}
    </div>
  );
}

function CodeForm({
  title,
  body,
  pending,
  error,
  onSubmit,
}: {
  title?: string;
  body?: string;
  pending: boolean;
  error: string | null;
  onSubmit: (code: string) => void;
}) {
  return (
    <form
      className="mt-6"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(String(new FormData(e.currentTarget).get("code") ?? "").replace(/\s/g, ""));
      }}
    >
      {title && <h1 className="type-h3">{title}</h1>}
      {body && <p className="mt-3 mb-6 text-text-2">{body}</p>}
      <Field name="code" label="6-digit code">
        <TextInput
          id="f-code"
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9 ]{6,7}"
          maxLength={7}
          required
          className="tracking-[0.3em] tabular"
        />
      </Field>
      {error && (
        <p role="alert" className="mt-4 font-medium text-orange-700">
          {error}
        </p>
      )}
      <Button type="submit" className="mt-6 w-full" disabled={pending}>
        {pending && <Loader2 aria-hidden="true" size={20} className="animate-spin" />}
        Verify
      </Button>
    </form>
  );
}
