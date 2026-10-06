import { Component, useEffect, useState, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import { RouterProvider } from "./shims/router";
import Link from "./shims/link";

import Home from "@/app/page";
import Courses from "@/app/courses/page";
import CoursePage from "@/app/courses/[slug]/page";
import Checkout from "@/app/checkout/[slug]/page";
import Login from "@/app/login/page";
import Dashboard from "@/app/dashboard/page";
import LearnCourse from "@/app/learn/[slug]/page";
import Lesson from "@/app/learn/[slug]/[lesson]/page";
import Quiz from "@/app/learn/[slug]/quiz/[module]/page";
import Complete from "@/app/learn/[slug]/complete/page";
import Certificates from "@/app/certificates/page";
import { CertificateView } from "@/app/certificates/[number]/certificate-view";
import Verify from "@/app/verify/page";
import Profile from "@/app/profile/page";

// The same page modules the Next.js app uses, called with resolved params.
type Page = (props: { params: Promise<Record<string, string>>; searchParams: Promise<Record<string, string>> }) => ReactNode | Promise<ReactNode>;

const routes: [string, Page][] = [
  ["/", Home as Page],
  ["/courses", Courses as Page],
  ["/courses/:slug", CoursePage as Page],
  ["/checkout/:slug", Checkout as Page],
  ["/login", Login as Page],
  ["/dashboard", Dashboard as Page],
  ["/learn/:slug", LearnCourse as Page],
  ["/learn/:slug/quiz/:module", Quiz as Page],
  ["/learn/:slug/complete", Complete as Page],
  ["/learn/:slug/:lesson", Lesson as Page],
  ["/certificates", Certificates as Page],
  ["/certificates/:number", (({ params }) => params.then((p) => <CertificateView number={decodeURIComponent(p.number)} />)) as Page],
  ["/verify", Verify as Page],
  ["/profile", Profile as Page],
];

function match(path: string) {
  const parts = path.split("/").filter(Boolean);
  for (const [pattern, page] of routes) {
    const segs = pattern.split("/").filter(Boolean);
    if (segs.length !== parts.length) continue;
    const params: Record<string, string> = {};
    if (segs.every((s, i) => (s.startsWith(":") ? ((params[s.slice(1)] = parts[i]), true) : s === parts[i]))) return { page, params };
  }
  return null;
}

function NotFound() {
  return (
    <div className="wrap flex min-h-dvh flex-col items-center justify-center text-center">
      <h1 className="text-[28px] font-semibold tracking-[-0.02em]">This page doesn&apos;t exist.</h1>
      <Link href="/" className="btn btn-primary mt-8">Go home</Link>
    </div>
  );
}

function Route({ path }: { path: string }) {
  const [node, setNode] = useState<ReactNode>(null);
  useEffect(() => {
    let live = true;
    const m = match(path);
    if (!m) {
      setNode(<NotFound />);
      return;
    }
    Promise.resolve()
      .then(() => m.page({ params: Promise.resolve(m.params), searchParams: Promise.resolve({}) }))
      .then((n) => live && setNode(n), () => live && setNode(<NotFound />));
    return () => {
      live = false;
    };
  }, [path]);
  return <>{node}</>;
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

createRoot(document.getElementById("root")!).render(
  <RouterProvider>{(loc) => <Boundary key={loc.path}><Route path={loc.path} /></Boundary>}</RouterProvider>,
);
