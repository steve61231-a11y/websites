import { CourseList, HomeHero, HowItWorks } from "@/components/home/catalog";
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
          <CourseList />
          <HowItWorks />
        </main>
      </PageTransition>
      <SiteFooter />
    </>
  );
}
