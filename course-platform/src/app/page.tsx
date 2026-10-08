import { ViewTransition } from "react";
import { Faq, FinalCta, HowWeHelp, Instructor, Pricing } from "@/components/landing/sections";
import { SevenDays } from "@/components/landing/seven-days";
import { StudioStory } from "@/components/landing/studio-story";
import { SiteFooter } from "@/components/site/footer";
import { SiteNav } from "@/components/site/nav";

export default function Home() {
  return (
    <>
      <SiteNav />
      <ViewTransition enter="page-fade" exit="page-fade" default="none">
        <main>
          <StudioStory />
          <SevenDays />
          <HowWeHelp />
          <Instructor />
          <Pricing />
          <Faq />
          <FinalCta />
        </main>
      </ViewTransition>
      <SiteFooter />
    </>
  );
}
