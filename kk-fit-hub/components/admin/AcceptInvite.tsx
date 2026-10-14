"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { setPassword } from "@/actions/auth";
import { createAdminBrowserClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/Button";
import { Field, TextInput } from "@/components/forms/fields";

/**
 * Invite links (created in Team) sign the new staff member in and land
 * here, where they choose a password.
 */
export function AcceptInvite() {
  const router = useRouter();
  const [ready, setReady] = useState<"checking" | "ok" | "expired">("checking");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    const supabase = createAdminBrowserClient();
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const access_token = hash.get("access_token");
    const refresh_token = hash.get("refresh_token");
    (async () => {
      if (access_token && refresh_token) {
        const { error } = await supabase.auth.setSession({ access_token, refresh_token });
        window.history.replaceState(null, "", window.location.pathname);
        setReady(error ? "expired" : "ok");
        return;
      }
      const { data } = await supabase.auth.getUser();
      setReady(data.user ? "ok" : "expired");
    })();
  }, []);

  if (ready === "checking") return <p className="text-text-2">Checking your invite…</p>;
  if (ready === "expired")
    return (
      <div>
        <h1 className="type-h3">This invite link has expired</h1>
        <p className="mt-3 text-text-2">Ask the owner to send you a new one.</p>
      </div>
    );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const password = String(new FormData(e.currentTarget).get("password") ?? "");
        start(async () => {
          const res = await setPassword({ password });
          if (!res.ok) setError(res.error);
          else router.replace(res.next === "done" ? "/admin" : `/admin/login?step=${res.next}`);
        });
      }}
    >
      <h1 className="type-h3">Choose a password</h1>
      <p className="mt-3 mb-6 text-text-2">Use at least 10 characters.</p>
      <Field name="password" label="New password">
        <TextInput id="f-password" name="password" type="password" autoComplete="new-password" minLength={10} required />
      </Field>
      {error && (
        <p role="alert" className="mt-4 font-medium text-orange-700">
          {error}
        </p>
      )}
      <Button type="submit" className="mt-6 w-full" disabled={pending}>
        {pending && <Loader2 aria-hidden="true" size={20} className="animate-spin" />}
        Save password
      </Button>
    </form>
  );
}
