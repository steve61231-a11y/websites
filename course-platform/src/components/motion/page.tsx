import type { ReactNode } from "react";

// Every page fades in as it arrives. Deliberately not a View Transition:
// those snapshot the whole old and new page on every navigation, which made
// page changes stall on phones. Opacity only, so fixed bars inside the page
// keep their position while it plays.
export function PageTransition({ children }: { children: ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
