"use client";

import { useEffect } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { SectionShell } from "@/components/site/SectionShell";

/** Error page for public routes: recover the visitor without losing the site. */
export default function SiteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <SectionShell theme="dark" pad={false} className="bg-stage-glow grid min-h-[max(560px,80svh)] place-items-center pt-(--header-h)">
      <div className="container-site py-24 text-center">
        <h1 className="type-display-l">Something went wrong.</h1>
        <p className="type-lead mx-auto mt-6 max-w-[34ch] text-fg-2">
          Please try again. If it keeps happening, call or WhatsApp us.
        </p>
        <div className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
          <Button size="lg" onClick={reset} cta="error-retry">
            Try again
          </Button>
          <ButtonLink href="/" variant="secondary" size="lg" cta="error-home">
            Back to home
          </ButtonLink>
        </div>
      </div>
    </SectionShell>
  );
}
