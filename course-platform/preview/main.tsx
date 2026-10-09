import { Component, Suspense, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import { RouterProvider } from "./shims/router";
import Link from "./shims/link";

import { SmoothScroll } from "@/components/motion/smooth-scroll";
import { PageTransition } from "@/components/motion/page";
import Home from "@/app/page";
import { EnrollFlow } from "@/app/enroll/enroll-flow";
import { Welcome } from "@/app/welcome/welcome";
import { SignInFlow } from "@/app/sign-in/sign-in-flow";
import LearnPage from "@/app/learn/page";
import CompletePage from "@/app/learn/complete/page";
import { LessonView } from "@/app/learn/[episode]/[lesson]/lesson-view";
import { ResumeDay } from "@/app/learn/[episode]/resume-day";
import { transcriptFor } from "./shims/transcripts";
import { QuizView } from "@/app/learn/[episode]/quiz/quiz-view";
import { CertificateView } from "@/app/certificate/[number]/certificate-view";
import VerifyPage from "@/app/verify/page";
import AccountPage from "@/app/account/page";
import { AppBar } from "@/components/learn/app-bar";
import { StudentGate } from "@/components/student-gate";
import { course, getCourse, getEpisode, getLesson } from "@/lib/catalog";
import { CourseHero } from "@/components/course/hero";
import { Curriculum } from "@/components/course/curriculum";
import { Faq, Instructor, Outcomes, Pricing } from "@/components/course/sections";
import { SiteFooter } from "@/components/site/footer";
import { SiteNav } from "@/components/site/nav";

// The same screens the Next.js app renders, mapped to an in-memory router.
type Render = (params: Record<string, string>) => ReactNode;

const routes: [string, Render][] = [
  ["/", () => <Home />],
  [
    "/courses/:slug",
    ({ slug }) => {
      const c = getCourse(slug);
      if (!c) return null;
      return (
        <>
          <SiteNav />
          <main className="bg-black">
            <CourseHero course={c} />
            <Curriculum course={c} />
            <Outcomes course={c} />
            <Instructor course={c} />
            <Pricing course={c} />
            <Faq course={c} />
          </main>
          <SiteFooter />
        </>
      );
    },
  ],
  ["/enroll", () => <EnrollFlow />],
  ["/welcome", () => <Welcome />],
  ["/sign-in", () => <SignInFlow />],
  ["/learn", () => <LearnPage />],
  ["/learn/complete", () => <CompletePage />],
  [
    "/learn/:episode",
    ({ episode }) => {
      const ep = getEpisode(episode);
      if (!ep) return null;
      return (
        <>
          <AppBar />
          <main className="min-h-dvh bg-black">
            <StudentGate courseId={course.id}>
              <ResumeDay slug={ep.slug} />
            </StudentGate>
          </main>
        </>
      );
    },
  ],
  [
    "/learn/:episode/quiz",
    ({ episode }) => {
      const ep = getEpisode(episode);
      if (!ep?.quiz) return null;
      return (
        <main className="min-h-dvh bg-black">
          <StudentGate courseId={course.id}>
            <QuizView key={ep.slug} slug={ep.slug} />
          </StudentGate>
        </main>
      );
    },
  ],
  // After /quiz: both have three segments and the first match wins.
  [
    "/learn/:episode/:lesson",
    ({ episode, lesson }) => {
      const found = getLesson(episode, lesson);
      if (!found) return null;
      return (
        <>
          <AppBar center={<span className="hidden sm:inline"><span className="text-white">{found.ep.label}</span> · {found.lesson.title}</span>} />
          <main className="min-h-dvh bg-black">
            <StudentGate courseId={course.id}>
              <LessonView key={found.lesson.id} episodeSlug={found.ep.slug} lessonSlug={found.lesson.slug} transcript={transcriptFor(course.id, found.lesson.slug)} />
            </StudentGate>
          </main>
        </>
      );
    },
  ],
  ["/certificate/:number", ({ number }) => <CertificateView number={decodeURIComponent(number)} />],
  ["/verify", () => <VerifyPage />],
  ["/account", () => <AccountPage />],
];

function match(path: string) {
  const parts = path.split("/").filter(Boolean);
  for (const [pattern, render] of routes) {
    const segs = pattern.split("/").filter(Boolean);
    if (segs.length !== parts.length) continue;
    const params: Record<string, string> = {};
    if (segs.every((s, i) => (s.startsWith(":") ? ((params[s.slice(1)] = parts[i]), true) : s === parts[i]))) return { pattern, render, params };
  }
  return null;
}

function NotFound() {
  return (
    <div className="wrap flex min-h-dvh flex-col items-center justify-center text-center">
      <h1 className="headline text-[30px] text-white">This page doesn&apos;t exist.</h1>
      <Link href="/" className="btn btn-white mt-8">Go home</Link>
    </div>
  );
}

class Boundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? <NotFound /> : this.props.children;
  }
}

// These render a page.tsx that already wraps itself in <PageTransition>.
const SELF_WRAPPED = new Set(["/", "/learn", "/learn/complete", "/verify", "/account"]);

function Route({ path }: { path: string }) {
  const m = match(path);
  const node = m ? m.render(m.params) : null;
  if (!node) return <NotFound />;
  return SELF_WRAPPED.has(m!.pattern) ? node : <PageTransition>{node}</PageTransition>;
}

createRoot(document.getElementById("root")!).render(
  <RouterProvider>
    {(loc) => (
      <>
        <SmoothScroll />
        <Boundary key={loc.path}>
          <Suspense fallback={<div className="min-h-dvh bg-black" />}>
            <Route path={loc.path} />
          </Suspense>
        </Boundary>
      </>
    )}
  </RouterProvider>,
);
