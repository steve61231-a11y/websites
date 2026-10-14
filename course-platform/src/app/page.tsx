import { CourseList, HomeHero, HowItWorks, HowWeHelp } from "@/components/home/catalog";
import { TrustedBy } from "@/components/site/social-proof";
import { SiteFooter } from "@/components/site/footer";
import { SiteNav } from "@/components/site/nav";
import { PageTransition } from "@/components/motion/page";

export default function Home() {
  return (
    <>
      <SiteNav />
      <PageTransition>
        <main className="bg-black">
          <HomeHero />
          <TrustedBy />
          <CourseList />
          <HowWeHelp />
          <HowItWorks />
        </main>
      </PageTransition>
      <SiteFooter />
    </>
  );
}
