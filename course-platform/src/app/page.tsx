import { ViewTransition } from "react";
import { CourseList, HomeHero, HowItWorks } from "@/components/home/catalog";
import { SiteFooter } from "@/components/site/footer";
import { SiteNav } from "@/components/site/nav";

export default function Home() {
  return (
    <>
      <SiteNav />
      <ViewTransition enter="page-fade" exit="page-fade" default="none">
        <main className="bg-black">
          <HomeHero />
          <CourseList />
          <HowItWorks />
        </main>
      </ViewTransition>
      <SiteFooter />
    </>
  );
}
