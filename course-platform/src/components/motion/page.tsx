import { ViewTransition, type ReactNode } from "react";

// Every page enters and leaves the same way. Links tagged
// transitionTypes={["nav-forward"]} slide the new page in from the right,
// "nav-back" from the left; anything else cross-fades.
const PAGE = { "nav-forward": "slide-forward", "nav-back": "slide-back", default: "page-fade" };

export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter={PAGE} exit={PAGE} default="none">
      {children}
    </ViewTransition>
  );
}
