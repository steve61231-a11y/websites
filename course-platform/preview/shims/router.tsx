import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

// In-memory router for the single-file preview. The artifact frame only allows
// bare #anchors in its URL, so routes live in React state (and sessionStorage
// so a reload returns to the same screen).

type Loc = { path: string; query: string };
type Ctx = { loc: Loc; push: (href: string) => void; replace: (href: string) => void; back: () => void };

const RouterCtx = createContext<Ctx | null>(null);
const KEY = "lumen-preview-route";

function parse(href: string): { loc: Loc; anchor?: string } {
  const [beforeHash, anchor] = href.split("#");
  const [path, query = ""] = beforeHash.split("?");
  return { loc: { path: path || "/", query }, anchor };
}

function initial(): Loc {
  try {
    const saved = sessionStorage.getItem(KEY);
    if (saved) return parse(saved).loc;
  } catch {}
  return { path: "/", query: "" };
}

function scrollToAnchor(anchor?: string) {
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      if (anchor) document.getElementById(anchor)?.scrollIntoView({ behavior: "smooth" });
      else window.scrollTo(0, 0);
    }),
  );
}

export function RouterProvider({ children }: { children: (loc: Loc) => ReactNode }) {
  const [stack, setStack] = useState<Loc[]>(() => [initial()]);
  const loc = stack[stack.length - 1];

  useEffect(() => {
    try {
      sessionStorage.setItem(KEY, loc.path + (loc.query ? `?${loc.query}` : ""));
    } catch {}
  }, [loc]);

  const go = (href: string, mode: "push" | "replace") => {
    if (href.startsWith("#")) return scrollToAnchor(href.slice(1));
    const { loc: next, anchor } = parse(href);
    const same = next.path === loc.path && next.query === loc.query;
    if (!same) setStack((s) => (mode === "push" ? [...s, next] : [...s.slice(0, -1), next]));
    scrollToAnchor(anchor);
  };

  // Plain in-page anchors (<a href="#curriculum">) scroll instead of changing the URL.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest?.("a");
      const href = a?.getAttribute("href");
      if (href?.startsWith("#")) {
        e.preventDefault();
        scrollToAnchor(href.slice(1));
      }
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  const ctx: Ctx = {
    loc,
    push: (h) => go(h, "push"),
    replace: (h) => go(h, "replace"),
    back: () => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s)),
  };
  return <RouterCtx.Provider value={ctx}>{children(loc)}</RouterCtx.Provider>;
}

export function useRouterCtx() {
  const ctx = useContext(RouterCtx);
  if (!ctx) throw new Error("Router missing");
  return ctx;
}
