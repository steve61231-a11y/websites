import { SectionShell } from "@/components/site/SectionShell";

export default function HomePage() {
  return (
    <>
      <SectionShell theme="dark" className="min-h-svh">
        <div className="container-site pt-24">
          <h1 className="type-display-xl">Beyond the books.</h1>
        </div>
      </SectionShell>
      <SectionShell theme="light" className="min-h-svh">
        <div className="container-site">
          <p className="type-statement">Books build knowledge. Activity builds the learner.</p>
        </div>
      </SectionShell>
    </>
  );
}
