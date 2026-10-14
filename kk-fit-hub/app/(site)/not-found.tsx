import { notFoundPage } from "@/content/pages";
import { ButtonLink, TextLink } from "@/components/ui/Button";
import { SectionShell } from "@/components/site/SectionShell";

/** 7.9 404: recover the visitor. */
export default function NotFound() {
  return (
    <SectionShell
      theme="dark"
      pad={false}
      className="bg-stage-glow grain grid min-h-[max(560px,80svh)] place-items-center pt-(--header-h)"
    >
      <div className="container-site py-24 text-center">
        <h1 className="type-display-xl rise-in-solid">{notFoundPage.h1}</h1>
        <p className="type-lead rise-in-solid mx-auto mt-6 max-w-[34ch] text-fg-2" style={{ "--i": 1 } as React.CSSProperties}>
          {notFoundPage.body}
        </p>
        <div
          className="rise-in mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center sm:gap-6"
          style={{ "--i": 2 } as React.CSSProperties}
        >
          <ButtonLink href="/" cta="notfound-home" size="lg">
            Back to home
          </ButtonLink>
          <TextLink href="/programmes" cta="notfound-programmes" className="justify-center">
            See programmes
          </TextLink>
        </div>
      </div>
    </SectionShell>
  );
}
